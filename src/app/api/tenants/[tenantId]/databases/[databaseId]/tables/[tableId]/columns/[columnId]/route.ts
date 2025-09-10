/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkTableEditPermission } from "@/lib/auth";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";

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