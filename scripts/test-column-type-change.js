#!/usr/bin/env node
/** @format */

/**
 * Test Script pentru Column Type Change System
 * Verifică că logica de conversie funcționează corect
 */

// Import conversion functions
const { attemptConversion } = require('../src/lib/column-type-converter.ts');

console.log('🧪 Testing Column Type Conversion System...\n');

const tests = [
	// String to Number
	{
		name: 'String to Number (valid)',
		value: '123.45',
		fromType: 'string',
		toType: 'number',
		expectedSuccess: true,
		expectedValue: 123.45,
	},
	{
		name: 'String to Number (invalid)',
		value: 'not a number',
		fromType: 'string',
		toType: 'number',
		expectedSuccess: false,
	},
	// Number to String
	{
		name: 'Number to String',
		value: 42,
		fromType: 'number',
		toType: 'string',
		expectedSuccess: true,
		expectedValue: '42',
	},
	// Boolean conversions
	{
		name: 'String to Boolean (true)',
		value: 'yes',
		fromType: 'string',
		toType: 'boolean',
		expectedSuccess: true,
		expectedValue: true,
	},
	{
		name: 'String to Boolean (false)',
		value: 'no',
		fromType: 'string',
		toType: 'boolean',
		expectedSuccess: true,
		expectedValue: false,
	},
	// Null handling
	{
		name: 'Null value conversion',
		value: null,
		fromType: 'string',
		toType: 'number',
		expectedSuccess: true,
		expectedValue: null,
	},
	// Date conversions
	{
		name: 'String to Date',
		value: '2025-10-08',
		fromType: 'string',
		toType: 'date',
		expectedSuccess: true,
	},
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
	try {
		const result = attemptConversion(test.value, test.fromType, test.toType);

		const successMatches = result.success === test.expectedSuccess;
		const valueMatches =
			test.expectedValue !== undefined
				? result.newValue === test.expectedValue
				: true;

		if (successMatches && valueMatches) {
			console.log(`✅ Test ${index + 1}: ${test.name}`);
			console.log(
				`   ${test.value} (${test.fromType}) → ${result.newValue} (${test.toType})`,
			);
			passed++;
		} else {
			console.log(`❌ Test ${index + 1}: ${test.name}`);
			console.log(`   Expected: success=${test.expectedSuccess}`);
			console.log(`   Got: success=${result.success}`);
			if (test.expectedValue !== undefined) {
				console.log(`   Expected value: ${test.expectedValue}`);
				console.log(`   Got value: ${result.newValue}`);
			}
			failed++;
		}
	} catch (error) {
		console.log(`❌ Test ${index + 1}: ${test.name} - ERROR`);
		console.log(`   ${error.message}`);
		failed++;
	}

	console.log('');
});

console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${passed}/${tests.length}`);
console.log(`❌ Failed: ${failed}/${tests.length}`);

if (failed === 0) {
	console.log('\n🎉 All tests passed! Column type conversion system is working correctly.');
} else {
	console.log('\n⚠️  Some tests failed. Check the implementation.');
	process.exit(1);
}

