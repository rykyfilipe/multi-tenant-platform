import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import prisma, { withRetry } from '@/lib/prisma';

export async function GET() {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }
    
    const userId = getUserId(sessionResult);
    if (!sessionResult.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userResult = await withRetry(() => 
      prisma.user.findFirst({
        where: { email: sessionResult.user.email },
      })
    );

    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's tenants
    const userTenants = await withRetry(() =>
      prisma.userTenant.findMany({
        where: { userId: userResult.id },
        include: { tenant: true }
      })
    );

    if (userTenants.length === 0) {
      return NextResponse.json({ 
        success: true, 
        invoices: [],
        message: "No tenants found for user"
      });
    }

    // Get invoices from all user's tenants
    const invoices = [];
    for (const userTenant of userTenants) {
      const tenantId = userTenant.tenantId;
      
      // Get tenant's database
      const database = await withRetry(() =>
        prisma.database.findFirst({
          where: { tenantId: tenantId }
        })
      );

      if (!database) continue;

      // Get invoice tables
      const invoiceTables = await withRetry(() =>
        prisma.table.findMany({
          where: { 
            databaseId: database.id,
            name: { in: ['invoices', 'invoice'] }
          },
          include: {
            columns: true,
            rows: {
              include: {
                cells: {
                  include: {
                    column: true
                  }
                }
              }
            }
          }
        })
      );

      for (const table of invoiceTables) {
        // Process invoice rows
        for (const row of table.rows) {
          const invoiceData: any = { id: row.id };
          
          // Extract data from cells
          for (const cell of row.cells) {
            const columnName = cell.column.name;
            let value = cell.value;
            
            // Convert numeric values
            if (cell.column.dataType === 'number' && value !== null) {
              value = parseFloat(value);
            }
            
            invoiceData[columnName] = value;
          }
          
          // Only include if it has required fields
          if (invoiceData.invoice_number && invoiceData.customer_id) {
            // Get customer name if customer_id exists
            if (invoiceData.customer_id) {
              const customerTable = await withRetry(() =>
                prisma.table.findFirst({
                  where: { 
                    databaseId: database.id,
                    name: { in: ['customers', 'customer'] }
                  },
                  include: {
                    rows: {
                      include: {
                        cells: {
                          include: {
                            column: true
                          }
                        }
                      }
                    }
                  }
                })
              );

              if (customerTable) {
                const customerRow = customerTable.rows.find(r => r.id === invoiceData.customer_id);
                if (customerRow) {
                  const customerName = customerRow.cells.find(c => 
                    c.column.name === 'customer_name' || c.column.name === 'name'
                  )?.value;
                  invoiceData.customer_name = customerName || `Customer ${invoiceData.customer_id}`;
                }
              }
            }
            
            // Set default values for missing fields
            invoiceData.customer_name = invoiceData.customer_name || `Customer ${invoiceData.customer_id}`;
            invoiceData.date = invoiceData.date || new Date().toISOString();
            invoiceData.due_date = invoiceData.due_date || invoiceData.date;
            invoiceData.total_amount = invoiceData.total_amount || 0;
            invoiceData.base_currency = invoiceData.base_currency || 'RON';
            invoiceData.status = invoiceData.status || 'draft';
            
            invoices.push(invoiceData);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      invoices: invoices.slice(0, 50), // Limit to 50 invoices for testing
      count: invoices.length
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
