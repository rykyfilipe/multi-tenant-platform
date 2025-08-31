/** @format */

import prisma from "@/lib/prisma";
import { getModuleDefinition } from "./modules";

/**
 * Creates tables for a specific module in a database
 * @param databaseId - The database ID where tables will be created
 * @param moduleId - The module ID (e.g., 'billing')
 * @returns Object with created tables
 */
export async function createModuleTables(databaseId: number, moduleId: string) {
  try {
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
  createdTables: Record<string, any>
) {
  for (const columnDef of columnDefs) {
    // Resolve reference table ID if this is a reference column
    let referenceTableId: number | undefined;
    
    if (columnDef.type === "reference" && columnDef.name.includes("customer_id")) {
      referenceTableId = createdTables.customers?.id;
    } else if (columnDef.type === "reference" && columnDef.name.includes("invoice_id")) {
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
    // Find all tables for this module in the database
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

    console.log(`✅ Removed ${moduleTables.length} tables for module '${moduleId}'`);
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
export async function hasModuleTables(databaseId: number, moduleId: string): Promise<boolean> {
  try {
    const tableCount = await prisma.table.count({
      where: {
        databaseId,
        moduleType: moduleId,
        isModuleTable: true,
      },
    });

    return tableCount > 0;
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
  } catch (error) {
    console.error(`❌ Error getting module tables for '${moduleId}':`, error);
    return [];
  }
}
