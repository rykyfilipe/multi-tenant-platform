/** @format */

import prisma from "@/lib/prisma";
import { verifyPublicToken, getPublicUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tableId: string }> },
) {
	const isValid = await verifyPublicToken(request);
	if (!isValid) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getPublicUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	try {
		const token = await prisma.apiToken.findFirst({
			where: { userId: userId },
			select: { scopes: true },
		});

		if (!token || !token.scopes.includes("tables:read")) {
			return NextResponse.json(
				{ error: "Forbidden: Insufficient permissions" },
				{ status: 403 },
			);
		}

		const { tableId } = await params;

		const table = await prisma.table.findUnique({
			where: {
				id: parseInt(tableId),
				isPublic: true, // Doar tabelele publice
			},
			include: {
				columns: true,
				rows: {
					include: {
						cells: true,
					},
				},
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table not found or not public" },
				{ status: 404 },
			);
		}

		// Creează un map pentru id -> nume coloană
		const columnMap = new Map<number, string>();
		for (const column of table.columns) {
			columnMap.set(column.id, column.name);
		}

		// Găsim cheia primară a tabelului
		const primaryKeyColumn = table.columns.find((col) => col.primary);

		// Transformă rândurile
		const transformedRows = await Promise.all(
			table.rows.map(async (row) => {
				const rowData: Record<string, any> = {
					id: row.id,
					createdAt: row.createdAt,
				};

				// Adăugăm valoarea cheii primare dacă există
				if (primaryKeyColumn) {
					const primaryKeyCell = row.cells.find(
						(cell) => cell.columnId === primaryKeyColumn.id,
					);
					if (primaryKeyCell) {
						rowData[primaryKeyColumn.name] = primaryKeyCell.value;
					}
				}

				for (const cell of row.cells) {
					const column = table.columns.find((col) => col.id === cell.columnId);
					const columnName = columnMap.get(cell.columnId);

					if (columnName && column) {
						// Pentru coloanele de referință, valoarea este deja cheia primară
						// Pentru coloanele normale, păstrăm valoarea originală
						rowData[columnName] = cell.value;
					}
				}

				return rowData;
			}),
		);

		// Structură user-friendly
		const result = {
			id: table.id,
			name: table.name,
			description: table.description,
			databaseId: table.databaseId,
			rows: transformedRows,
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching table:", error);
		return NextResponse.json(
			{ error: "Failed to fetch table" },
			{ status: 500 },
		);
	}
}
