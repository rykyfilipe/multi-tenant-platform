/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MigratorService, MigratorType } from '@/lib/migrators';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkTenantAccess } from '@/lib/tenant-utils';

const ImportRequestSchema = z.object({
	provider: z.enum(['oblio', 'smartbill', 'fgo', 'csv']),
	apiKey: z.string().optional(),
	fileContent: z.string().optional(),
	filePath: z.string().optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	deduplicationStrategy: z.enum(['external_id', 'invoice_number_date_customer']).optional(),
	skipDuplicates: z.boolean().optional(),
	createMissingCustomers: z.boolean().optional(),
	createMissingProducts: z.boolean().optional(),
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
		const hasAccess = await checkTenantAccess(session.user.id, params.tenantId);
		if (!hasAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Parse request body
		const body = await request.json();
		const validatedData = ImportRequestSchema.parse(body);

		// Prepare import options
		const importOptions = {
			tenantId: params.tenantId,
			provider: validatedData.provider as MigratorType,
			apiKey: validatedData.apiKey,
			fileContent: validatedData.fileContent,
			filePath: validatedData.filePath,
			dateFrom: validatedData.dateFrom,
			dateTo: validatedData.dateTo,
			deduplicationStrategy: validatedData.deduplicationStrategy,
			skipDuplicates: validatedData.skipDuplicates,
			createMissingCustomers: validatedData.createMissingCustomers,
			createMissingProducts: validatedData.createMissingProducts,
		};

		// Perform import
		const result = await MigratorService.importInvoices(
			validatedData.provider as MigratorType,
			importOptions
		);

		return NextResponse.json({
			success: true,
			result,
		});
	} catch (error) {
		console.error('Import error:', error);

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
				error: 'Import failed',
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
		const hasAccess = await checkTenantAccess(session.user.id, params.tenantId);
		if (!hasAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Get available providers
		const providers = MigratorService.getAvailableProviders();
		const providerInfo = providers.map(provider => ({
			...MigratorService.getProviderInfo(provider),
			name: provider,
		}));

		// Get import history
		const importHistory = await MigratorService.getImportHistory(params.tenantId, 20);

		return NextResponse.json({
			success: true,
			providers: providerInfo,
			importHistory,
		});
	} catch (error) {
		console.error('Error getting import info:', error);
		return NextResponse.json(
			{
				error: 'Failed to get import information',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
