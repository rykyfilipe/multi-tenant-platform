/** @format */

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { TABLE_TEMPLATES } from "@/components/database/TableTemplateSelector";

interface TemplateTable {
	id: string;
	name: string;
	description: string;
	icon: any;
	category: string;
	dependencies: string[]; // Array of table IDs this table depends on
	columns: Array<{
		name: string;
		type: string;
		required?: boolean;
		primary?: boolean;
		semanticType?: string;
		customOptions?: string[];
		referenceTableName?: string; // Name of the referenced table (will be resolved to ID)
	}>;
}

export function useTableTemplates() {
	const { token, tenant, showAlert } = useApp();
	const { fetchTables, selectedDatabase } = useDatabase();
	const { checkLimit, isAtLimit } = usePlanLimits();
	const [isCreating, setIsCreating] = useState(false);
	const [progress, setProgress] = useState<{
		current: number;
		total: number;
		message: string;
	} | null>(null);

	// Sort templates by dependencies (independent tables first)
	const sortTemplatesByDependencies = (templates: TemplateTable[]): TemplateTable[] => {
		const sorted: TemplateTable[] = [];
		const visited = new Set<string>();
		const tempVisited = new Set<string>();

		const visit = (template: TemplateTable) => {
			if (tempVisited.has(template.id)) {
				throw new Error(`Circular dependency detected: ${template.id}`);
			}
			if (visited.has(template.id)) {
				return;
			}

			tempVisited.add(template.id);

			// Visit dependencies first
			for (const depId of template.dependencies) {
				const depTemplate = templates.find(t => t.id === depId);
				if (depTemplate) {
					visit(depTemplate);
				}
			}

			tempVisited.delete(template.id);
			visited.add(template.id);
			sorted.push(template);
		};

		for (const template of templates) {
			if (!visited.has(template.id)) {
				visit(template);
			}
		}

		return sorted;
	};

	// Check plan limits before creating tables
	const checkPlanLimits = (templates: TemplateTable[]): { allowed: boolean; message?: string } => {
		const tableLimit = checkLimit("tables");
		const newTablesCount = templates.length;
		
		if (tableLimit.current + newTablesCount > tableLimit.limit) {
			return {
				allowed: false,
				message: `Plan limit exceeded. You can only have ${tableLimit.limit} table(s). You currently have ${tableLimit.current} and want to create ${newTablesCount} more. Upgrade your plan to create more tables.`
			};
		}

		return { allowed: true };
	};

	const createTablesFromTemplates = async (
		templates: TemplateTable[],
		databaseId: number
	) => {
		if (!token || !tenant) {
			showAlert("Authentication required. Please log in again.", "error");
			return false;
		}

		// Check plan limits first
		const planCheck = checkPlanLimits(templates);
		if (!planCheck.allowed) {
			showAlert(planCheck.message || "Plan limit exceeded", "error");
			return false;
		}

		// Sort templates by dependencies
		const sortedTemplates = sortTemplatesByDependencies(templates);
		
		setIsCreating(true);
		setProgress({
			current: 0,
			total: sortedTemplates.length,
			message: "Starting table creation...",
		});

		try {
			const createdTables: any[] = [];
			const errors: string[] = [];
			const tableNameToId: Record<string, number> = {}; // Map table names to their IDs

			for (let i = 0; i < sortedTemplates.length; i++) {
				const template = sortedTemplates[i];
				
				setProgress({
					current: i + 1,
					total: sortedTemplates.length,
					message: `Creating table: ${template.name}`,
				});

				try {
					// 1. Create the table
					const tableResponse = await fetch(
						`/api/tenants/${tenant.id}/databases/${databaseId}/tables`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${token}`,
							},
							body: JSON.stringify({
								name: template.name,
								description: template.description,
							}),
						}
					);

					if (!tableResponse.ok) {
						const errorData = await tableResponse.json();
						
						// Check if it's a plan limit error
						if (tableResponse.status === 403 && errorData.plan === "tables") {
							throw new Error(`Plan limit exceeded: ${errorData.error}`);
						}
						
						throw new Error(errorData.error || `Failed to create table ${template.name}`);
					}

					const createdTable = await tableResponse.json();
					createdTables.push(createdTable);
					
					// Store the table ID for reference resolution
					tableNameToId[template.id] = createdTable.id;

					// 2. Create columns for the table
					const columnsToCreate = template.columns.map((col, index) => {
						const columnData: any = {
							...col,
							order: index,
						};

						// If this is a reference column, resolve the reference table ID
						if (col.type === "reference" && col.referenceTableName) {
							const referencedTableId = tableNameToId[col.referenceTableName];
							if (referencedTableId) {
								columnData.referenceTableId = referencedTableId;
							} else {
								throw new Error(`Referenced table ${col.referenceTableName} not found for column ${col.name} in table ${template.name}`);
							}
						}

						return columnData;
					});

					const columnsResponse = await fetch(
						`/api/tenants/${tenant.id}/databases/${databaseId}/tables/${createdTable.id}/columns`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${token}`,
							},
							body: JSON.stringify({
								columns: columnsToCreate,
							}),
						}
					);

					if (!columnsResponse.ok) {
						const errorData = await columnsResponse.json();
						throw new Error(errorData.error || `Failed to create columns for ${template.name}`);
					}

					// Add a small delay to prevent overwhelming the API
					await new Promise(resolve => setTimeout(resolve, 100));

				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : `Unknown error creating ${template.name}`;
					errors.push(errorMessage);
					console.error(`Error creating table ${template.name}:`, error);
				}
			}

			setProgress(null);

			if (errors.length > 0) {
				showAlert(
					`Created ${createdTables.length} tables successfully. ${errors.length} tables failed to create. Check console for details.`,
					"warning"
				);
			} else {
				showAlert(
					`Successfully created ${createdTables.length} tables from templates!`,
					"success"
				);
			}

			// Refresh tables in the database context to show new tables immediately
			if (createdTables.length > 0 && selectedDatabase) {
				await fetchTables();
			}

			return createdTables.length > 0;

		} catch (error) {
			setProgress(null);
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			showAlert(`Failed to create tables: ${errorMessage}`, "error");
			return false;
		} finally {
			setIsCreating(false);
		}
	};

	const getTemplateDependencies = (templateId: string): string[] => {
		const template = TABLE_TEMPLATES.find(t => t.id === templateId);
		return template?.dependencies || [];
	};

	const getIndependentTemplates = (): TemplateTable[] => {
		return TABLE_TEMPLATES.filter(t => t.dependencies.length === 0);
	};

	const getDependentTemplates = (): TemplateTable[] => {
		return TABLE_TEMPLATES.filter(t => t.dependencies.length > 0);
	};

	return {
		createTablesFromTemplates,
		getTemplateDependencies,
		getIndependentTemplates,
		getDependentTemplates,
		isCreating,
		progress,
		checkPlanLimits,
	};
}
