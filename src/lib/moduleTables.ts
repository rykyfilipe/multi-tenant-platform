/** @format */

import prisma from "@/lib/prisma";
import { getModuleDefinition } from "./modules";
import { InvoiceSystemService } from "./invoice-system";

/**
 * Creates tables for a specific module in a database
 * @param databaseId - The database ID where tables will be created
 * @param moduleId - The module ID (e.g., 'billing')
 * @returns Object with created tables
 */
export async function createModuleTables(databaseId: number, moduleId: string) {
	try {
		// For billing module, use InvoiceSystemService to create tables
		if (moduleId === "billing") {
			// Get tenant ID from database
			const database = await prisma.database.findUnique({
				where: { id: databaseId },
				select: { tenantId: true },
			});

			if (!database) {
				throw new Error(`Database with ID ${databaseId} not found`);
			}

			// Use InvoiceSystemService to create invoice tables
			const invoiceTables = await InvoiceSystemService.initializeInvoiceTables(
				database.tenantId,
				databaseId
			);

			// Convert to the expected format
			const createdTables: Record<string, any> = {
				customers: invoiceTables.customers,
				invoices: invoiceTables.invoices,
				invoice_items: invoiceTables.invoice_items,
			};

			return createdTables;
		}

		// For other modules, use the module definition
		const moduleDefinition = getModuleDefinition(moduleId);

		if (!moduleDefinition) {
			throw new Error(`Module '${moduleId}' not found`);
		}

		const createdTables: Record<string, any> = {};

		// Create tables for the module
		for (const tableDef of moduleDefinition.tables) {
			const table = await prisma.table.create({
				data: {
					name: tableDef.name,
					description: tableDef.description,
					databaseId,
					isProtected: tableDef.isProtected,
					protectedType: tableDef.protectedType,
					moduleType: moduleId,
					isModuleTable: true,
				},
			});

			createdTables[tableDef.name] = table;

			// Create columns for the table
			await createModuleTableColumns(table.id, tableDef.columns, createdTables);
		}

		return createdTables;
	} catch (error) {
		console.error(`❌ Error creating tables for module '${moduleId}':`, error);
		throw error;
	}
}

/**
 * Creates columns for a module table
 * @param tableId - The table ID where columns will be created
 * @param columnDefs - Array of column definitions
 * @param createdTables - Object with created tables for reference resolution
 */
async function createModuleTableColumns(
	tableId: number,
	columnDefs: any[],
	createdTables: Record<string, any>,
) {
	for (const columnDef of columnDefs) {
		// Resolve reference table ID if this is a reference column
		let referenceTableId: number | undefined;

		if (
			columnDef.type === "reference" &&
			columnDef.name.includes("customer_id")
		) {
			referenceTableId = createdTables.customers?.id;
		} else if (
			columnDef.type === "reference" &&
			columnDef.name.includes("invoice_id")
		) {
			referenceTableId = createdTables.invoices?.id;
		}

		await prisma.column.create({
			data: {
				name: columnDef.name,
				type: columnDef.type,
				semanticType: columnDef.semanticType,
				required: columnDef.required,
				primary: columnDef.primary,
				order: columnDef.order,
				isLocked: columnDef.isLocked,
				isModuleColumn: true,
				tableId,
				referenceTableId,
			},
		});
	}
}

/**
 * Removes all tables for a specific module from a database
 * Optimized with transaction and batch operations for faster deletion
 * @param databaseId - The database ID where tables will be removed
 * @param moduleId - The module ID (e.g., 'billing')
 */
export async function removeModuleTables(databaseId: number, moduleId: string) {
	try {
		// For billing module, remove invoice system tables
		if (moduleId === "billing") {
			// Use transaction for atomic and faster operations
			await prisma.$transaction(async (tx : any) => {
				// Get tenant ID first
				const database = await tx.database.findUnique({
					where: { id: databaseId },
					select: { tenantId: true },
				});

				if (!database) {
					throw new Error(`Database ${databaseId} not found`);
				}

				// Find and delete all invoice tables in parallel
				const [deletedCount, _] = await Promise.all([
					// Delete all invoice tables using deleteMany for faster batch operation
					tx.table.deleteMany({
						where: {
							databaseId,
							isProtected: true,
							protectedType: { in: ["customers", "invoices", "invoice_items"] },
						},
					}),
					// Update tenant settings in parallel
					tx.tenant.update({
						where: { id: database.tenantId },
						data: {
							invoiceSeriesPrefix: null,
							invoiceIncludeYear: null,
							invoiceStartNumber: null,
						},
					}),
				]);

				console.log(
					`✅ Removed ${deletedCount.count} invoice system tables for billing module`,
				);
			});

			console.log("✅ Removed invoice series settings from tenant");
		} else {
			// For other modules, use deleteMany for faster batch operation
			const deletedCount = await prisma.table.deleteMany({
				where: {
					databaseId,
					moduleType: moduleId,
					isModuleTable: true,
				},
			});

			console.log(
				`✅ Removed ${deletedCount.count} tables for module '${moduleId}'`,
			);
		}
	} catch (error) {
		console.error(`❌ Error removing tables for module '${moduleId}':`, error);
		throw error;
	}
}

/**
 * Checks if a module has tables in a database
 * @param databaseId - The database ID to check
 * @param moduleId - The module ID to check
 * @returns Boolean indicating if module tables exist
 */
export async function hasModuleTables(
	databaseId: number,
	moduleId: string,
): Promise<boolean> {
	try {
		if (moduleId === "billing") {
			// For billing module, check invoice system tables
			const tableCount = await prisma.table.count({
				where: {
					databaseId,
					isProtected: true,
					protectedType: { in: ["customers", "invoices", "invoice_items"] },
				},
			});

			return tableCount > 0;
		} else {
			// For other modules, check tables with moduleType
			const tableCount = await prisma.table.count({
				where: {
					databaseId,
					moduleType: moduleId,
					isModuleTable: true,
				},
			});

			return tableCount > 0;
		}
	} catch (error) {
		console.error(`❌ Error checking module tables for '${moduleId}':`, error);
		return false;
	}
}

/**
 * Gets all module tables for a database
 * @param databaseId - The database ID
 * @param moduleId - The module ID
 * @returns Array of module tables
 */
export async function getModuleTables(databaseId: number, moduleId: string) {
	try {
		if (moduleId === "billing") {
			// For billing module, get invoice system tables
			return await prisma.table.findMany({
				where: {
					databaseId,
					isProtected: true,
					protectedType: { in: ["customers", "invoices", "invoice_items"] },
				},
				include: {
					columns: true,
				},
			});
		} else {
			// For other modules, get tables with moduleType
			return await prisma.table.findMany({
				where: {
					databaseId,
					moduleType: moduleId,
					isModuleTable: true,
				},
				include: {
					columns: true,
				},
			});
		}
	} catch (error) {
		console.error(`❌ Error getting module tables for '${moduleId}':`, error);
		return [];
	}
}
