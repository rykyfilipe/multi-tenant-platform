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

	try {
		const { tableId } = await params;

		const table = await prisma.table.findUnique({
			where: {
				id: parseInt(tableId),
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
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Creează un map pentru id -> nume coloană
		const columnMap = new Map<number, string>();
		for (const column of table.columns) {
			columnMap.set(column.id, column.name);
		}

		// Transformă rândurile
		const transformedRows = table.rows.map((row) => {
			const rowData: Record<string, any> = {
				id: row.id,
				createdAt: row.createdAt,
			};

			for (const cell of row.cells) {
				const columnName = columnMap.get(cell.columnId);
				if (columnName) {
					rowData[columnName] = cell.value;
				}
			}

			return rowData;
		});

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
