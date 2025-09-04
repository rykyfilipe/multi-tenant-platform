/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkColumnEditPermission, checkTableEditPermission } from "@/lib/auth";
import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import { z } from "zod";

const ColumnUpdateSchema = z.object({
	name: z.string().optional(),
	type: z
		.enum([
			"string",
			"text",
			"boolean",
			"number",
			"date",
			"reference",
			"customArray",
		])
		.optional(), // Remove the transform
	semanticType: z.string().optional(), // What this column represents
	required: z.boolean().optional(),
	primary: z.boolean().optional(),
	autoIncrement: z.boolean().optional(),
	referenceTableId: z.number().optional(),
	order: z.number().optional(),
});

export async function PATCH(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{
			tenantId: string;
			databaseId: string;
			tableId: string;
			columnId: string;
		}>;
	},
) {
	const { tenantId, databaseId, tableId, columnId } = await params;
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const { user } = sessionResult;
	const userId = user.id;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Check table edit permissions for column operations
	const canEdit = await checkTableEditPermission(
		userId,
		Number(tableId),
		Number(tenantId),
	);
	if (!canEdit)
		return NextResponse.json(
			{ error: "Insufficient permissions to edit columns in this table" },
			{ status: 403 },
		);

	try {
		const body = await request.json();

		// Check if column is locked
		const column = await prisma.column.findUnique({
			where: { id: Number(columnId) },
			select: { isLocked: true },
		});

		if (!column) {
			return NextResponse.json(
				{ error: "Column not found" },
				{ status: 404 },
			);
		}

		// Prevent modification of locked columns
		if (column.isLocked) {
			return NextResponse.json(
				{ error: "Cannot modify locked column. This column is required for system functionality." },
				{ status: 403 },
			);
		}

		// Validate the update data
		const updateData: any = {};
		
		// Only allow updating specific fields
		if (body.name !== undefined) updateData.name = body.name;
		if (body.type !== undefined) updateData.type = body.type;
		if (body.semanticType !== undefined) updateData.semanticType = body.semanticType;
		if (body.required !== undefined) updateData.required = body.required;
		if (body.primary !== undefined) updateData.primary = body.primary;
		if (body.referenceTableId !== undefined) updateData.referenceTableId = body.referenceTableId;
		if (body.customOptions !== undefined) updateData.customOptions = body.customOptions;
		if (body.order !== undefined) updateData.order = body.order;

		// Update the column
		const updatedColumn = await prisma.column.update({
			where: { id: Number(columnId) },
			data: updateData,
		});

		return NextResponse.json(updatedColumn);
	} catch (error) {
		console.error("Error updating column:", error);
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
		params: Promise<{
			tenantId: string;
			databaseId: string;
			tableId: string;
			columnId: string;
		}>;
	},
) {
	const { tenantId, databaseId, tableId, columnId } = await params;
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const { user } = sessionResult;
	const userId = user.id;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Check table edit permissions for column operations
	const canEdit = await checkTableEditPermission(
		userId,
		Number(tableId),
		Number(tenantId),
	);
	if (!canEdit)
		return NextResponse.json(
			{ error: "Insufficient permissions to delete columns in this table" },
			{ status: 403 },
		);

	try {
		// Check if column is locked
		const column = await prisma.column.findUnique({
			where: { id: Number(columnId) },
			select: { isLocked: true },
		});

		if (!column) {
			return NextResponse.json(
				{ error: "Column not found" },
				{ status: 404 },
			);
		}

		// Prevent deletion of locked columns
		if (column.isLocked) {
			return NextResponse.json(
				{ error: "Cannot delete locked column. This column is required for system functionality." },
				{ status: 403 },
			);
		}

		// Delete the column (this will cascade to cells)
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
