/**
 * @format
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/rows/route';
import prisma from '@/lib/prisma';
import { createTestUser, createTestTenant, createTestDatabase, createTestTable, createTestColumns, createTestRows } from '../utils/test-helpers';

describe('Table Filtering System', () => {
  let testUser: any;
  let testTenant: any;
  let testDatabase: any;
  let testTable: any;
  let testColumns: any[];
  let testRows: any[];

  beforeAll(async () => {
    // Create test data
    testUser = await createTestUser();
    testTenant = await createTestTenant(testUser.id);
    testDatabase = await createTestDatabase(testTenant.id);
    testTable = await createTestTable(testDatabase.id);
    
    // Create test columns
    testColumns = await createTestColumns(testTable.id, [
      { name: 'name', type: 'string', required: true },
      { name: 'age', type: 'number', required: false },
      { name: 'email', type: 'email', required: false },
      { name: 'active', type: 'boolean', required: false },
      { name: 'created_at', type: 'date', required: false }
    ]);

    // Create test rows
    testRows = await createTestRows(testTable.id, [
      {
        cells: [
          { columnId: testColumns[0].id, value: 'John Doe' },
          { columnId: testColumns[1].id, value: 25 },
          { columnId: testColumns[2].id, value: 'john@example.com' },
          { columnId: testColumns[3].id, value: true },
          { columnId: testColumns[4].id, value: '2024-01-01T00:00:00Z' }
        ]
      },
      {
        cells: [
          { columnId: testColumns[0].id, value: 'Jane Smith' },
          { columnId: testColumns[1].id, value: 30 },
          { columnId: testColumns[2].id, value: 'jane@example.com' },
          { columnId: testColumns[3].id, value: false },
          { columnId: testColumns[4].id, value: '2024-01-02T00:00:00Z' }
        ]
      },
      {
        cells: [
          { columnId: testColumns[0].id, value: 'Bob Johnson' },
          { columnId: testColumns[1].id, value: 35 },
          { columnId: testColumns[2].id, value: 'bob@example.com' },
          { columnId: testColumns[3].id, value: true },
          { columnId: testColumns[4].id, value: '2024-01-03T00:00:00Z' }
        ]
      }
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.cell.deleteMany({
      where: { row: { tableId: testTable.id } }
    });
    await prisma.row.deleteMany({
      where: { tableId: testTable.id }
    });
    await prisma.column.deleteMany({
      where: { tableId: testTable.id }
    });
    await prisma.table.deleteMany({
      where: { id: testTable.id }
    });
    await prisma.database.deleteMany({
      where: { id: testDatabase.id }
    });
    await prisma.tenant.deleteMany({
      where: { id: testTenant.id }
    });
    await prisma.user.deleteMany({
      where: { id: testUser.id }
    });
  });

  describe('String Filtering', () => {
    it('should filter by contains operator', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[0].id,
          operator: 'contains',
          value: 'John'
        }]))}`
      );

      const response = await GET(request, {
        params: Promise.resolve({
          tenantId: testTenant.id.toString(),
          databaseId: testDatabase.id.toString(),
          tableId: testTable.id.toString()
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].cells.find((c: any) => c.columnId === testColumns[0].id).value).toBe('John Doe');
    });

    it('should filter by equals operator', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[0].id,
          operator: 'equals',
          value: 'Jane Smith'
        }]))}`
      );

      const response = await GET(request, {
        params: Promise.resolve({
          tenantId: testTenant.id.toString(),
          databaseId: testDatabase.id.toString(),
          tableId: testTable.id.toString()
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].cells.find((c: any) => c.columnId === testColumns[0].id).value).toBe('Jane Smith');
    });

    it('should filter by starts_with operator', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[0].id,
          operator: 'starts_with',
          value: 'J'
        }]))}`
      );

      const response = await GET(request, {
        params: Promise.resolve({
          tenantId: testTenant.id.toString(),
          databaseId: testDatabase.id.toString(),
          tableId: testTable.id.toString()
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2); // John Doe and Jane Smith
    });

    it('should filter by is_empty operator', async () => {
      // Create a row with empty name
      const emptyRow = await createTestRows(testTable.id, [{
        cells: [
          { columnId: testColumns[0].id, value: '' },
          { columnId: testColumns[1].id, value: 40 },
          { columnId: testColumns[2].id, value: 'empty@example.com' },
          { columnId: testColumns[3].id, value: true },
          { columnId: testColumns[4].id, value: '2024-01-04T00:00:00Z' }
        ]
      }]);

      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[0].id,
          operator: 'is_empty',
          value: ''
        }]))}`
      );

      const response = await GET(request, {
        params: Promise.resolve({
          tenantId: testTenant.id.toString(),
          databaseId: testDatabase.id.toString(),
          tableId: testTable.id.toString()
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].cells.find((c: any) => c.columnId === testColumns[0].id).value).toBe('');
    });
  });

  describe('Number Filtering', () => {
    it('should filter by greater_than operator', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[1].id,
          operator: 'greater_than',
          value: 25
        }]))}`
      );

      const response = await GET(request, {
        params: Promise.resolve({
          tenantId: testTenant.id.toString(),
          databaseId: testDatabase.id.toString(),
          tableId: testTable.id.toString()
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2); // Jane (30) and Bob (35)
    });

    it('should filter by between operator', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[1].id,
          operator: 'between',
          value: 25,
          secondValue: 30
        }]))}`
      );

      const response = await GET(request, {
        params: Promise.resolve({
          tenantId: testTenant.id.toString(),
          databaseId: testDatabase.id.toString(),
          tableId: testTable.id.toString()
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2); // John (25) and Jane (30)
    });
  });

  describe('Boolean Filtering', () => {
    it('should filter by equals operator for boolean', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[3].id,
          operator: 'equals',
          value: true
        }]))}`
      );

      const response = await GET(request, {
        params: Promise.resolve({
          tenantId: testTenant.id.toString(),
          databaseId: testDatabase.id.toString(),
          tableId: testTable.id.toString()
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2); // John and Bob are active
    });
  });

  describe('Global Search', () => {
    it('should search across all columns', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?search=john`
      );

      const response = await GET(request, {
        params: Promise.resolve({
          tenantId: testTenant.id.toString(),
          databaseId: testDatabase.id.toString(),
          tableId: testTable.id.toString()
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].cells.find((c: any) => c.columnId === testColumns[0].id).value).toBe('John Doe');
    });
  });

  describe('Multiple Filters', () => {
    it('should combine multiple filters with AND logic', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([
          {
            columnId: testColumns[1].id,
            operator: 'greater_than',
            value: 25
          },
          {
            columnId: testColumns[3].id,
            operator: 'equals',
            value: true
          }
        ]))}`
      );

      const response = await GET(request, {
        params: Promise.resolve({
          tenantId: testTenant.id.toString(),
          databaseId: testDatabase.id.toString(),
          tableId: testTable.id.toString()
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1); // Only Bob (age 35, active true)
    });
  });

  describe('Pagination with Filters', () => {
    it('should maintain correct pagination with filters applied', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[1].id,
          operator: 'greater_than',
          value: 20
        }]))}&page=1&pageSize=2`
      );

      const response = await GET(request, {
        params: Promise.resolve({
          tenantId: testTenant.id.toString(),
          databaseId: testDatabase.id.toString(),
          tableId: testTable.id.toString()
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.totalRows).toBe(3);
      expect(data.pagination.totalPages).toBe(2);
    });
  });
});
