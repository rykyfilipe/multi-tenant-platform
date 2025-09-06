/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, requireTenantAccess, getUserId } from '@/lib/session';
import { InvoiceCancellationService } from '@/lib/invoice-cancellation';

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; invoiceId: string }> }
) {
	try {
		const { tenantId, invoiceId } = await params;
		const authResponse = await requireAuthResponse();
		if (authResponse) return authResponse;

		const tenantAccess = requireTenantAccess(authResponse, tenantId.toString());
		if (tenantAccess) return tenantAccess;

		const userId = getUserId(authResponse);
		if (!userId) {
			return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
		}

		const body = await request.json();
		const { reasonId, description } = body;

		if (!reasonId || !description) {
			return NextResponse.json(
				{ error: 'Missing required fields: reasonId, description' },
				{ status: 400 }
			);
		}

		const cancellationService = InvoiceCancellationService.getInstance();
		const result = await cancellationService.requestCancellation(
			invoiceId,
			tenantId.toString()	,
			userId.toString()	,
			reasonId,
			description
		);

		return NextResponse.json({
			success: true,
			message: 'Cancellation request created successfully',
			data: result,
		});
	} catch (error) {
		console.error('Invoice cancellation error:', error);
		return NextResponse.json(
			{
				error: 'Failed to request cancellation',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; invoiceId: string }> }
) {
	try {
		const { tenantId, invoiceId } = await params;
		const authResponse = await requireAuthResponse();
		if (authResponse) return authResponse;

		const tenantAccess = requireTenantAccess(authResponse, tenantId.toString());
		if (tenantAccess) return tenantAccess;

		const cancellationService = InvoiceCancellationService.getInstance();
		const cancellationRequests = await cancellationService.getCancellationRequests(invoiceId);

		return NextResponse.json({
			success: true,
			data: cancellationRequests,
		});
	} catch (error) {
		console.error('Get cancellation requests error:', error);
		return NextResponse.json(
			{
				error: 'Failed to get cancellation requests',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
