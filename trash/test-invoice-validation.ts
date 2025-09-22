/** @format */

/**
 * Script to test invoice form validation
 * This script can be run to test the validation logic
 */

import { validateInvoiceForm, ValidationResult } from '../lib/invoice-form-validator';

// Test data
const testCases = [
	{
		name: "Valid invoice data",
		data: {
			customer_id: 1,
			base_currency: "USD",
			due_date: "2025-12-31",
			payment_method: "Bank Transfer",
			products: [
				{
					product_ref_table: "products",
					product_ref_id: 1,
					quantity: 2,
					currency: "USD",
					price: 100.00,
					original_price: 100.00,
					converted_price: 100.00,
				}
			],
			invoiceForm: {
				due_date: "2025-12-31",
				payment_method: "Bank Transfer",
			}
		},
		expectedValid: true
	},
	{
		name: "Missing customer",
		data: {
			customer_id: null,
			base_currency: "USD",
			due_date: "2025-12-31",
			payment_method: "Bank Transfer",
			products: [
				{
					product_ref_table: "products",
					product_ref_id: 1,
					quantity: 2,
					currency: "USD",
					price: 100.00,
					original_price: 100.00,
					converted_price: 100.00,
				}
			],
			invoiceForm: {
				due_date: "2025-12-31",
				payment_method: "Bank Transfer",
			}
		},
		expectedValid: false
	},
	{
		name: "Missing products",
		data: {
			customer_id: 1,
			base_currency: "USD",
			due_date: "2025-12-31",
			payment_method: "Bank Transfer",
			products: [],
			invoiceForm: {
				due_date: "2025-12-31",
				payment_method: "Bank Transfer",
			}
		},
		expectedValid: false
	},
	{
		name: "Missing due date",
		data: {
			customer_id: 1,
			base_currency: "USD",
			due_date: "",
			payment_method: "Bank Transfer",
			products: [
				{
					product_ref_table: "products",
					product_ref_id: 1,
					quantity: 2,
					currency: "USD",
					price: 100.00,
					original_price: 100.00,
					converted_price: 100.00,
				}
			],
			invoiceForm: {
				due_date: "",
				payment_method: "Bank Transfer",
			}
		},
		expectedValid: false
	},
	{
		name: "Invalid currency",
		data: {
			customer_id: 1,
			base_currency: "INVALID",
			due_date: "2025-12-31",
			payment_method: "Bank Transfer",
			products: [
				{
					product_ref_table: "products",
					product_ref_id: 1,
					quantity: 2,
					currency: "USD",
					price: 100.00,
					original_price: 100.00,
					converted_price: 100.00,
				}
			],
			invoiceForm: {
				due_date: "2025-12-31",
				payment_method: "Bank Transfer",
			}
		},
		expectedValid: false
	},
	{
		name: "Product with zero quantity",
		data: {
			customer_id: 1,
			base_currency: "USD",
			due_date: "2025-12-31",
			payment_method: "Bank Transfer",
			products: [
				{
					product_ref_table: "products",
					product_ref_id: 1,
					quantity: 0,
					currency: "USD",
					price: 100.00,
					original_price: 100.00,
					converted_price: 100.00,
				}
			],
			invoiceForm: {
				due_date: "2025-12-31",
				payment_method: "Bank Transfer",
			}
		},
		expectedValid: false
	},
	{
		name: "Product with negative price",
		data: {
			customer_id: 1,
			base_currency: "USD",
			due_date: "2025-12-31",
			payment_method: "Bank Transfer",
			products: [
				{
					product_ref_table: "products",
					product_ref_id: 1,
					quantity: 2,
					currency: "USD",
					price: -50.00,
					original_price: -50.00,
					converted_price: -50.00,
				}
			],
			invoiceForm: {
				due_date: "2025-12-31",
				payment_method: "Bank Transfer",
			}
		},
		expectedValid: false
	},
	{
		name: "Past due date",
		data: {
			customer_id: 1,
			base_currency: "USD",
			due_date: "2020-01-01",
			payment_method: "Bank Transfer",
			products: [
				{
					product_ref_table: "products",
					product_ref_id: 1,
					quantity: 2,
					currency: "USD",
					price: 100.00,
					original_price: 100.00,
					converted_price: 100.00,
				}
			],
			invoiceForm: {
				due_date: "2020-01-01",
				payment_method: "Bank Transfer",
			}
		},
		expectedValid: false
	},
	{
		name: "Multiple currencies warning",
		data: {
			customer_id: 1,
			base_currency: "USD",
			due_date: "2025-12-31",
			payment_method: "Bank Transfer",
			products: [
				{
					product_ref_table: "products",
					product_ref_id: 1,
					quantity: 2,
					currency: "USD",
					price: 100.00,
					original_price: 100.00,
					converted_price: 100.00,
				},
				{
					product_ref_table: "products",
					product_ref_id: 2,
					quantity: 1,
					currency: "EUR",
					price: 85.00,
					original_price: 85.00,
					converted_price: 85.00,
				}
			],
			invoiceForm: {
				due_date: "2025-12-31",
				payment_method: "Bank Transfer",
			}
		},
		expectedValid: true
	}
];

// Run tests
function runTests() {
	console.log("🧪 Running Invoice Form Validation Tests\n");
	
	let passed = 0;
	let failed = 0;

	testCases.forEach((testCase, index) => {
		console.log(`Test ${index + 1}: ${testCase.name}`);
		
		try {
			const result = validateInvoiceForm(testCase.data);
			const isValid = result.isValid;
			const expectedValid = testCase.expectedValid;
			
			if (isValid === expectedValid) {
				console.log(`✅ PASS - Validation result: ${isValid}`);
				passed++;
			} else {
				console.log(`❌ FAIL - Expected: ${expectedValid}, Got: ${isValid}`);
				console.log(`   Errors: ${result.errors.join(", ")}`);
				failed++;
			}
			
			// Show warnings if any
			if (result.warnings.length > 0) {
				console.log(`   Warnings: ${result.warnings.join(", ")}`);
			}
			
		} catch (error) {
			console.log(`❌ ERROR - ${error}`);
			failed++;
		}
		
		console.log("");
	});
	
	console.log(`\n📊 Test Results:`);
	console.log(`✅ Passed: ${passed}`);
	console.log(`❌ Failed: ${failed}`);
	console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
	
	if (failed === 0) {
		console.log(`\n🎉 All tests passed!`);
	} else {
		console.log(`\n⚠️  ${failed} test(s) failed. Please check the validation logic.`);
	}
}

// Run the tests
if (require.main === module) {
	runTests();
}

export { runTests, testCases };
