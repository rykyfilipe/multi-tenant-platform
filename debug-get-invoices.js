const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function debugGetInvoices() {
    try {
        console.log('🔍 Debugging GET invoices endpoint...');
        
        // Check tenant 2
        const tenant = await prisma.tenant.findUnique({
            where: { id: 2 },
            include: {
                databases: true
            }
        });
        
        console.log('🏢 Tenant 2:', tenant);
        
        if (!tenant || !tenant.databases || tenant.databases.length === 0) {
            console.log('❌ No databases found for tenant 2');
            return;
        }
        
        const database = tenant.databases[0];
        console.log('💾 Database:', database);
        
        // Check invoice tables
        const invoiceTables = await prisma.table.findMany({
            where: { 
                databaseId: database.id,
                protectedType: { in: ['invoices', 'invoice_items', 'customers'] }
            }
        });
        
        console.log('📊 Invoice tables:', invoiceTables);
        
        const invoicesTable = invoiceTables.find(t => t.protectedType === 'invoices');
        
        if (!invoicesTable) {
            console.log('❌ No invoices table found');
            return;
        }
        
        console.log('🧾 Invoices table:', invoicesTable);
        
        // Get all invoices
        const invoices = await prisma.row.findMany({
            where: {
                tableId: invoicesTable.id,
            },
            include: {
                cells: {
                    include: {
                        column: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        
        console.log(`📄 Found ${invoices.length} invoices:`);
        
        invoices.forEach((invoice, index) => {
            console.log(`\n  Invoice ${index + 1} (ID: ${invoice.id}):`);
            console.log(`    Created: ${invoice.createdAt}`);
            console.log(`    Updated: ${invoice.updatedAt}`);
            
            const invoiceData = {};
            invoice.cells.forEach(cell => {
                const columnName = cell.column.name;
                const semanticType = cell.column.semanticType;
                const value = cell.value;
                
                console.log(`      ${columnName} (${semanticType}): ${value}`);
                
                invoiceData[columnName] = value;
                if (semanticType) {
                    invoiceData[semanticType] = value;
                }
            });
            
            console.log(`    Parsed data:`, invoiceData);
        });
        
        // Test the transformation logic from the API
        console.log('\n🔄 Testing API transformation logic...');
        
        const transformedInvoices = invoices.map((invoice) => {
            const invoiceData = {
                id: invoice.id,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
            };

            // Map cells to readable format
            invoice.cells.forEach((cell) => {
                const columnName = cell.column.name;
                const semanticType = cell.column.semanticType;
                
                // Use semantic type as key for better API structure
                if (semanticType) {
                    invoiceData[semanticType] = cell.value;
                }
                
                // Also keep column name for backward compatibility
                invoiceData[columnName] = cell.value;
            });

            return invoiceData;
        });
        
        console.log('\n📋 Transformed invoices:');
        transformedInvoices.forEach((invoice, index) => {
            console.log(`\n  Transformed Invoice ${index + 1}:`);
            Object.entries(invoice).forEach(([key, value]) => {
                console.log(`    ${key}: ${value}`);
            });
        });
        
        console.log('\n✅ API would return:');
        console.log(JSON.stringify({
            success: true,
            data: transformedInvoices,
            count: transformedInvoices.length,
        }, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

debugGetInvoices();
