/** @format */

import prisma from "@/lib/prisma";

async function testTableAPI() {
	try {
		console.log("🔍 Testing table API and database data...");
		
		// Get all tables
		const tables = await prisma.table.findMany({
			select: {
				id: true,
				name: true,
				databaseId: true,
				database: {
					select: {
						id: true,
						name: true,
						tenantId: true,
						tenant: {
							select: {
								id: true,
								name: true
							}
						}
					}
				}
			},
			orderBy: {
				name: 'asc'
			}
		});

		// Get row counts for each table
		const tablesWithCounts = await Promise.all(
			tables.map(async (table) => {
				const rowCount = await prisma.row.count({
					where: { tableId: table.id }
				});
				return {
					...table,
					rowCount
				};
			})
		);

		console.log("📊 Tables with row counts:");
		tablesWithCounts.forEach(table => {
			console.log(`  - ${table.name} (ID: ${table.id}): ${table.rowCount} rows`);
			console.log(`    Database: ${table.database.name} (ID: ${table.database.id})`);
			console.log(`    Tenant: ${table.database.tenant.name} (ID: ${table.database.tenantId})`);
		});

		// Find tables with many rows
		const tablesWithManyRows = tablesWithCounts.filter(t => t.rowCount > 100);
		console.log(`\n📈 Tables with >100 rows: ${tablesWithManyRows.length}`);
		
		if (tablesWithManyRows.length > 0) {
			const tableWithMostRows = tablesWithManyRows[0];
			console.log(`\n🔍 Testing with table: ${tableWithMostRows.name} (${tableWithMostRows.rowCount} rows)`);
			
			// Test the filtered endpoint query
			const testRows = await prisma.row.findMany({
				where: { tableId: tableWithMostRows.id },
				include: {
					cells: {
						include: {
							column: {
								select: {
									id: true,
									name: true,
									type: true,
									order: true,
									referenceTableId: true,
									semanticType: true,
								},
							},
						},
					},
				},
				orderBy: { id: 'asc' },
				skip: 0,
				take: 5,
			});

			console.log(`✅ Filtered query returned: ${testRows.length} rows`);
			
			if (testRows.length > 0) {
				console.log("🔍 Sample row structure:");
				const sampleRow = testRows[0];
				console.log(`  Row ID: ${sampleRow.id}`);
				console.log(`  Cells count: ${sampleRow.cells.length}`);
				console.log(`  Cells:`, sampleRow.cells.map(cell => ({
					columnId: cell.columnId,
					columnName: cell.column.name,
					value: cell.value
				})));
			}
		}

		// Test API endpoint simulation
		console.log("\n🌐 Testing API endpoint simulation...");
		const testTable = tablesWithCounts.find(t => t.rowCount > 0);
		if (testTable) {
			console.log(`Testing with table: ${testTable.name} (${testTable.rowCount} rows)`);
			
			// Simulate the API query
			const totalRows = await prisma.row.count({
				where: { tableId: testTable.id }
			});
			
			const pageSize = 25;
			const page = 1;
			const skip = (page - 1) * pageSize;
			
			const rows = await prisma.row.findMany({
				where: { tableId: testTable.id },
				include: {
					cells: {
						include: {
							column: {
								select: {
									id: true,
									name: true,
									type: true,
									order: true,
									referenceTableId: true,
									semanticType: true,
								},
							},
						},
					},
				},
				orderBy: { id: 'asc' },
				skip: skip,
				take: pageSize,
			});
			
			const totalPages = Math.ceil(totalRows / pageSize);
			
			console.log("📊 API simulation results:");
			console.log(`  Total rows: ${totalRows}`);
			console.log(`  Rows returned: ${rows.length}`);
			console.log(`  Page: ${page}/${totalPages}`);
			console.log(`  Page size: ${pageSize}`);
		}

	} catch (error) {
		console.error("❌ Error testing table API:", error);
	}
}

// If running directly
if (require.main === module) {
	testTableAPI()
		.then(() => {
			console.log("\n✅ Test completed");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Test failed:", error);
			process.exit(1);
		});
}

export { testTableAPI };