/**
 * Integration tests for table rows API endpoint
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import prisma from '@/lib/prisma';
import { createTestUser, createTestTenant, createTestDatabase, createTestTable, createTestColumns, createTestRows } from '../../../../../../tests/utils/test-helpers';

describe('Table Rows API - Filtering Integration', () => {
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
      { name: 'name', type: 'text', required: true },
      { name: 'age', type: 'number', required: false },
      { name: 'email', type: 'email', required: false },
      { name: 'active', type: 'boolean', required: false },
      { name: 'created_at', type: 'date', required: false },
      { name: 'tags', type: 'reference', required: false }
    ]);

    // Create test rows
    testRows = await createTestRows(testTable.id, [
      {
        cells: [
          { columnId: testColumns[0].id, value: 'John Doe' },
          { columnId: testColumns[1].id, value: 25 },
          { columnId: testColumns[2].id, value: 'john@example.com' },
          { columnId: testColumns[3].id, value: true },
          { columnId: testColumns[4].id, value: '2024-01-01T00:00:00Z' },
          { columnId: testColumns[5].id, value: ['tag1', 'tag2'] }
        ]
      },
      {
        cells: [
          { columnId: testColumns[0].id, value: 'Jane Smith' },
          { columnId: testColumns[1].id, value: 30 },
          { columnId: testColumns[2].id, value: 'jane@example.com' },
          { columnId: testColumns[3].id, value: false },
          { columnId: testColumns[4].id, value: '2024-01-02T00:00:00Z' },
          { columnId: testColumns[5].id, value: ['tag2', 'tag3'] }
        ]
      },
      {
        cells: [
          { columnId: testColumns[0].id, value: 'Bob Johnson' },
          { columnId: testColumns[1].id, value: 35 },
          { columnId: testColumns[2].id, value: 'bob@example.com' },
          { columnId: testColumns[3].id, value: true },
          { columnId: testColumns[4].id, value: '2024-01-03T00:00:00Z' },
          { columnId: testColumns[5].id, value: 'tag1' }
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

  describe('Text Filtering', () => {
    it('should filter by contains operator', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[0].id,
          columnName: 'name',
          columnType: 'text',
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
          columnName: 'name',
          columnType: 'text',
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
          columnName: 'name',
          columnType: 'text',
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

    it('should filter by regex operator', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[0].id,
          columnName: 'name',
          columnType: 'text',
          operator: 'regex',
          value: '^[A-Z]'
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
      expect(data.data).toHaveLength(3); // All names start with capital letters
    });
  });

  describe('Numeric Filtering', () => {
    it('should filter by greater_than operator', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[1].id,
          columnName: 'age',
          columnType: 'number',
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
          columnName: 'age',
          columnType: 'number',
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
          columnName: 'active',
          columnType: 'boolean',
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

  describe('Date Filtering', () => {
    it('should filter by date equals', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[4].id,
          columnName: 'created_at',
          columnType: 'date',
          operator: 'equals',
          value: '2024-01-01'
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
      expect(data.data).toHaveLength(1); // Only John's record
    });

    it('should filter by today operator', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[4].id,
          columnName: 'created_at',
          columnType: 'date',
          operator: 'today',
          value: null
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
      // Should return 0 results since test data is from January 2024
      expect(data.data).toHaveLength(0);
    });
  });

  describe('Reference Filtering', () => {
    it('should filter by reference equals (array)', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[5].id,
          columnName: 'tags',
          columnType: 'reference',
          operator: 'equals',
          value: 'tag1'
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
      expect(data.data).toHaveLength(2); // John and Bob have tag1
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
            columnName: 'age',
            columnType: 'number',
            operator: 'greater_than',
            value: 25
          },
          {
            columnId: testColumns[3].id,
            columnName: 'active',
            columnType: 'boolean',
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

  describe('Empty Value Filters', () => {
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
          columnName: 'name',
          columnType: 'text',
          operator: 'is_empty',
          value: null
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

  describe('Pagination with Filters', () => {
    it('should maintain correct pagination with filters applied', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: testColumns[1].id,
          columnName: 'age',
          columnType: 'number',
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

  describe('Error Handling', () => {
    it('should handle invalid filter configurations gracefully', async () => {
      const request = new NextRequest(
        `http://localhost/api/tenants/${testTenant.id}/databases/${testDatabase.id}/tables/${testTable.id}/rows?filters=${encodeURIComponent(JSON.stringify([{
          columnId: 999, // Non-existent column
          columnName: 'invalid',
          columnType: 'text',
          operator: 'contains',
          value: 'test'
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
      expect(data.data).toHaveLength(3); // Should return all rows since invalid filter is ignored
    });
  });
});
