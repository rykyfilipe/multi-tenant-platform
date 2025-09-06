/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, requireTenantAccess, getUserId } from '@/lib/session';
import { DigitalSignatureService } from '@/lib/digital-signature';

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
		const { signerName, signerEmail, algorithm = 'RSA-SHA256' } = body;

		if (!signerName || !signerEmail) {
			return NextResponse.json(
				{ error: 'Missing required fields: signerName, signerEmail' },
				{ status: 400 }
			);
		}

		// Get invoice data (this would be fetched from database)
		const invoiceData = JSON.stringify({
			invoiceId,
			tenantId,
			timestamp: new Date().toISOString(),
		});

		const signatureService = DigitalSignatureService.getInstance();
		const signature = await signatureService.signInvoice(
			invoiceData,
			userId.toString(),
			signerName,
			signerEmail,
			algorithm as 'RSA-SHA256' | 'ECDSA-SHA256'
		);

		return NextResponse.json({
			success: true,
			message: 'Invoice signed successfully',
			data: signature,
		});
	} catch (error) {
		console.error('Invoice signing error:', error);
		return NextResponse.json(
			{
				error: 'Failed to sign invoice',
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

		const signatureService = DigitalSignatureService.getInstance();
		const certificates = signatureService.getCertificates();

		return NextResponse.json({
			success: true,
			data: {
				certificates,
				availableAlgorithms: ['RSA-SHA256', 'ECDSA-SHA256'],
			},
		});
	} catch (error) {
		console.error('Get signature info error:', error);
		return NextResponse.json(
			{
				error: 'Failed to get signature information',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
