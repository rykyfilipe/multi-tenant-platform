/** @format */

import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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
