/** @format */

import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const CellSchema = z.object({
	field: z.enum(["name", "type", "required", "primary", "autoIncrement"]),
	value: z.any(),
});

export async function DELETE(
	request: Request,
	{
		params,
	}: {
		params: Promise<{ tableId: string; tenantId: string; columnId: string }>;
	},
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId, tableId, columnId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const { tableId } = await params;

		const table = await prisma.table.findUnique({
			where: { id: Number(tableId) },
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		const row = prisma.column.findFirst({
			where: {
				id: Number(columnId),
			},
		});

		if (!row)
			return NextResponse.json({ error: "Row not found" }, { status: 404 });

		await prisma.column.delete({
			where: { id: Number(columnId) },
		});

		return NextResponse.json({ message: "Column deleted successfully" });
	} catch (error) {
		console.error("Error deleting row:", error);
		return NextResponse.json(
			{ error: "Failed to delete row" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: Request,

	{
		params,
	}: {
		params: Promise<{ tenantId: string; tableId: string; columnId: string }>;
	},
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { tenantId, tableId, columnId } = await params;
	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (role !== "ADMIN" || !isMember) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const parsedData = CellSchema.parse(body);
		const { field, value } = parsedData;

		if (["id", "tableId"].includes(field)) {
			return NextResponse.json(
				{ error: `Cannot update field '${field}'` },
				{ status: 400 },
			);
		}

		const database = await prisma.database.findFirst({
			where: { tenantId: Number(tenantId) },
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: database.id,
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table doesn't exist" },
				{ status: 404 },
			);
		}

		const updatedColumn = await prisma.column.update({
			where: { id: Number(columnId) },
			data: {
				[field]: value,
			},
		});

		return NextResponse.json(updatedColumn, { status: 200 });
	} catch (error: any) {
		console.error("❌ Failed to update column:", error);
		return NextResponse.json(
			{ error: error?.message ?? "Failed to update column" },
			{ status: 500 },
		);
	}
}
