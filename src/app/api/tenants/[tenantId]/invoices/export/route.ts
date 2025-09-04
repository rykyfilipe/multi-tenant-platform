/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MigratorService } from '@/lib/migrators';
import { getServerSession } from 'next-auth';
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
const ExportRequestSchema = z.object({
	format: z.enum(['csv', 'json']),
	limit: z.number().min(1).max(10000).optional(),
	filters: z.object({
		dateFrom: z.string().optional(),
		dateTo: z.string().optional(),
		status: z.string().optional(),
		customerId: z.number().optional(),
	}).optional(),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check tenant access
		const hasAccess = requireTenantAccess(sessionResult, tenantId);
		if (!hasAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Parse request body
		const body = await request.json();
		const validatedData = ExportRequestSchema.parse(body);

		// Prepare export options
		const exportOptions = {
			tenantId: params.tenantId,
			format: validatedData.format,
			limit: validatedData.limit,
			filters: validatedData.filters,
		};

		// Perform export
		const result = await MigratorService.exportInvoices(exportOptions);

		// Return file as response
		return new NextResponse(result.data, {
			status: 200,
			headers: {
				'Content-Type': result.mimeType,
				'Content-Disposition': `attachment; filename="${result.filename}"`,
				'Content-Length': Buffer.byteLength(result.data).toString(),
			},
		});
	} catch (error) {
		console.error('Export error:', error);

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
				error: 'Export failed',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check tenant access
		const hasAccess = requireTenantAccess(sessionResult, tenantId);
		if (!hasAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Get export history
		const exportHistory = await MigratorService.getExportHistory(params.tenantId, 20);

		// Get available export formats
		const availableFormats = [
			{
				name: 'csv',
				displayName: 'CSV',
				description: 'Export invoices as CSV file',
				mimeType: 'text/csv',
			},
			{
				name: 'json',
				displayName: 'JSON',
				description: 'Export invoices as JSON file',
				mimeType: 'application/json',
			},
		];

		return NextResponse.json({
			success: true,
			formats: availableFormats,
			exportHistory,
		});
	} catch (error) {
		console.error('Error getting export info:', error);
		return NextResponse.json(
			{
				error: 'Failed to get export information',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
