/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkColumnEditPermission, checkTableEditPermission } from "@/lib/auth";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
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
	description: z.string().optional(), // Column description
	semanticType: z.string().optional(), // What this column represents
	required: z.boolean().optional(),
	primary: z.boolean().optional(),
	unique: z.boolean().optional(), // Unique constraint
	autoIncrement: z.boolean().optional(),
	referenceTableId: z.number().optional(),
	customOptions: z.array(z.string()).optional(), // doar pt type "customArray"
	defaultValue: z.string().optional(), // Default value for the column
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
		const validatedData = ColumnUpdateSchema.parse(body);
		const updateData: any = {};
		
		// Only allow updating specific fields
		if (validatedData.name !== undefined) updateData.name = validatedData.name;
		if (validatedData.type !== undefined) updateData.type = validatedData.type;
		if (validatedData.description !== undefined) updateData.description = validatedData.description;
		if (validatedData.semanticType !== undefined) updateData.semanticType = validatedData.semanticType;
		if (validatedData.required !== undefined) updateData.required = validatedData.required;
		if (validatedData.primary !== undefined) updateData.primary = validatedData.primary;
		if (validatedData.unique !== undefined) updateData.unique = validatedData.unique;
		if (validatedData.referenceTableId !== undefined) updateData.referenceTableId = validatedData.referenceTableId;
		if (validatedData.customOptions !== undefined) updateData.customOptions = validatedData.customOptions;
		if (validatedData.defaultValue !== undefined) updateData.defaultValue = validatedData.defaultValue;
		if (validatedData.order !== undefined) updateData.order = validatedData.order;

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
