#!/usr/bin/env tsx

/**
 * Test script for POST filtering functionality
 * Tests both simple and complex filter combinations
 */

// Using built-in fetch (Node.js 18+)

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface FilterConfig {
	id?: string;
	columnId: number;
	columnName: string;
	columnType: string;
	operator: string;
	value: any;
	secondValue?: any;
}

interface FilterPayload {
	page: number;
	pageSize: number;
	includeCells?: boolean;
	globalSearch?: string;
	filters?: FilterConfig[];
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

async function testPostFiltering() {
	console.log('🧪 Testing POST filtering functionality...\n');

	// Test data - you'll need to replace these with actual values from your database
	const testConfig = {
		tenantId: '1', // Replace with actual tenant ID
		databaseId: '1', // Replace with actual database ID
		tableId: '1', // Replace with actual table ID
		authToken: 'your-auth-token-here' // Replace with actual auth token
	};

	const baseUrl = `${BASE_URL}/api/tenants/${testConfig.tenantId}/databases/${testConfig.databaseId}/tables/${testConfig.tableId}/rows`;

	// Test 1: Basic filtering without filters
	console.log('📋 Test 1: Basic request without filters');
	try {
		const payload1: FilterPayload = {
			page: 1,
			pageSize: 10,
			includeCells: true,
			globalSearch: '',
			filters: [],
			sortBy: 'id',
			sortOrder: 'asc'
		};

		const response1 = await fetch(baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${testConfig.authToken}`
			},
			body: JSON.stringify(payload1)
		});

		if (response1.ok) {
			const data1 = await response1.json();
			console.log('✅ Basic request successful');
			console.log(`   - Rows returned: ${data1.data?.length || 0}`);
			console.log(`   - Total rows: ${data1.pagination?.totalRows || 0}`);
			console.log(`   - Page: ${data1.pagination?.page || 0}`);
		} else {
			console.log('❌ Basic request failed:', response1.status, response1.statusText);
		}
	} catch (error) {
		console.log('❌ Basic request error:', error);
	}

	console.log('\n' + '='.repeat(50) + '\n');

	// Test 2: Global search
	console.log('🔍 Test 2: Global search');
	try {
		const payload2: FilterPayload = {
			page: 1,
			pageSize: 10,
			includeCells: true,
			globalSearch: 'test', // Replace with actual search term
			filters: [],
			sortBy: 'id',
			sortOrder: 'asc'
		};

		const response2 = await fetch(baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${testConfig.authToken}`
			},
			body: JSON.stringify(payload2)
		});

