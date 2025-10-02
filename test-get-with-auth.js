const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testGetWithAuth() {
    try {
        console.log('🔍 Testing GET endpoint with authentication...');
        
        // Get the user
        const user = await prisma.user.findFirst({
            where: { email: 'b.ryky.filipe@gmail.com' },
            include: { tenant: true }
        });
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log('👤 User:', { id: user.id, email: user.email, tenantId: user.tenantId });
        
        // Get the database for this tenant
        const database = await prisma.database.findFirst({
            where: { tenantId: user.tenantId },
        });
        
        if (!database) {
            console.log('❌ Database not found');
            return;
        }
        
        console.log('💾 Database:', { id: database.id, name: database.name });
        
        // Get invoice tables
        const invoiceTables = await prisma.table.findMany({
            where: { 
                databaseId: database.id,
                protectedType: { in: ['invoices', 'invoice_items', 'customers'] }
            }
        });
        
        console.log('📊 Invoice tables:', invoiceTables.map(t => ({
            name: t.name,
            protectedType: t.protectedType,
            id: t.id
        })));
        
        const invoicesTable = invoiceTables.find(t => t.protectedType === 'invoices');
        
        if (!invoicesTable) {
            console.log('❌ No invoices table found');
            return;
        }
        
        // Get all invoices with their data
        console.log('🔍 Fetching invoices from table ID:', invoicesTable.id);
        
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
        
        console.log(`📄 Found ${invoices.length} invoices in database`);
        
        // Transform invoices to include readable data (same logic as API)
        console.log('🔄 Starting transformation of invoices...');
        
        const transformedInvoices = invoices.map((invoice, index) => {
            const invoiceData = {
                id: invoice.id,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
            };

            console.log(`📝 Transforming invoice ${index + 1} (ID: ${invoice.id}) with ${invoice.cells.length} cells`);

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

            console.log(`✅ Transformed invoice ${index + 1}:`, {
                id: invoiceData.id,
                invoice_number: invoiceData.invoice_number,
                total_amount: invoiceData.total_amount,
                status: invoiceData.status
            });

            return invoiceData;
        });
        
        const response = {
            success: true,
            data: transformedInvoices,
            count: transformedInvoices.length,
        };

        console.log('📤 API would return:', {
            success: response.success,
            count: response.count,
            firstInvoiceId: transformedInvoices.length > 0 ? transformedInvoices[0].id : null
        });
        
        console.log('📋 Sample transformed invoice:', transformedInvoices[0]);
        
        console.log('✅ GET endpoint logic test completed successfully');
        
    } catch (error) {
        console.error('❌ Error during GET test:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testGetWithAuth();
