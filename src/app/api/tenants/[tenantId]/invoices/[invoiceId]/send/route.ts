/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { EnhancedPDFGenerator } from '@/lib/pdf-enhanced-generator';
import { EmailService } from '@/lib/email-service';
import prisma from '@/lib/prisma';

const SendInvoiceRequestSchema = z.object({
	to: z.array(z.string().email()).min(1, 'At least one recipient is required'),
	cc: z.array(z.string().email()).optional(),
	bcc: z.array(z.string().email()).optional(),
	subject: z.string().min(1, 'Subject is required'),
	body: z.string().min(1, 'Body is required'),
	includeWatermark: z.boolean().optional(),
	includeQRCode: z.boolean().optional(),
	includeBarcode: z.boolean().optional(),
	sendImmediately: z.boolean().optional(),
	templateId: z.string().optional(),
	templateVariables: z.record(z.any()).optional(),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: { tenantId: string; invoiceId: string } }
) {
	try {
		// Check authentication
		const sessionResult = await requireAuthResponse();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const userId = getUserId(sessionResult);
			if (!sessionResult.user.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check tenant access
		const tenantAccessError = requireTenantAccess(sessionResult, params.tenantId.toString());
		if (tenantAccessError) {
			return tenantAccessError;
		}

		// Parse request body
		const body = await request.json();
		const validatedData = SendInvoiceRequestSchema.parse(body);

		// Get database for tenant
		const database = await prisma.database.findFirst({
			where: { tenantId: Number(params.tenantId) },
		});

		if (!database) {
			return NextResponse.json({ error: 'Database not found' }, { status: 404 });
		}

		// Verify invoice exists
		const invoiceTables = await prisma.table.findMany({
			where: { databaseId: database.id, name: 'invoices' },
		});

		if (invoiceTables.length === 0) {
			return NextResponse.json({ error: 'Invoice system not initialized' }, { status: 404 });
		}

		const invoiceExists = await prisma.row.findFirst({
			where: {
				id: Number(params.invoiceId),
				tableId: invoiceTables[0].id,
			},
		});

		if (!invoiceExists) {
			return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
		}

		// Prepare PDF generation options
		const pdfOptions = {
			tenantId: params.tenantId,
			databaseId: database.id,
			invoiceId: Number(params.invoiceId),
			includeWatermark: validatedData.includeWatermark || false,
			includeQRCode: validatedData.includeQRCode || false,
			includeBarcode: validatedData.includeBarcode || false,
		};

		// Prepare email options
		const emailOptions = {
			to: validatedData.to,
			cc: validatedData.cc,
			bcc: validatedData.bcc,
			subject: validatedData.subject,
			body: validatedData.body,
		};

		let result: any;

		if (validatedData.sendImmediately) {
			// Send email immediately
			const success = await EnhancedPDFGenerator.sendInvoiceEmail(pdfOptions, emailOptions);
			
			result = {
				success,
				method: 'immediate',
				message: success ? 'Invoice sent successfully' : 'Failed to send invoice',
			};
		} else {
			// Queue email for sending
			const emailId = await EmailService.queueEmail(params.tenantId, emailOptions, {
				templateId: validatedData.templateId,
				templateVariables: validatedData.templateVariables,
				priority: 'normal',
			});

			result = {
				success: true,
				method: 'queued',
				emailId,
				message: 'Invoice queued for sending',
			};
		}

		// Log the action
		await prisma.invoiceAuditLog.create({
			data: {
				tenantId: Number(params.tenantId),
				databaseId: database.id,
				invoiceId: Number(params.invoiceId),
				action: 'invoice_sent',
				metadata: {
					recipients: validatedData.to,
					method: result.method,
					status: result.success ? 'success' : 'error',
					emailId: result.emailId,
				},
			},
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error('Send invoice error:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: 'Validation failed',
					details: error.errors,
				},
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{
				error: 'Failed to send invoice',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string; invoiceId: string } }
) {
	try {
		// Check authentication
		const sessionResult = await requireAuthResponse();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const userId = getUserId(sessionResult);
		if (!sessionResult.user.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check tenant access
		const tenantAccessError = requireTenantAccess(sessionResult, params.tenantId.toString());
		if (tenantAccessError) {
			return tenantAccessError;
		}

		// Get email templates for this tenant
		const emailTemplates = await prisma.emailTemplate.findMany({
			where: { tenantId: Number(params.tenantId) },
			select: {
				id: true,
				name: true,
				subject: true,
				body: true,
				variables: true,
			},
		});

		// Get email queue status
		const queueStatus = await EmailService.getQueueStatus(params.tenantId);

		// Get recent email history for this invoice
		const emailHistory = await prisma.invoiceAuditLog.findMany({
			where: {
				tenantId: Number(params.tenantId),
				action: 'invoice_sent',
				metadata: {
					path: ['invoiceId'],
					equals: Number(params.invoiceId),
				},
			},
			orderBy: { createdAt: 'desc' },
			take: 10,
		});

		return NextResponse.json({
			success: true,
			emailTemplates,
			queueStatus,
			emailHistory: emailHistory.map((log: any) => ({
				id: log.id,
				createdAt: log.createdAt,
				status: log.status,
				recipients: log.metadata?.recipients || [],
				method: log.metadata?.method || 'unknown',
			})),
		});
	} catch (error) {
		console.error('Error getting send invoice info:', error);
		return NextResponse.json(
			{
				error: 'Failed to get send invoice information',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