		if (response2.ok) {
			const data2 = await response2.json();
			console.log('✅ Global search successful');
			console.log(`   - Rows returned: ${data2.data?.length || 0}`);
			console.log(`   - Total rows: ${data2.pagination?.totalRows || 0}`);
			console.log(`   - Search term: "${data2.filters?.globalSearch || ''}"`);
		} else {
			console.log('❌ Global search failed:', response2.status, response2.statusText);
		}
	} catch (error) {
		console.log('❌ Global search error:', error);
	}

	console.log('\n' + '='.repeat(50) + '\n');

	// Test 3: Simple column filter
	console.log('🔧 Test 3: Simple column filter');
	try {
		const payload3: FilterPayload = {
			page: 1,
			pageSize: 10,
			includeCells: true,
			globalSearch: '',
			filters: [
				{
					id: 'filter-1',
					columnId: 1, // Replace with actual column ID
					columnName: 'name', // Replace with actual column name
					columnType: 'text',
					operator: 'contains',
					value: 'test' // Replace with actual value
				}
			],
			sortBy: 'id',
			sortOrder: 'asc'
		};

		const response3 = await fetch(baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${testConfig.authToken}`
			},
			body: JSON.stringify(payload3)
		});

		if (response3.ok) {
			const data3 = await response3.json();
			console.log('✅ Simple column filter successful');
			console.log(`   - Rows returned: ${data3.data?.length || 0}`);
			console.log(`   - Total rows: ${data3.pagination?.totalRows || 0}`);
			console.log(`   - Filters applied: ${data3.filters?.validFiltersCount || 0}`);
		} else {
			console.log('❌ Simple column filter failed:', response3.status, response3.statusText);
		}
	} catch (error) {
		console.log('❌ Simple column filter error:', error);
	}

	console.log('\n' + '='.repeat(50) + '\n');

	// Test 4: Complex filters (multiple columns)
	console.log('🔧🔧 Test 4: Complex filters (multiple columns)');
	try {
		const payload4: FilterPayload = {
			page: 1,
			pageSize: 10,
			includeCells: true,
			globalSearch: '',
			filters: [
				{
					id: 'filter-1',
					columnId: 1, // Replace with actual column ID
					columnName: 'name',
					columnType: 'text',
					operator: 'contains',
					value: 'test'
				},
				{
					id: 'filter-2',
					columnId: 2, // Replace with actual column ID
					columnName: 'status',
					columnType: 'text',
					operator: 'equals',
					value: 'active'
				},
				{
					id: 'filter-3',
					columnId: 3, // Replace with actual column ID
					columnName: 'created_at',
					columnType: 'date',
					operator: 'after',
					value: '2024-01-01'
				}
			],
			sortBy: 'id',
			sortOrder: 'asc'
		};

		const response4 = await fetch(baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${testConfig.authToken}`
			},
			body: JSON.stringify(payload4)
		});

		if (response4.ok) {
			const data4 = await response4.json();
			console.log('✅ Complex filters successful');
			console.log(`   - Rows returned: ${data4.data?.length || 0}`);
			console.log(`   - Total rows: ${data4.pagination?.totalRows || 0}`);
			console.log(`   - Filters applied: ${data4.filters?.validFiltersCount || 0}`);
		} else {
			console.log('❌ Complex filters failed:', response4.status, response4.statusText);
		}
	} catch (error) {
		console.log('❌ Complex filters error:', error);
	}

	console.log('\n' + '='.repeat(50) + '\n');

	// Test 5: Numeric range filter
	console.log('🔢 Test 5: Numeric range filter');
	try {
		const payload5: FilterPayload = {
			page: 1,
			pageSize: 10,
			includeCells: true,
			globalSearch: '',
			filters: [
				{
					id: 'filter-1',
					columnId: 4, // Replace with actual numeric column ID
					columnName: 'price',
					columnType: 'number',
					operator: 'between',
					value: 10,
					secondValue: 100
				}
			],
			sortBy: 'id',
			sortOrder: 'asc'
		};

		const response5 = await fetch(baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${testConfig.authToken}`
			},
			body: JSON.stringify(payload5)
		});

		if (response5.ok) {
			const data5 = await response5.json();
			console.log('✅ Numeric range filter successful');
			console.log(`   - Rows returned: ${data5.data?.length || 0}`);
			console.log(`   - Total rows: ${data5.pagination?.totalRows || 0}`);
			console.log(`   - Filters applied: ${data5.filters?.validFiltersCount || 0}`);
		} else {
			console.log('❌ Numeric range filter failed:', response5.status, response5.statusText);
		}
	} catch (error) {
		console.log('❌ Numeric range filter error:', error);
	}

	console.log('\n' + '='.repeat(50) + '\n');

	// Test 6: Combined global search + filters
	console.log('🔍🔧 Test 6: Combined global search + filters');
	try {
		const payload6: FilterPayload = {
			page: 1,
			pageSize: 10,
			includeCells: true,
			globalSearch: 'important',
			filters: [
				{
					id: 'filter-1',
					columnId: 2, // Replace with actual column ID
					columnName: 'status',
					columnType: 'text',
					operator: 'equals',
					value: 'active'
				}
			],
			sortBy: 'id',
			sortOrder: 'asc'
		};

		const response6 = await fetch(baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${testConfig.authToken}`
			},
			body: JSON.stringify(payload6)
		});

		if (response6.ok) {
			const data6 = await response6.json();
			console.log('✅ Combined search + filters successful');
			console.log(`   - Rows returned: ${data6.data?.length || 0}`);
			console.log(`   - Total rows: ${data6.pagination?.totalRows || 0}`);
			console.log(`   - Search term: "${data6.filters?.globalSearch || ''}"`);
			console.log(`   - Filters applied: ${data6.filters?.validFiltersCount || 0}`);
		} else {
			console.log('❌ Combined search + filters failed:', response6.status, response6.statusText);
		}
	} catch (error) {
		console.log('❌ Combined search + filters error:', error);
	}

	console.log('\n🎉 POST filtering tests completed!');
	console.log('\n📝 Note: Update the testConfig object with actual values from your database before running these tests.');
}

// Run the tests
testPostFiltering().catch(console.error);
