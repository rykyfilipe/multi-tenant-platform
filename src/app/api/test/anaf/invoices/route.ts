import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }

    const userId = getUserId(sessionResult);
    const tenantId = request.nextUrl.searchParams.get('tenantId') || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const parsedTenantId = parseInt(tenantId);

    // Verify user has access to this tenant
    const userTenant = await prisma.userTenant.findFirst({
      where: {
        userId,
        tenantId: parsedTenantId,
      },
    });

    if (!userTenant) {
      return NextResponse.json({ error: 'Access denied to this tenant' }, { status: 403 });
    }

    // Fetch invoices for the tenant
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: parsedTenantId,
      },
      select: {
        id: true,
        invoice_number: true,
        date: true,
        due_date: true,
        customer_name: true,
        total_amount: true,
        base_currency: true,
        status: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50, // Limit to 50 most recent invoices
    });

    return NextResponse.json({
      success: true,
      invoices: invoices.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        date: invoice.date.toISOString(),
        due_date: invoice.due_date?.toISOString() || null,
        customer_name: invoice.customer_name,
        total_amount: parseFloat(invoice.total_amount.toString()),
        base_currency: invoice.base_currency,
        status: invoice.status,
      })),
      count: invoices.length,
    });

  } catch (error) {
    console.error('Error fetching invoices for ANAF test:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch invoices for testing'
      },
      { status: 500 }
    );
  }
}
