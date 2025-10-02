#!/usr/bin/env node

/**
 * Replicable Test Case: Invoice Numbering Race Condition
 * 
 * This script demonstrates the race condition in invoice numbering
 * where multiple concurrent requests can generate duplicate invoice numbers.
 * 
 * Run with: node invoice-creation-race-condition.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateInvoiceCreation(tenantId, databaseId, requestId) {
  try {
    console.log(`[${requestId}] Starting invoice creation...`);
    
    // Simulate the current invoice creation logic
    const invoiceTables = await prisma.table.findMany({
      where: {
        databaseId: databaseId,
        name: { in: ['invoices', 'invoice_items'] }
      },
      include: { columns: true }
    });
    
    if (invoiceTables.length < 2) {
      throw new Error('Invoice tables not found');
    }
    
    const invoicesTable = invoiceTables.find(t => t.name === 'invoices');
    const invoiceItemsTable = invoiceTables.find(t => t.name === 'invoice_items');
    
    // Get current invoice number (RACE CONDITION HERE)
    const lastInvoice = await prisma.row.findFirst({
      where: { tableId: invoicesTable.id },
      orderBy: { id: 'desc' },
      include: {
        cells: {
          where: {
            column: {
              semanticType: 'invoice_number'
            }
          }
        }
      }
    });
    
    let nextNumber = 1;
    if (lastInvoice && lastInvoice.cells.length > 0) {
      const currentNumber = parseInt(lastInvoice.cells[0].stringValue || '0');
      nextNumber = currentNumber + 1;
    }
    
    const invoiceNumber = `INV-${new Date().getFullYear()}-${nextNumber.toString().padStart(6, '0')}`;
    
    console.log(`[${requestId}] Generated invoice number: ${invoiceNumber}`);
    
    // Small delay to increase chance of race condition
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // Create invoice row
    const invoiceRow = await prisma.row.create({
      data: {
        tableId: invoicesTable.id,
        cells: {
          create: [{
            columnId: invoicesTable.columns.find(c => c.semanticType === 'invoice_number').id,
            value: invoiceNumber,
            stringValue: invoiceNumber
          }]
        }
      }
    });
    
    console.log(`[${requestId}] Created invoice with ID: ${invoiceRow.id}`);
    
    return {
      requestId,
      invoiceId: invoiceRow.id,
      invoiceNumber,
      success: true
    };
    
  } catch (error) {
    console.error(`[${requestId}] Error:`, error.message);
    return {
      requestId,
      error: error.message,
      success: false
    };
  }
}

async function testRaceCondition() {
  console.log('Testing invoice numbering race condition...\n');
  
  const tenantId = 1;
  const databaseId = 1;
  
  // Create 10 concurrent invoice creation requests
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(simulateInvoiceCreation(tenantId, databaseId, `Request-${i + 1}`));
  }
  
  const results = await Promise.all(promises);
  
  console.log('\n=== RESULTS ===');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  
  // Check for duplicate invoice numbers
  const invoiceNumbers = successful.map(r => r.invoiceNumber);
  const uniqueNumbers = new Set(invoiceNumbers);
  
  console.log(`\nInvoice Numbers Generated: ${invoiceNumbers.length}`);
  console.log(`Unique Invoice Numbers: ${uniqueNumbers.size}`);
  
  if (invoiceNumbers.length !== uniqueNumbers.size) {
    console.log('\n🚨 RACE CONDITION DETECTED!');
    console.log('Duplicate invoice numbers found:');
    
    const duplicates = invoiceNumbers.filter((num, index) => 
      invoiceNumbers.indexOf(num) !== index
    );
    
    console.log('Duplicates:', [...new Set(duplicates)]);
  } else {
    console.log('\n✅ No race condition detected in this run');
  }
  
  // Show all generated numbers
  console.log('\nAll Generated Numbers:');
  invoiceNumbers.forEach((num, index) => {
    console.log(`${index + 1}. ${num}`);
  });
}

async function cleanup() {
  console.log('\nCleaning up test data...');
  
  // Delete test invoices
  const invoicesTable = await prisma.table.findFirst({
    where: { name: 'invoices', databaseId: 1 }
  });
  
  if (invoicesTable) {
    await prisma.cell.deleteMany({
      where: {
        row: { tableId: invoicesTable.id },
        stringValue: { startsWith: 'INV-2025-' }
      }
    });
    
    await prisma.row.deleteMany({
      where: {
        tableId: invoicesTable.id,
        cells: {
          some: {
            stringValue: { startsWith: 'INV-2025-' }
          }
        }
      }
    });
  }
  
  console.log('Cleanup completed');
}

async function main() {
  try {
    await testRaceCondition();
    await cleanup();
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { simulateInvoiceCreation, testRaceCondition };
