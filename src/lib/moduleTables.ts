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
 * @param databaseId - The database ID where tables will be removed
 * @param moduleId - The module ID (e.g., 'billing')
 */
export async function removeModuleTables(databaseId: number, moduleId: string) {
	try {
		// For billing module, remove invoice system tables
		if (moduleId === "billing") {
			// Find invoice system tables (customers, invoices, invoice_items)
			const invoiceTables = await prisma.table.findMany({
				where: {
					databaseId,
					isProtected: true,
					protectedType: { in: ["customers", "invoices", "invoice_items"] },
				},
				include: {
					columns: true,
					rows: true,
				},
			});

			// Delete invoice system tables (this will cascade delete columns and rows)
			for (const table of invoiceTables) {
				await prisma.table.delete({
					where: { id: table.id },
				});
			}

			console.log(
				`✅ Removed ${invoiceTables.length} invoice system tables for billing module`,
			);

			// Also remove invoice series settings from tenant
			await prisma.tenant.update({
				where: {
					id: (await prisma.database.findUnique({
						where: { id: databaseId },
						select: { tenantId: true },
					}))?.tenantId,
				},
				data: {
					invoiceSeriesPrefix: null,
					invoiceIncludeYear: null,
					invoiceStartNumber: null,
				},
			});

			console.log("✅ Removed invoice series settings from tenant");
		} else {
			// For other modules, find tables with moduleType
			const moduleTables = await prisma.table.findMany({
				where: {
					databaseId,
					moduleType: moduleId,
					isModuleTable: true,
				},
				include: {
					columns: true,
					rows: true,
				},
			});

			// Delete tables (this will cascade delete columns and rows)
			for (const table of moduleTables) {
				await prisma.table.delete({
					where: { id: table.id },
				});
			}

			console.log(
				`✅ Removed ${moduleTables.length} tables for module '${moduleId}'`,
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
