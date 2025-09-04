/** @format */

import prisma from "@/lib/prisma";

async function checkTableRows(tableId: number) {
	try {
		console.log(`🔍 Checking rows for table ID: ${tableId}`);
		
		// Check if table exists
		const table = await prisma.table.findUnique({
			where: { id: tableId },
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
			}
		});

		if (!table) {
			console.log("❌ Table not found");
			return;
		}

		console.log("📋 Table info:", {
			id: table.id,
			name: table.name,
			databaseId: table.databaseId,
			databaseName: table.database.name,
			tenantId: table.database.tenantId,
			tenantName: table.database.tenant.name
		});

		// Count total rows
		const totalRows = await prisma.row.count({
			where: { tableId: tableId }
		});

		console.log(`📊 Total rows in table: ${totalRows}`);

		if (totalRows > 0) {
			// Get first few rows as sample
			const sampleRows = await prisma.row.findMany({
				where: { tableId: tableId },
				take: 5,
				include: {
					cells: {
						include: {
							column: {
								select: {
									id: true,
									name: true,
									type: true
								}
							}
						}
					}
				},
				orderBy: { id: 'asc' }
			});

			console.log("🔍 Sample rows (first 5):");
			sampleRows.forEach((row, index) => {
				console.log(`  Row ${index + 1} (ID: ${row.id}):`, {
					cellCount: row.cells.length,
					cells: row.cells.map(cell => ({
						columnId: cell.columnId,
						columnName: cell.column.name,
						value: cell.value
					}))
				});
			});

			// Check columns
			const columns = await prisma.column.findMany({
				where: { tableId: tableId },
				select: {
					id: true,
					name: true,
					type: true,
					order: true
				},
				orderBy: { order: 'asc' }
			});

			console.log("📋 Table columns:");
			columns.forEach(col => {
				console.log(`  - ${col.name} (ID: ${col.id}, Type: ${col.type}, Order: ${col.order})`);
			});
		}

		// Test the filtered endpoint query
		console.log("\n🔍 Testing filtered endpoint query...");
		const filteredRows = await prisma.row.findMany({
			where: { tableId: tableId },
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
			take: 25,
		});

		console.log(`📊 Filtered query returned: ${filteredRows.length} rows`);

	} catch (error) {
		console.error("❌ Error checking table rows:", error);
	}
}

// If running directly
if (require.main === module) {
	const tableId = process.argv[2];
	if (!tableId) {
		console.log("Usage: npx tsx src/scripts/check-table-rows.ts <tableId>");
		process.exit(1);
	}
	
	checkTableRows(parseInt(tableId))
		.then(() => {
			console.log("\n✅ Check completed");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Check failed:", error);
			process.exit(1);
		});
}

export { checkTableRows };
