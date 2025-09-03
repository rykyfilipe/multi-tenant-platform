/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions, checkUserTenantAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';

const SeriesRequestSchema = z.object({
	series: z.string().min(1).max(50),
	prefix: z.string().max(20).optional(),
	suffix: z.string().max(20).optional(),
	separator: z.string().max(5).optional(),
	includeYear: z.boolean().optional(),
	includeMonth: z.boolean().optional(),
	resetYearly: z.boolean().optional(),
	startNumber: z.number().min(1).optional(),
});

export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		// Check authentication
		const session = await getServerSession();
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check tenant access
		const hasAccess = await checkUserTenantAccess(Number(session.user.id), Number(params.tenantId));
		if (!hasAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Get database for tenant
		const database = await prisma.database.findFirst({
			where: { tenantId: Number(params.tenantId) },
		});

		if (!database) {
			return NextResponse.json({ error: 'Database not found' }, { status: 404 });
		}

		// Get invoice series
		const series = await prisma.invoiceSeries.findMany({
			where: {
				tenantId: Number(params.tenantId),
				databaseId: database.id,
			},
			orderBy: {
				series: 'asc',
			},
		});

		return NextResponse.json({
			success: true,
			series,
		});
	} catch (error) {
		console.error('Error getting invoice series:', error);
		return NextResponse.json(
			{
				error: 'Failed to get invoice series',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		// Check authentication
		const session = await getServerSession();
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check tenant access
		const hasAccess = await checkUserTenantAccess(Number(session.user.id), Number(params.tenantId));
		if (!hasAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Parse request body
		const body = await request.json();
		const validatedData = SeriesRequestSchema.parse(body);

		// Get database for tenant
		const database = await prisma.database.findFirst({
			where: { tenantId: Number(params.tenantId) },
		});

		if (!database) {
			return NextResponse.json({ error: 'Database not found' }, { status: 404 });
		}

		// Check if series already exists
		const existingSeries = await prisma.invoiceSeries.findFirst({
			where: {
				tenantId: Number(params.tenantId),
				databaseId: database.id,
				series: validatedData.series,
			},
		});

		if (existingSeries) {
			return NextResponse.json(
				{ error: 'Series already exists' },
				{ status: 409 }
			);
		}

		// Create new series
		const newSeries = await prisma.invoiceSeries.create({
			data: {
				tenantId: Number(params.tenantId),
				databaseId: database.id,
				series: validatedData.series,
				prefix: validatedData.prefix || '',
				suffix: validatedData.suffix || '',
				separator: validatedData.separator || '-',
				includeYear: validatedData.includeYear || false,
				includeMonth: validatedData.includeMonth || false,
				resetYearly: validatedData.resetYearly || false,
				currentNumber: validatedData.startNumber || 0,
			},
		});

		// Log audit event
		await prisma.auditLog.create({
			data: {
				tenantId: Number(params.tenantId),
				databaseId: database.id,
				action: 'created',
				status: 'success',
				metadata: {
					resource: 'invoice_series',
					resourceId: newSeries.id,
					series: validatedData.series,
				},
			},
		});

		return NextResponse.json({
			success: true,
			series: newSeries,
		});
	} catch (error) {
		console.error('Error creating invoice series:', error);

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
				error: 'Failed to create invoice series',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		// Check authentication
		const session = await getServerSession();
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check tenant access
		const hasAccess = await checkUserTenantAccess(Number(session.user.id), Number(params.tenantId));
		if (!hasAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Parse request body
		const body = await request.json();
		const { id, ...updateData } = body;
		const validatedData = SeriesRequestSchema.partial().parse(updateData);

		if (!id) {
			return NextResponse.json(
				{ error: 'Series ID is required' },
				{ status: 400 }
			);
		}

		// Get database for tenant
		const database = await prisma.database.findFirst({
			where: { tenantId: Number(params.tenantId) },
		});

		if (!database) {
			return NextResponse.json({ error: 'Database not found' }, { status: 404 });
		}

		// Check if series exists
		const existingSeries = await prisma.invoiceSeries.findFirst({
			where: {
				id: id,
				tenantId: Number(params.tenantId),
				databaseId: database.id,
			},
		});

		if (!existingSeries) {
			return NextResponse.json(
				{ error: 'Series not found' },
				{ status: 404 }
			);
		}

		// Update series
		const updatedSeries = await prisma.invoiceSeries.update({
			where: { id: id },
			data: validatedData,
		});

		// Log audit event
		await prisma.auditLog.create({
			data: {
				tenantId: Number(params.tenantId),
				databaseId: database.id,
				action: 'updated',
				status: 'success',
				metadata: {
					resource: 'invoice_series',
					resourceId: id,
					changes: validatedData,
				},
			},
		});

		return NextResponse.json({
			success: true,
			series: updatedSeries,
		});
	} catch (error) {
		console.error('Error updating invoice series:', error);

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
				error: 'Failed to update invoice series',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		// Check authentication
		const session = await getServerSession();
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check tenant access
		const hasAccess = await checkUserTenantAccess(Number(session.user.id), Number(params.tenantId));
		if (!hasAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Parse request body
		const body = await request.json();
		const { id } = body;

		if (!id) {
			return NextResponse.json(
				{ error: 'Series ID is required' },
				{ status: 400 }
			);
		}

		// Get database for tenant
		const database = await prisma.database.findFirst({
			where: { tenantId: Number(params.tenantId) },
		});

		if (!database) {
			return NextResponse.json({ error: 'Database not found' }, { status: 404 });
		}

		// Check if series exists
		const existingSeries = await prisma.invoiceSeries.findFirst({
			where: {
				id: id,
				tenantId: Number(params.tenantId),
				databaseId: database.id,
			},
		});

		if (!existingSeries) {
			return NextResponse.json(
				{ error: 'Series not found' },
				{ status: 404 }
			);
		}

		// Check if series is in use
		const invoicesUsingSeries = await prisma.row.count({
			where: {
				tableId: {
					in: await prisma.table
						.findMany({
							where: { databaseId: database.id, name: 'invoices' },
						})
						.then((tables : any) => tables.map((t : any) => t.id)),
				},
				cells: {
					some: {
						column: {
							name: 'invoice_series',
						},
						value: existingSeries.series,
					},
				},
			},
		});

		if (invoicesUsingSeries > 0) {
			return NextResponse.json(
				{ error: 'Cannot delete series that is in use by invoices' },
				{ status: 409 }
			);
		}

		// Delete series
		await prisma.invoiceSeries.delete({
			where: { id: id },
		});

		// Log audit event
		await prisma.auditLog.create({
			data: {
				tenantId: Number(params.tenantId),
				databaseId: database.id,
				action: 'deleted',
				status: 'success',
				metadata: {
					resource: 'invoice_series',
					resourceId: id,
					series: existingSeries.series,
				},
			},
		});

		return NextResponse.json({
			success: true,
			message: 'Series deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting invoice series:', error);
		return NextResponse.json(
			{
				error: 'Failed to delete invoice series',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
