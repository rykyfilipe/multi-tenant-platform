/** @format */

import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";
import { updateMemoryAfterRowChange } from "@/lib/memory-middleware";
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
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId, databaseId, tableId, rowId } = await params;
	const userId = getUserId(sessionResult);

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

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
		if (sessionResult.user.role !== "ADMIN") {
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

		// Actualizăm memoria după ștergerea rândului
		await updateMemoryAfterRowChange(Number(tenantId));

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
