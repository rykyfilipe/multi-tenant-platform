/**
 * @format
 */

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function createTestUser() {
  const hashedPassword = await bcrypt.hash('testpassword', 10);
  
  return await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      password: hashedPassword,
      name: 'Test User',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });
}

export async function createTestTenant(userId: number) {
  return await prisma.tenant.create({
    data: {
      name: `Test Tenant ${Date.now()}`,
      description: 'Test tenant for filtering tests',
      ownerId: userId,
      settings: {},
    },
  });
}

export async function createTestDatabase(tenantId: number) {
  return await prisma.database.create({
    data: {
      name: `Test Database ${Date.now()}`,
      description: 'Test database for filtering tests',
      tenantId: tenantId,
      databaseName: `test_db_${Date.now()}`,
    },
  });
}

export async function createTestTable(databaseId: number) {
  return await prisma.table.create({
    data: {
      name: `Test Table ${Date.now()}`,
      description: 'Test table for filtering tests',
      databaseId: databaseId,
      isPublic: false,
    },
  });
}

export async function createTestColumns(tableId: number, columns: Array<{name: string, type: string, required: boolean}>) {
  const createdColumns = [];
  
  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    const createdColumn = await prisma.column.create({
      data: {
        name: column.name,
        type: column.type,
        required: column.required,
        tableId: tableId,
        order: i + 1,
        primary: i === 0, // First column is primary
      },
    });
    createdColumns.push(createdColumn);
  }
  
  return createdColumns;
}

export async function createTestRows(tableId: number, rows: Array<{cells: Array<{columnId: number, value: any}>}>) {
  const createdRows = [];
  
  for (const rowData of rows) {
    // Create the row
    const row = await prisma.row.create({
      data: {
        tableId: tableId,
        createdAt: new Date(),
      },
    });
    
    // Create the cells
    const cells = [];
    for (const cellData of rowData.cells) {
      const cell = await prisma.cell.create({
        data: {
          rowId: row.id,
          columnId: cellData.columnId,
          value: cellData.value,
        },
      });
      cells.push(cell);
    }
    
    createdRows.push({
      ...row,
      cells: cells,
    });
  }
  
  return createdRows;
}
