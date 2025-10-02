const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testAuthSimple() {
    try {
        console.log('🔍 Testing authentication and invoice access...');
        
        // Check if user exists
        const user = await prisma.user.findFirst({
            where: { email: 'b.ryky.filipe@gmail.com' },
            include: {
                tenant: true
            }
        });
        
        console.log('👤 User found:', user ? {
            id: user.id,
            email: user.email,
            tenantId: user.tenantId,
            tenantName: user.tenant?.name
        } : 'NOT FOUND');
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        // Check tenant
        const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId },
            include: {
                databases: true
            }
        });
        
        console.log('🏢 Tenant found:', tenant ? {
            id: tenant.id,
            name: tenant.name,
            enabledModules: tenant.enabledModules,
            databaseCount: tenant.databases.length
        } : 'NOT FOUND');
        
        if (!tenant) {
            console.log('❌ Tenant not found');
            return;
        }
        
        // Check if billing module is enabled
        const billingEnabled = tenant.enabledModules?.includes('billing');
        console.log('💳 Billing module enabled:', billingEnabled);
        
        if (!billingEnabled) {
            console.log('❌ Billing module not enabled');
            return;
        }
        
        // Check invoice tables
        const database = tenant.databases[0];
        if (!database) {
            console.log('❌ No database found for tenant');
            return;
        }
        
        const invoiceTables = await prisma.table.findMany({
            where: { 
                databaseId: database.id,
                protectedType: { in: ['invoices', 'invoice_items', 'customers'] }
            }
        });
        
        console.log('📊 Invoice tables found:', invoiceTables.map(t => ({
            name: t.name,
            protectedType: t.protectedType,
            id: t.id
        })));
        
        const invoicesTable = invoiceTables.find(t => t.protectedType === 'invoices');
        
        if (!invoicesTable) {
            console.log('❌ No invoices table found');
            return;
        }
        
        // Check invoices
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
        
        console.log(`📄 Found ${invoices.length} invoices`);
        
        if (invoices.length > 0) {
            const firstInvoice = invoices[0];
            const invoiceData = {};
            
            firstInvoice.cells.forEach(cell => {
                const columnName = cell.column.name;
                const semanticType = cell.column.semanticType;
                invoiceData[columnName] = cell.value;
                if (semanticType) {
                    invoiceData[semanticType] = cell.value;
                }
            });
            
            console.log('📋 First invoice sample:', {
                id: firstInvoice.id,
                invoice_number: invoiceData.invoice_number,
                total_amount: invoiceData.total_amount,
                status: invoiceData.status,
                created: firstInvoice.createdAt
            });
        }
        
        console.log('✅ Authentication and data access test completed successfully');
        
    } catch (error) {
        console.error('❌ Error during auth test:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testAuthSimple();
