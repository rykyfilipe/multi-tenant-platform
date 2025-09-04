/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkTableEditPermission } from "@/lib/auth";
import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import { z } from "zod";

const CellCreateSchema = z.object({
	columnId: z.number(),
	value: z.any(),
});

export async function POST(
	request: NextRequest,
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
	const { tenantId, databaseId, tableId, rowId } = await params;
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const { user } = sessionResult;
	const userId = user.id;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Check table edit permissions instead of hard-coded role check
	const canEdit = await checkTableEditPermission(
		userId,
		Number(tableId),
		Number(tenantId),
	);
	if (!canEdit)
		return NextResponse.json(
			{ error: "Insufficient permissions to edit this table" },
			{ status: 403 },
		);

	try {
		const body = await request.json();
		const parsedData = CellCreateSchema.parse(body);
		const { columnId, value } = parsedData;

		// Verificăm că baza de date există și aparține tenant-ului
		const database = await prisma.database.findFirst({
			where: {
				id: Number(databaseId),
				tenantId: Number(tenantId),
			},
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		// Verifică dacă rândul există
		const row = await prisma.row.findFirst({
			where: {
				id: Number(rowId),
				tableId: Number(tableId),
				table: {
					databaseId: Number(databaseId),
					database: {
						tenantId: Number(tenantId),
					},
				},
			},
		});

		if (!row) {
			return NextResponse.json({ error: "Row not found" }, { status: 404 });
		}

		// Verifică dacă coloana există
		const column = await prisma.column.findFirst({
			where: {
				id: Number(columnId),
				tableId: Number(tableId),
				table: {
					databaseId: Number(databaseId),
					database: {
						tenantId: Number(tenantId),
					},
				},
			},
		});

		if (!column) {
			return NextResponse.json({ error: "Column not found" }, { status: 404 });
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
				return NextResponse.json({ error: "Access denied" }, { status: 403 });
			}
		}

		// Verifică dacă celula există deja
		const existingCell = await prisma.cell.findFirst({
			where: {
				rowId: Number(rowId),
				columnId: Number(columnId),
			},
		});

		if (existingCell) {
			return NextResponse.json(
				{ error: "Cell already exists for this row and column" },
				{ status: 409 },
			);
		}

		// Creează celula nouă
		const newCell = await prisma.cell.create({
			data: {
				rowId: Number(rowId),
				columnId: Number(columnId),
				value: value,
			},
			select: {
				id: true,
				value: true,
				rowId: true,
				columnId: true,
				column: {
					select: {
						id: true,
						name: true,
						type: true,
					},
				},
			},
		});

		return NextResponse.json(newCell, { status: 201 });
	} catch (error) {
		console.error("Error creating cell:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
