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
	}: { params: Promise<{ tableId: string; tenantId: string; rowId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId, tableId, rowId } = await params;
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

		const tablePermissions = await prisma.tablePermission.findFirst({
			where: {
				tableId: Number(tableId),
				tenantId: Number(tenantId),
				userId,
			},
		});

		if (!tablePermissions || !tablePermissions.canEdit) {
			return NextResponse.json(
				{ error: "You do not have permission to delete rows" },
				{ status: 403 },
			);
		}

		const table = await prisma.table.findUnique({
			where: { id: Number(tableId) },
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		const row = prisma.row.findFirst({
			where: {
				id: Number(rowId),
			},
		});

		if (!row)
			return NextResponse.json({ error: "Row not found" }, { status: 404 });

		await prisma.row.delete({
			where: { id: Number(rowId) },
		});

		return NextResponse.json({ message: "Row deleted successfully" });
	} catch (error) {
		console.error("Error deleting row:", error);
		return NextResponse.json(
			{ error: "Failed to delete row" },
			{ status: 500 },
		);
	}
}
