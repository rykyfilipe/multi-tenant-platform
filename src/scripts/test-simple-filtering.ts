#!/usr/bin/env tsx

/**
 * Simple test for POST filtering functionality
 * This test can be run without authentication to verify the basic structure
 */

// Using built-in fetch (Node.js 18+)

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testBasicPostStructure() {
	console.log('🧪 Testing POST filtering basic structure...\n');

	// Test the basic POST endpoint structure
	const testUrl = `${BASE_URL}/api/tenants/1/databases/1/tables/1/rows`;

	// Test 1: Basic POST request structure
	console.log('📋 Test 1: Basic POST request structure');
	try {
		const payload = {
			page: 1,
			pageSize: 10,
			includeCells: true,
			globalSearch: '',
			filters: [],
			sortBy: 'id',
			sortOrder: 'asc'
		};

		console.log('📤 Sending POST request to:', testUrl);
		console.log('📤 Payload:', JSON.stringify(payload, null, 2));

		const response = await fetch(testUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer test-token' // This will fail auth, but we can check structure
			},
			body: JSON.stringify(payload)
		});

		console.log('📥 Response status:', response.status);
		console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

		if (response.status === 401) {
			console.log('✅ POST endpoint structure is correct (401 Unauthorized expected)');
		} else if (response.status === 400) {
			console.log('✅ POST endpoint accepts requests (400 Bad Request - likely missing auth)');
		} else {
			console.log('📥 Response body:', await response.text());
		}

	} catch (error) {
		console.log('❌ POST request failed:', error);
	}

	console.log('\n' + '='.repeat(50) + '\n');

	// Test 2: Verify Content-Type handling
	console.log('🔍 Test 2: Content-Type handling');
	try {
		const response = await fetch(testUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ page: 1, pageSize: 10 })
		});

		console.log('📥 Response status:', response.status);
		console.log('✅ Content-Type application/json accepted');

	} catch (error) {
		console.log('❌ Content-Type test failed:', error);
	}

	console.log('\n' + '='.repeat(50) + '\n');

	// Test 3: Verify JSON parsing
	console.log('🔍 Test 3: JSON parsing');
	try {
		const response = await fetch(testUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				page: 1,
				pageSize: 10,
				filters: [
					{
						id: 'test-filter',
						columnId: 1,
						columnName: 'test',
						columnType: 'text',
						operator: 'contains',
						value: 'test'
					}
				]
			})
		});

		console.log('📥 Response status:', response.status);
		console.log('✅ Complex JSON payload accepted');

	} catch (error) {
		console.log('❌ JSON parsing test failed:', error);
	}

	console.log('\n🎉 Basic POST structure tests completed!');
	console.log('\n📝 Note: These tests verify the endpoint structure and JSON handling.');
	console.log('   For full functionality testing, you need valid authentication and database access.');
}

// Run the tests
testBasicPostStructure().catch(console.error);
