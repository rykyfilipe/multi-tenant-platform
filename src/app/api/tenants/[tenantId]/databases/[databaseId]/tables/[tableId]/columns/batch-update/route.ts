/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";

/**
 * PATCH - Batch update columns (primarily for reordering)
 * Updates multiple columns at once, typically used for column reordering
 */
export async function PATCH(
	request: Request,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const sessionResult = await requireAuthResponse("ADMIN");
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId, databaseId, tableId } = await params;
	const userId = getUserId(sessionResult);

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		// Verify table exists and belongs to tenant
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
				database: {
					tenantId: Number(tenantId),
				},
			},
			include: {
				columns: {
					select: { id: true },
				},
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		const body = await request.json();
		const { updates } = body;

		if (!Array.isArray(updates) || updates.length === 0) {
			return NextResponse.json(
				{ error: "Updates must be a non-empty array" },
				{ status: 400 },
			);
		}

		// Get valid column IDs for this table
		const validColumnIds = new Set(table.columns.map(c => c.id));

		// Validate and prepare updates
		const validUpdates = [];
		for (const update of updates) {
			if (!update.id) {
				return NextResponse.json(
					{ error: "Each update must have an id" },
					{ status: 400 },
				);
			}

			// Verify column belongs to this table
			if (!validColumnIds.has(Number(update.id))) {
				return NextResponse.json(
					{ error: `Column ${update.id} not found in this table` },
					{ status: 404 },
				);
			}

			const { id, ...data } = update;
			
			// Only include fields that are provided
			const updateData: any = {};
			if (data.order !== undefined) updateData.order = Number(data.order);
			if (data.name !== undefined) updateData.name = data.name;
			if (data.type !== undefined) updateData.type = data.type;
			if (data.description !== undefined) updateData.description = data.description;
			if (data.required !== undefined) updateData.required = data.required;
			if (data.unique !== undefined) updateData.unique = data.unique;
			if (data.defaultValue !== undefined) updateData.defaultValue = data.defaultValue;
			if (data.referenceTableId !== undefined) updateData.referenceTableId = data.referenceTableId ? Number(data.referenceTableId) : null;
			if (data.customOptions !== undefined) updateData.customOptions = data.customOptions;
			if (data.isLocked !== undefined) updateData.isLocked = data.isLocked;
			if (data.semanticType !== undefined) updateData.semanticType = data.semanticType;

			validUpdates.push({
				id: Number(id),
				data: updateData,
			});
		}

		// Use transaction with proper promise array
		const updatePromises = validUpdates.map(({ id, data }) =>
			prisma.column.update({
				where: { id },
				data,
			})
		);

		const updatedColumns = await prisma.$transaction(updatePromises);

		return NextResponse.json({
			message: "Columns updated successfully",
			updatedCount: updatedColumns.length,
			columns: updatedColumns,
		});
	} catch (error) {
		console.error("Error batch updating columns:", error);
		return NextResponse.json(
			{ error: "Failed to batch update columns" },
			{ status: 500 },
		);
	}
}

