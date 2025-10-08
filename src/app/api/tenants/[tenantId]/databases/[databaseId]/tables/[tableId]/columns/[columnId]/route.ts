/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkTableEditPermission } from "@/lib/auth";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { analyzeTypeChange } from "@/lib/column-type-analyzer";
import { executeTypeChange, validateTypeChangeOptions, estimateTypeChangeDuration } from "@/lib/column-type-migrator";
import { ColumnType, TypeChangeOptions } from "@/types/column-conversion";


export async function PATCH(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string; columnId: string }>;
	},
) {
	const { tenantId, databaseId, tableId, columnId } = await params;
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	// Check table edit permissions
	const canEdit = await checkTableEditPermission(
		userId,
		Number(tableId),
		Number(tenantId),
	);
	if (!canEdit) {
		return NextResponse.json(
			{ error: "Insufficient permissions to edit columns in this table" },
			{ status: 403 },
		);
	}

	try {
		// Verify the table exists and belongs to the tenant
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
				database: { tenantId: Number(tenantId) },
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table not found" },
				{ status: 404 },
			);
		}

		// Find the column to update
		const existingColumn = await prisma.column.findFirst({
			where: {
				id: Number(columnId),
				tableId: Number(tableId),
			},
		});

		if (!existingColumn) {
			return NextResponse.json(
				{ error: "Column not found" },
				{ status: 404 },
			);
		}

		// Prevent editing of module columns or predefined columns
		if (existingColumn.isModuleColumn) {
			const columnType = existingColumn.isModuleColumn ? "module" : "predefined";
			return NextResponse.json(
				{ error: `Cannot edit ${columnType} column. This column is required for system functionality.` },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const updateData = { ...body };

		// Force required and unique for primary key columns
		if (updateData.primary === true) {
			updateData.required = true;
			updateData.unique = true;
		}

		// ========== TYPE CHANGE HANDLING ==========
		// If type is being changed, we need special handling
		if (updateData.type && updateData.type !== existingColumn.type) {
			console.log(`🔄 Type change requested: ${existingColumn.type} → ${updateData.type}`);

			// 1. Analyze the impact of the type change
			const analysis = await analyzeTypeChange(
				Number(columnId),
				updateData.type as ColumnType
			);

			console.log('📊 Type change analysis:', {
				safe: analysis.safe,
				convertible: analysis.convertible,
				lossy: analysis.lossyConversion,
				willFail: analysis.willFail
			});

			// 2. Check if this is just an analysis request (no confirmation yet)
			const confirmed = request.nextUrl.searchParams.get('confirmed') === 'true';
			
			if (!confirmed) {
				// Return analysis for user review
				const estimate = estimateTypeChangeDuration(analysis.totalCells);

				return NextResponse.json({
					requiresConfirmation: true,
					analysis,
					estimate,
					message: analysis.safe 
						? '✅ This type change is safe and can proceed automatically.'
						: '⚠️  This type change requires your confirmation due to potential data loss or conversion issues.',
					confirmUrl: request.url + '?confirmed=true',
				}, { status: 428 }); // 428 Precondition Required
			}

			// 3. Confirmed - validate options
			const options: TypeChangeOptions = {
				deleteIncompatible: body.deleteIncompatible || false,
				convertToNull: body.convertToNull || true, // Default to NULL conversion
				acceptLoss: body.acceptLoss || false,
				userId,
				confirmed: true,
			};

			const validation = validateTypeChangeOptions(analysis, options);
			
			if (!validation.valid) {
				return NextResponse.json({
					error: 'Invalid type change options',
					details: validation.errors,
					analysis,
				}, { status: 400 });
			}

			// 4. If there are issues and user hasn't explicitly handled them, error
			if (analysis.willFail > 0 && !options.deleteIncompatible && !options.convertToNull) {
				return NextResponse.json({
					error: 'Type change will cause data loss',
					analysis,
					message: `${analysis.willFail} cells cannot be converted. Please specify how to handle them using deleteIncompatible or convertToNull options.`,
				}, { status: 400 });
			}

			if (analysis.lossyConversion > 0 && !options.acceptLoss) {
				return NextResponse.json({
					error: 'Type change will modify data',
					analysis,
					message: `${analysis.lossyConversion} cells will lose precision. Set acceptLoss: true to proceed.`,
				}, { status: 400 });
			}

			// 5. Execute the type change with data migration
			console.log('⚡ Executing type change with options:', options);
			
			const result = await executeTypeChange(
				Number(columnId),
				updateData.type as ColumnType,
				options
			);

			console.log('✅ Type change completed:', result.stats);

			return NextResponse.json({
				success: true,
				message: 'Column type changed successfully',
				column: result.column,
				migration: {
					stats: result.stats,
					duration: result.duration,
					// Include sample of conversion log (first 20 entries)
					logSample: result.log.slice(0, 20),
				},
			});
		}

		// ========== NORMAL UPDATE (No type change) ==========
		const updatedColumn = await prisma.column.update({
			where: { id: Number(columnId) },
			data: updateData,
		});

		return NextResponse.json(updatedColumn);
	} catch (error: any) {
		console.error("Error updating column:", error);
		
		// Check if it's a type change error
		if (error.code && ['UNSAFE_CONVERSION', 'TRANSACTION_FAILED', 'VALIDATION_FAILED'].includes(error.code)) {
			return NextResponse.json({
				error: error.message,
				code: error.code,
				details: error.details,
				analysis: error.analysis,
			}, { status: 400 });
		}

		return NextResponse.json(
			{ error: "Failed to update column" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string; columnId: string }>;
	},
) {
	const { tenantId, databaseId, tableId, columnId } = await params;
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	// Check table edit permissions
	const canEdit = await checkTableEditPermission(
		userId,
		Number(tableId),
		Number(tenantId),
	);
	if (!canEdit) {
		return NextResponse.json(
			{ error: "Insufficient permissions to delete columns in this table" },
			{ status: 403 },
		);
	}

	try {
		// Verify the table exists and belongs to the tenant
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
				database: { tenantId: Number(tenantId) },
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table not found" },
				{ status: 404 },
			);
		}

		// Find the column to delete
		const column = await prisma.column.findFirst({
			where: {
				id: Number(columnId),
				tableId: Number(tableId),
			},
		});

		if (!column) {
			return NextResponse.json(
				{ error: "Column not found" },
				{ status: 404 },
			);
		}

		// Prevent deletion of module columns or predefined columns
		if (column.isModuleColumn || column.isPredefined) {
			const columnType = column.isModuleColumn ? "module" : "predefined";
			return NextResponse.json(
				{ error: `Cannot delete ${columnType} column. This column is required for system functionality.` },
				{ status: 403 },
			);
		}

		// Delete the column (this will cascade to cells and column permissions)
		await prisma.column.delete({
			where: { id: Number(columnId) },
		});

		return NextResponse.json({ message: "Column deleted successfully" });
	} catch (error) {
		console.error("Error deleting column:", error);
		return NextResponse.json(
			{ error: "Failed to delete column" },
			{ status: 500 },
		);
	}
}