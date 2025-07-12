/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";
import { colExists } from "@/lib/utils";

export const ColumnSchema = z.object({
	name: z.string().min(1, "Name is mandatory"),
	type: z.enum(["string", "boolean", "number", "date"]),
	required: z.boolean().optional(),
	primary: z.boolean().optional(),
	autoIncrement: z.boolean().optional(),
});

export const ColumnsSchema = z.object({
	columns: z.array(ColumnSchema),
});

export async function POST(
	request: Request,
	{ params }: { params: { tenantId: string; tableId: string } },
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
		const parsedData = ColumnsSchema.parse(body);

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

		const columns = await Promise.all(
			parsedData.columns.map((col) => {
				const parsedCol = ColumnSchema.parse(col);

				if (!colExists(table.columns, parsedCol))
					return prisma.column.create({
						data: {
							name: parsedCol.name,
							type: parsedCol.type,
							required: parsedCol.required ?? false,
							primary: parsedCol.primary ?? false,
							autoIncrement: parsedCol.autoIncrement ?? false,
							tableId: table.id,
						},
					});
			}),
		);

		return NextResponse.json(columns, { status: 201 });
	} catch (error: any) {
		console.error("❌ Failed to create columns:", error);
		return NextResponse.json(
			{ error: error?.message ?? "Failed to create columns" },
			{ status: 500 },
		);
	}
}
