/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, requireTenantAccess, getUserId } from '@/lib/session';
import { InvoiceApprovalService } from '@/lib/invoice-approval';

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; invoiceId: string }> }
) {
	try {
		const { tenantId, invoiceId } = await params;
		const authResponse = await requireAuthResponse();
		if (authResponse) return authResponse;

		const tenantAccess = requireTenantAccess(tenantId);
		if (tenantAccess) return tenantAccess;

		const userId = getUserId();
		if (!userId) {
			return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
		}

		const body = await request.json();
		const { approverId, approverName, approverEmail, comments } = body;

		if (!approverId || !approverName || !approverEmail) {
			return NextResponse.json(
				{ error: 'Missing required fields: approverId, approverName, approverEmail' },
				{ status: 400 }
			);
		}

		const approvalService = InvoiceApprovalService.getInstance();
		const result = await approvalService.approveInvoice(
			invoiceId,
			approverId,
			approverName,
			approverEmail,
			comments
		);

		return NextResponse.json({
			success: true,
			message: 'Invoice approved successfully',
			data: result,
		});
	} catch (error) {
		console.error('Invoice approval error:', error);
		return NextResponse.json(
			{
				error: 'Failed to approve invoice',
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

		const tenantAccess = requireTenantAccess(tenantId);
		if (tenantAccess) return tenantAccess;

		const approvalService = InvoiceApprovalService.getInstance();
		const requestId = request.nextUrl.searchParams.get('requestId');

		if (requestId) {
			const approvalRequest = await approvalService.getApprovalRequest(requestId);
			if (!approvalRequest) {
				return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
			}

			return NextResponse.json({
				success: true,
				data: approvalRequest,
			});
		}

		// Get all approval requests for this invoice
		const approvalRequests = await approvalService.getApprovalRequests(invoiceId);
		
		return NextResponse.json({
			success: true,
			data: approvalRequests,
		});
	} catch (error) {
		console.error('Get approval requests error:', error);
		return NextResponse.json(
			{
				error: 'Failed to get approval requests',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
