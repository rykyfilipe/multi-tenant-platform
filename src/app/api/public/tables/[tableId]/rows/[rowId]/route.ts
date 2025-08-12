/** @format */

import { getPublicUserFromRequest, verifyPublicToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ tableId: string; rowId: string }> },
) {
	const isValid = await verifyPublicToken(req);
	if (!isValid) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getPublicUserFromRequest(req);
	if (userResult instanceof NextResponse) {
		return userResult;
	}
	const { userId, role } = userResult;

	try {
		// Verificăm permisiunile utilizatorului
		const token = await prisma.apiToken.findFirst({
			where: { userId: userId },
			select: { scopes: true },
		});

		if (!token || !token.scopes.includes("rows:write")) {
			return NextResponse.json(
				{ error: "Forbidden: Insufficient permissions" },
				{ status: 403 },
			);
		}
		const { tableId, rowId } = await params;
		const tableIdNum = parseInt(tableId);
		const rowIdNum = parseInt(rowId);
		const body = await req.json();

		if (isNaN(tableIdNum) || isNaN(rowIdNum)) {
			return NextResponse.json(
				{ error: "Invalid tableId or rowId" },
				{ status: 400 },
			);
		}

		// Fetch table and columns
		const table = await prisma.table.findUnique({
			where: {
				id: tableIdNum,
				isPublic: true, // Doar tabelele publice
			},
			include: { columns: true },
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table not found or not public" },
				{ status: 404 },
			);
		}

		// Check if row exists
		const existingRow = await prisma.row.findUnique({
			where: { id: rowIdNum },
			include: { cells: true },
		});

		if (!existingRow || existingRow.tableId !== tableIdNum) {
			return NextResponse.json(
				{ error: "Row not found in the specified table" },
				{ status: 404 },
			);
		}

		const { columns } = table;

		// Validate incoming data keys and values
		for (const [key, value] of Object.entries(body)) {
			const col = columns.find((c: { name: string; type: string }) => c.name === key);
			if (!col) {
				return NextResponse.json(
					{ error: `Unknown column: ${key}` },
					{ status: 400 },
				);
			}

			const baseType = col.type;
			try {
				if (baseType === "string" || baseType === "text") {
					z.string().min(1).parse(value);
				} else if (baseType === "number") {
					z.number().parse(value);
				} else if (baseType === "boolean") {
					z.boolean().parse(value);
				} else if (baseType === "date") {
					z.string()
						.refine((v) => !isNaN(Date.parse(v)), {
							message: "Invalid date format",
						})
						.parse(value);
				} else if (baseType === "reference") {
					z.number().int().parse(value);
				} else {
					throw new Error(`Unsupported type: ${baseType}`);
				}
			} catch (err: unknown) {
				const errorMessage = err instanceof Error ? err.message : 'Validation failed';
				return NextResponse.json(
					{ error: `Validation failed for "${key}": ${errorMessage}` },
					{ status: 400 },
				);
			}
		}

		// Actualizare celule pentru valorile primite
		const updatePromises = Object.entries(body).map(
			async ([columnName, value]) => {
				const column = columns.find((c: { name: string; id: number }) => c.name === columnName)!;

				// Verificăm dacă celula există deja în rând
				const existingCell = await prisma.cell.findFirst({
					where: { rowId: rowIdNum, columnId: column.id },
				});

				if (existingCell) {
					// Actualizare celulă existentă
					return prisma.cell.update({
						where: { id: existingCell.id },
						data: { value: value as unknown },
					});
				} else {
					// Creare celulă nouă (de regulă nu ar trebui să lipsească)
					return prisma.cell.create({
						data: {
							rowId: rowIdNum,
							columnId: column.id,
							value: value as unknown,
						},
					});
				}
			},
		);

		await Promise.all(updatePromises);

		// Returnăm rândul actualizat, inclusiv celulele și coloanele
		const updatedRow = await prisma.row.findUnique({
			where: { id: rowIdNum },
			include: {
				cells: {
					include: { column: true },
				},
			},
		});

		if (!updatedRow) {
			return NextResponse.json(
				{ error: "Failed to retrieve updated row" },
				{ status: 500 },
			);
		}

		// Format JSON frumos pentru răspuns
		const prettyRow: Record<string, unknown> = {};
		for (const cell of updatedRow.cells) {
			prettyRow[cell.column.name] = cell.value;
		}

		return NextResponse.json(prettyRow, { status: 200 });
	} catch (err) {
		console.error("Error updating row:", err);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ tableId: string; rowId: string }> },
) {
	const isValid = await verifyPublicToken(req);
	if (!isValid) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getPublicUserFromRequest(req);
	if (userResult instanceof NextResponse) {
		return userResult;
	}
	const { userId } = userResult;

	try {
		// Verificăm permisiunile utilizatorului
		const token = await prisma.apiToken.findFirst({
			where: { userId: userId },
			select: { scopes: true },
		});

		if (!token || !token.scopes.includes("rows:write")) {
			return NextResponse.json(
				{ error: "Forbidden: Insufficient permissions" },
				{ status: 403 },
			);
		}
		const { tableId, rowId } = await params;
		const tableIdNum = parseInt(tableId);
		const rowIdNum = parseInt(rowId);

		if (isNaN(tableIdNum) || isNaN(rowIdNum)) {
			return NextResponse.json(
				{ error: "Invalid tableId or rowId" },
				{ status: 400 },
			);
		}

		// Fetch table and columns
		const table = await prisma.table.findUnique({
			where: {
				id: tableIdNum,
				isPublic: true, // Doar tabelele publice
			},
			include: { columns: true },
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table not found or not public" },
				{ status: 404 },
			);
		}

		// Check if row exists
		const existingRow = await prisma.row.findUnique({
			where: { id: rowIdNum },
		});

		if (!existingRow || existingRow.tableId !== tableIdNum) {
			return NextResponse.json(
				{ error: "Row not found in the specified table" },
				{ status: 404 },
			);
		}

		// Delete the row and its associated cells
		await prisma.row.delete({
			where: { id: rowIdNum },
		});

		return NextResponse.json({ status: 200 });
	} catch (err) {
		console.error("Error updating row:", err);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
