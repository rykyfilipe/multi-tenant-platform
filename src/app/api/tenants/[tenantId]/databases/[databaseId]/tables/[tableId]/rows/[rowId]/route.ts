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
		params: Promise<{
			tenantId: string;
			databaseId: string;
			tableId: string;
			rowId: string;
		}>;
	},
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId, databaseId, tableId, rowId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		// Verificăm dacă tabela există și aparține tenant-ului și database-ului
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				database: {
					id: Number(databaseId),
					tenantId: Number(tenantId),
				},
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Pentru utilizatorii non-admin, verificăm permisiunile
		if (role !== "ADMIN") {
			const tablePermission = await prisma.tablePermission.findFirst({
				where: {
					userId: userId,
					tableId: Number(tableId),
					tenantId: Number(tenantId),
				},
			});

			if (!tablePermission?.canDelete) {
				return NextResponse.json(
					{ error: "Insufficient permissions to delete rows" },
					{ status: 403 },
				);
			}
		}

		// Verificăm dacă rândul există
		const existingRow = await prisma.row.findFirst({
			where: {
				id: Number(rowId),
				tableId: Number(tableId),
			},
		});

		if (!existingRow) {
			return NextResponse.json({ error: "Row not found" }, { status: 404 });
		}

		// Ștergem rândul (celulele se vor șterge automat prin cascade)
		await prisma.row.delete({
			where: {
				id: Number(rowId),
			},
		});

		return NextResponse.json(
			{ message: "Row deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error deleting row:", error);
		return NextResponse.json(
			{ error: "Failed to delete row" },
			{ status: 500 },
		);
	}
}
