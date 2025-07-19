/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { tuple, z } from "zod";
import { createRowWithCells } from "@/lib/rows";

const CellSchema = z.object({
	columnId: z.number(),
	value: z.any().optional(),
});

const RowSchema = z.object({
	cells: z.array(CellSchema),
});

const RowsSchema = z.object({
	rows: z.array(RowSchema),
});

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ tableId: string; tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { tenantId, tableId } = await params;
	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		console.log(body);
		const parsedData = RowsSchema.parse(body);

		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
			},
			include: {
				columns: true,
			},
		});

		if (!table)
			return NextResponse.json({ error: "Table not founded" }, { status: 404 });

		const createdRows = await Promise.all(
			parsedData.rows.map((rowData) =>
				createRowWithCells(Number(tableId), table.columns, rowData),
			),
		);

		const newRow = await prisma.row.findFirst({
			where: {
				id: createdRows[0].id,
			},
			include: {
				cells: true,
			},
		});

		return NextResponse.json(
			{ message: "Rows created", newRow },
			{ status: 201 },
		);
	} catch (error: any) {
		console.error("❌ Failed to create rows:", error);
		return NextResponse.json(
			{ error: error?.message ?? "Failed to create rows" },
			{ status: 500 },
		);
	}
}
