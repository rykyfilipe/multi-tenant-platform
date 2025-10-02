#!/usr/bin/env node

/**
 * Replicable Test Case: Monetary Precision Errors
 * 
 * This script demonstrates floating-point precision issues in monetary calculations
 * that can lead to incorrect totals and rounding errors.
 * 
 * Run with: node monetary-precision-errors.js
 */

// Simulate the current calculation logic
function calculateLineTotal(quantity, unitPrice, discountRate = 0) {
  return quantity * unitPrice * (1 - discountRate);
}

function calculateTax(baseAmount, taxRate) {
  return baseAmount * taxRate;
}

function calculateInvoiceTotal(items) {
  let subtotal = 0;
  let taxTotal = 0;
  
  for (const item of items) {
    const lineTotal = calculateLineTotal(item.quantity, item.unitPrice, item.discountRate);
    const itemTax = calculateTax(lineTotal, item.taxRate / 100);
    
    subtotal += lineTotal;
    taxTotal += itemTax;
  }
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal: Math.round((subtotal + taxTotal) * 100) / 100
  };
}

function testPrecisionIssues() {
  console.log('Testing monetary precision issues...\n');
  
  // Test Case 1: Common decimal precision issues
  console.log('=== Test Case 1: Decimal Precision ===');
  const items1 = [
    {
      quantity: 1,
      unitPrice: 0.1,
      discountRate: 0,
      taxRate: 19 // 19% VAT
    },
    {
      quantity: 1,
      unitPrice: 0.2,
      discountRate: 0,
      taxRate: 19
    }
  ];
  
  const result1 = calculateInvoiceTotal(items1);
  console.log('Items:', items1);
  console.log('Result:', result1);
  console.log('Expected subtotal: 0.30');
  console.log('Expected tax: 0.057 (19% of 0.30)');
  console.log('Expected total: 0.357');
  console.log('Actual subtotal:', result1.subtotal);
  console.log('Actual tax:', result1.taxTotal);
  console.log('Actual total:', result1.grandTotal);
  
  // Test Case 2: Large numbers with small decimals
  console.log('\n=== Test Case 2: Large Numbers ===');
  const items2 = [
    {
      quantity: 1000,
      unitPrice: 0.01,
      discountRate: 0,
      taxRate: 19
    }
  ];
  
  const result2 = calculateInvoiceTotal(items2);
  console.log('Items:', items2);
  console.log('Result:', result2);
  console.log('Expected subtotal: 10.00');
  console.log('Expected tax: 1.90');
  console.log('Expected total: 11.90');
  
  // Test Case 3: Discount calculations
  console.log('\n=== Test Case 3: Discount Precision ===');
  const items3 = [
    {
      quantity: 1,
      unitPrice: 100,
      discountRate: 0.33, // 33% discount
      taxRate: 19
    }
  ];
  
  const result3 = calculateInvoiceTotal(items3);
  console.log('Items:', items3);
  console.log('Result:', result3);
  console.log('Expected subtotal: 67.00 (100 * 0.67)');
  console.log('Expected tax: 12.73 (19% of 67)');
  console.log('Expected total: 79.73');
  
  // Test Case 4: Currency conversion precision
  console.log('\n=== Test Case 4: Currency Conversion ===');
  const items4 = [
    {
      quantity: 1,
      unitPrice: 100, // USD
      discountRate: 0,
      taxRate: 19
    }
  ];
  
  // Simulate EUR conversion (1 USD = 0.85 EUR)
  const exchangeRate = 0.85;
  const convertedPrice = items4[0].unitPrice * exchangeRate;
  console.log(`Original price: $${items4[0].unitPrice}`);
  console.log(`Exchange rate: ${exchangeRate}`);
  console.log(`Converted price: €${convertedPrice}`);
  
  const items4Converted = [{
    ...items4[0],
    unitPrice: convertedPrice
  }];
  
  const result4 = calculateInvoiceTotal(items4Converted);
  console.log('Converted result:', result4);
  
  // Test Case 5: Multiple small amounts
  console.log('\n=== Test Case 5: Multiple Small Amounts ===');
  const items5 = Array(100).fill(null).map((_, i) => ({
    quantity: 1,
    unitPrice: 0.01,
    discountRate: 0,
    taxRate: 19
  }));
  
  const result5 = calculateInvoiceTotal(items5);
  console.log(`Items: ${items5.length} x $0.01`);
  console.log('Result:', result5);
  console.log('Expected subtotal: 1.00');
  console.log('Expected tax: 0.19');
  console.log('Expected total: 1.19');
  
  // Test Case 6: Negative amounts (returns/credits)
  console.log('\n=== Test Case 6: Negative Amounts ===');
  const items6 = [
    {
      quantity: -1,
      unitPrice: 100,
      discountRate: 0,
      taxRate: 19
    }
  ];
  
  const result6 = calculateInvoiceTotal(items6);
  console.log('Items:', items6);
  console.log('Result:', result6);
  console.log('Expected subtotal: -100.00');
  console.log('Expected tax: -19.00');
  console.log('Expected total: -119.00');
  
  // Test Case 7: Rounding edge cases
  console.log('\n=== Test Case 7: Rounding Edge Cases ===');
  const items7 = [
    {
      quantity: 1,
      unitPrice: 100.125,
      discountRate: 0,
      taxRate: 19
    }
  ];
  
  const result7 = calculateInvoiceTotal(items7);
  console.log('Items:', items7);
  console.log('Result:', result7);
  console.log('Expected subtotal: 100.13 (rounded)');
  console.log('Expected tax: 19.02 (19% of 100.125, then rounded)');
  console.log('Expected total: 119.15');
  
  // Demonstrate floating point precision issues
  console.log('\n=== Floating Point Precision Issues ===');
  console.log('0.1 + 0.2 =', 0.1 + 0.2);
  console.log('0.1 + 0.2 === 0.3:', 0.1 + 0.2 === 0.3);
  console.log('0.1 * 3 =', 0.1 * 3);
  console.log('0.1 * 3 === 0.3:', 0.1 * 3 === 0.3);
  
  // Show precision loss in calculations
  console.log('\n=== Precision Loss Examples ===');
  const value = 100.125;
  console.log('Original value:', value);
  console.log('Value * 19% =', value * 0.19);
  console.log('Value * 19% (rounded to 2 decimals):', Math.round(value * 0.19 * 100) / 100);
  console.log('Value * 19% (toFixed):', parseFloat((value * 0.19).toFixed(2)));
}

function testSafeCalculations() {
  console.log('\n=== Testing Safe Calculations with Decimal.js ===');
  
  // This would require installing decimal.js: npm install decimal.js
  console.log('To implement safe calculations, install decimal.js:');
  console.log('npm install decimal.js');
  console.log('\nExample safe calculation:');
  console.log(`
const Decimal = require('decimal.js');

function safeCalculateLineTotal(quantity, unitPrice, discountRate = 0) {
  return new Decimal(quantity)
    .mul(unitPrice)
    .mul(new Decimal(1).sub(discountRate))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function safeCalculateTax(baseAmount, taxRate) {
  return new Decimal(baseAmount)
    .mul(taxRate)
    .div(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}
  `);
}

async function main() {
  try {
    testPrecisionIssues();
    testSafeCalculations();
    
    console.log('\n=== Recommendations ===');
    console.log('1. Replace all monetary calculations with Decimal.js');
    console.log('2. Use consistent rounding policy (ROUND_HALF_UP)');
    console.log('3. Store monetary values as integers (cents) in database');
    console.log('4. Validate input ranges and precision');
    console.log('5. Add unit tests for edge cases');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  calculateLineTotal, 
  calculateTax, 
  calculateInvoiceTotal, 
  testPrecisionIssues 
};
