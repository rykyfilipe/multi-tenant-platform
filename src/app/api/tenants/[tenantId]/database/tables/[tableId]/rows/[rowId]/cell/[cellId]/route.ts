/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";

const CellSchema = z.object({
	value: z.any(),
});

export async function PATCH(
	request: Request,
	{
		params,
	}: {
		params: Promise<{
			tenantId: string;
			tableId: string;
			rowId: string;
			cellId: string;
		}>;
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

	const { tenantId, tableId, rowId, cellId } = await params;
	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsedData = CellSchema.parse(body);

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
			include: {
				columns: true,
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table doesn't exist" },
				{ status: 404 },
			);
		}

		const cell = await prisma.cell.update({
			where: {
				id: Number(cellId),
			},
			data: {
				value: parsedData.value,
			},
		});

		return NextResponse.json(cell, { status: 201 });
	} catch (error: any) {
		console.error("❌ Failed to create columns:", error);
		return NextResponse.json(
			{ error: error?.message ?? "Failed to create columns" },
			{ status: 500 },
		);
	}
}
