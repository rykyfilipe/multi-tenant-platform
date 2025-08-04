/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";

const CellUpdateSchema = z.object({
	value: z.any(),
});

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string; tableId: string; rowId: string; cellId: string }> },
) {
	const { tenantId, databaseId, tableId, rowId, cellId } = await params;
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (role === "VIEWER" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsedData = CellUpdateSchema.parse(body);

		// Verificăm că baza de date există și aparține tenant-ului
		const database = await prisma.database.findFirst({
			where: { 
				id: Number(databaseId),
				tenantId: Number(tenantId) 
			},
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		// Verificăm că celula există și aparține tabelului și rândului corect
		const cell = await prisma.cell.findFirst({
			where: {
				id: Number(cellId),
				rowId: Number(rowId),
				row: {
					tableId: Number(tableId),
					table: {
						databaseId: Number(databaseId),
					},
				},
			},
		});

		if (!cell) {
			return NextResponse.json(
				{ error: "Cell not found" },
				{ status: 404 },
			);
		}

		// Verificăm permisiunile pentru utilizatorii non-admin
		if (role !== "ADMIN") {
			const permission = await prisma.tablePermission.findFirst({
				where: {
					userId: userId,
					tableId: Number(tableId),
					canEdit: true,
				},
			});

			if (!permission) {
				return NextResponse.json(
					{ error: "Access denied" },
					{ status: 403 },
				);
			}
		}

		// Actualizăm celula
		const updatedCell = await prisma.cell.update({
			where: {
				id: Number(cellId),
			},
			data: {
				value: parsedData.value,
			},
			include: {
				column: true,
			},
		});

		return NextResponse.json(updatedCell);
	} catch (error) {
		console.error("Error updating cell:", error);
		return NextResponse.json(
			{ error: "Failed to update cell" },
			{ status: 500 },
		);
	}
} 