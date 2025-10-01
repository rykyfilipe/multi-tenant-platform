/** @format */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugInvoiceItemsReference() {
	try {
		console.log('\n=== DEBUGGING INVOICE_ITEMS REFERENCE ===\n');

		// Get all invoice tables
		const invoiceTables = await prisma.table.findMany({
			where: {
				OR: [
					{ name: 'Invoices' },
					{ name: 'Invoice_Items' }
				]
			},
			include: {
				columns: true,
				database: {
					select: {
						id: true,
						tenantId: true,
						name: true
					}
				}
			}
		});

		console.log(`Found ${invoiceTables.length} invoice-related tables\n`);

		for (const table of invoiceTables) {
			console.log(`\n📋 Table: ${table.name} (ID: ${table.id})`);
			console.log(`   Database: ${table.database.name} (ID: ${table.database.id}, Tenant: ${table.database.tenantId})`);

			// Get the invoice_id column for Invoice_Items table
			if (table.name === 'Invoice_Items') {
				const invoiceIdColumn = table.columns.find(c => c.name === 'invoice_id');
				
				if (invoiceIdColumn) {
					console.log(`\n   ✅ Found invoice_id column (ID: ${invoiceIdColumn.id})`);
					console.log(`      Type: ${invoiceIdColumn.type}`);
					console.log(`      Reference Table ID: ${invoiceIdColumn.referenceTableId}`);
					console.log(`      Semantic Type: ${invoiceIdColumn.semanticType}`);

					// Get all invoice items
					const items = await prisma.row.findMany({
						where: {
							tableId: table.id
						},
						include: {
							cells: {
								where: {
									columnId: invoiceIdColumn.id
								},
								include: {
									column: true
								}
							}
						},
						take: 10
					});

					console.log(`\n   📦 Found ${items.length} invoice items (showing first 10):`);
					
					for (const item of items) {
						const invoiceIdCell = item.cells.find(c => c.columnId === invoiceIdColumn.id);
						if (invoiceIdCell) {
							console.log(`\n      Item Row ID: ${item.id}`);
							console.log(`      Invoice ID value: ${invoiceIdCell.value}`);
							console.log(`      Value type: ${typeof invoiceIdCell.value}`);

							// Try to find the referenced invoice
							if (invoiceIdCell.value) {
								const referencedInvoice = await prisma.row.findUnique({
									where: {
										id: Number(invoiceIdCell.value)
									},
									include: {
										cells: {
											include: {
												column: true
											}
										}
									}
								});

								if (referencedInvoice) {
									const invoiceNumberCell = referencedInvoice.cells.find(c => c.column.name === 'invoice_number');
									console.log(`      ✅ Referenced Invoice EXISTS`);
									console.log(`         Invoice Number: ${invoiceNumberCell?.value || 'N/A'}`);
									console.log(`         Table ID: ${referencedInvoice.tableId}`);
								} else {
									console.log(`      ❌ Referenced Invoice NOT FOUND (ID: ${invoiceIdCell.value})`);
								}
							} else {
								console.log(`      ⚠️  invoice_id value is null or empty`);
							}
						}
					}
				} else {
					console.log(`   ❌ invoice_id column not found!`);
				}
			}

			// For Invoices table, show all rows
			if (table.name === 'Invoices') {
				const invoices = await prisma.row.findMany({
					where: {
						tableId: table.id
					},
					include: {
						cells: {
							include: {
								column: true
							}
						}
					},
					orderBy: {
						createdAt: 'desc'
					},
					take: 5
				});

				console.log(`\n   📄 Found ${invoices.length} invoices (showing last 5):`);
				
				for (const invoice of invoices) {
					const invoiceNumberCell = invoice.cells.find(c => c.column.name === 'invoice_number');
					console.log(`\n      Invoice Row ID: ${invoice.id}`);
					console.log(`      Invoice Number: ${invoiceNumberCell?.value || 'N/A'}`);
					console.log(`      Created At: ${invoice.createdAt}`);
					
					// Check if this invoice has items
					const itemsForThisInvoice = await prisma.row.count({
						where: {
							tableId: invoiceTables.find(t => t.name === 'Invoice_Items')?.id,
							cells: {
								some: {
									column: {
										name: 'invoice_id'
									},
									value: {
										equals: invoice.id
									}
								}
							}
						}
					});
					
					console.log(`      Items count: ${itemsForThisInvoice}`);
				}
			}
		}

		console.log('\n\n=== DEBUG COMPLETE ===\n');

	} catch (error) {
		console.error('Error debugging invoice items:', error);
	} finally {
		await prisma.$disconnect();
	}
}

debugInvoiceItemsReference();


