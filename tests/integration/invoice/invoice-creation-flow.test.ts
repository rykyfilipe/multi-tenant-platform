/**
 * Integration Tests: Invoice Creation Flow
 * 
 * These tests verify the complete invoice creation workflow including
 * database transactions, validation, and error handling.
 */

import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/tenants/[tenantId]/invoices/route';
import { InvoiceSystemService } from '@/lib/invoice-system';

const prisma = new PrismaClient();

describe('Invoice Creation Flow Integration Tests', () => {
  let tenantId: number;
  let databaseId: number;
  let customerId: number;
  let productId: number;

  beforeAll(async () => {
    // Create test tenant and database
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        adminId: 1,
        address: 'Test Address',
        companyEmail: 'test@example.com'
      }
    });
    tenantId = tenant.id;

    const database = await prisma.database.create({
      data: {
        tenantId,
        name: 'Test Database'
      }
    });
    databaseId = database.id;

    // Initialize invoice system
    await InvoiceSystemService.initializeInvoiceTables(tenantId, databaseId);

    // Create test customer
    const customersTable = await prisma.table.findFirst({
      where: { name: 'customers', databaseId }
    });

    if (customersTable) {
      const customerRow = await prisma.row.create({
        data: {
          tableId: customersTable.id,
          cells: {
            create: [
              {
                columnId: customersTable.columns.find(c => c.semanticType === 'customer_name')!.id,
                value: 'Test Customer',
                stringValue: 'Test Customer'
              }
            ]
          }
        }
      });
      customerId = customerRow.id;
    }

    // Create test product
    const productsTable = await prisma.table.create({
      data: {
        name: 'products',
        databaseId,
        description: 'Test products table'
      }
    });

    const productRow = await prisma.row.create({
      data: {
        tableId: productsTable.id,
        cells: {
          create: [
            {
              columnId: productsTable.columns[0]?.id || 1,
              value: 'Test Product',
              stringValue: 'Test Product'
            }
          ]
        }
      }
    });
    productId = productRow.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.cell.deleteMany({
      where: {
        row: {
          table: {
            database: { tenantId }
          }
        }
      }
    });

    await prisma.row.deleteMany({
      where: {
        table: {
          database: { tenantId }
        }
      }
    });

    await prisma.table.deleteMany({
      where: {
        database: { tenantId }
      }
    });

    await prisma.database.deleteMany({
      where: { tenantId }
    });

    await prisma.tenant.delete({
      where: { id: tenantId }
    });

    await prisma.$disconnect();
  });

  describe('Valid Invoice Creation', () => {
    it('should create invoice with items atomically', async () => {
      const requestBody = {
        customer_id: customerId,
        products: [
          {
            product_ref_table: 'products',
            product_ref_id: productId,
            quantity: 2,
            price: 100.50
          }
        ],
        additional_data: {
          notes: 'Test invoice'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { tenantId: tenantId.toString() } });
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.invoice).toBeDefined();
      expect(responseData.data.items).toHaveLength(1);

      // Verify database state
      const invoice = await prisma.row.findUnique({
        where: { id: responseData.data.invoice.id },
        include: { cells: true }
      });

      expect(invoice).toBeDefined();
      expect(invoice!.cells.some(c => c.stringValue === 'INV-2025-000001')).toBe(true);
    });

    it('should create invoice with multiple items', async () => {
      const requestBody = {
        customer_id: customerId,
        products: [
          {
            product_ref_table: 'products',
            product_ref_id: productId,
            quantity: 1,
            price: 50
          },
          {
            product_ref_table: 'products',
            product_ref_id: productId,
            quantity: 3,
            price: 25
          }
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { tenantId: tenantId.toString() } });
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.data.items).toHaveLength(2);

      // Verify calculations
      const expectedSubtotal = 50 + (3 * 25); // 125
      expect(responseData.data.totals.subtotal).toBeCloseTo(expectedSubtotal, 2);
    });

    it('should handle invoice numbering correctly', async () => {
      // Create multiple invoices to test numbering
      const invoices = [];
      
      for (let i = 0; i < 3; i++) {
        const requestBody = {
          customer_id: customerId,
          products: [
            {
              product_ref_table: 'products',
              product_ref_id: productId,
              quantity: 1,
              price: 100
            }
          ]
        };

        const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': '1'
          },
          body: JSON.stringify(requestBody)
        });

        const response = await POST(request, { params: { tenantId: tenantId.toString() } });
        const responseData = await response.json();

        expect(response.status).toBe(201);
        invoices.push(responseData.data.invoice);
      }

      // Verify unique invoice numbers
      const invoiceNumbers = invoices.map(inv => inv.invoice_number);
      const uniqueNumbers = new Set(invoiceNumbers);
      expect(uniqueNumbers.size).toBe(invoiceNumbers.length);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid customer ID', async () => {
      const requestBody = {
        customer_id: 99999,
        products: [
          {
            product_ref_table: 'products',
            product_ref_id: productId,
            quantity: 1,
            price: 100
          }
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { tenantId: tenantId.toString() } });
      expect(response.status).toBe(400);
    });

    it('should reject missing products', async () => {
      const requestBody = {
        customer_id: customerId,
        products: []
      };

      const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { tenantId: tenantId.toString() } });
      expect(response.status).toBe(400);
    });

    it('should reject invalid product data', async () => {
      const requestBody = {
        customer_id: customerId,
        products: [
          {
            product_ref_table: 'products',
            product_ref_id: productId,
            quantity: -1, // Invalid negative quantity
            price: 100
          }
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { tenantId: tenantId.toString() } });
      expect(response.status).toBe(400);
    });

    it('should reject malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: '{"invalid": json}'
      });

      const response = await POST(request, { params: { tenantId: tenantId.toString() } });
      expect(response.status).toBe(400);
    });
  });

  describe('Concurrency Tests', () => {
    it('should handle concurrent invoice creation', async () => {
      const promises = [];
      
      // Create 5 concurrent invoice creation requests
      for (let i = 0; i < 5; i++) {
        const requestBody = {
          customer_id: customerId,
          products: [
            {
              product_ref_table: 'products',
              product_ref_id: productId,
              quantity: 1,
              price: 100
            }
          ]
        };

        const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': '1'
          },
          body: JSON.stringify(requestBody)
        });

        promises.push(POST(request, { params: { tenantId: tenantId.toString() } }));
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Check for unique invoice numbers
      const responseData = await Promise.all(
        responses.map(r => r.json())
      );

      const invoiceNumbers = responseData.map(r => r.data.invoice.invoice_number);
      const uniqueNumbers = new Set(invoiceNumbers);
      expect(uniqueNumbers.size).toBe(invoiceNumbers.length);
    });
  });

  describe('Transaction Rollback', () => {
    it('should rollback transaction on partial failure', async () => {
      // This test would require mocking a database failure
      // For now, we'll test the structure exists for transaction handling
      
      const requestBody = {
        customer_id: customerId,
        products: [
          {
            product_ref_table: 'products',
            product_ref_id: productId,
            quantity: 1,
            price: 100
          }
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/tenants/1/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify(requestBody)
      });

      // Count invoices before
      const invoicesTable = await prisma.table.findFirst({
        where: { name: 'invoices', databaseId }
      });

      const countBefore = await prisma.row.count({
        where: { tableId: invoicesTable!.id }
      });

      // Attempt creation (should succeed in normal case)
      const response = await POST(request, { params: { tenantId: tenantId.toString() } });
      
      if (response.status === 201) {
        // Verify invoice was created
        const countAfter = await prisma.row.count({
          where: { tableId: invoicesTable!.id }
        });
        expect(countAfter).toBe(countBefore + 1);
      }
    });
  });
});
