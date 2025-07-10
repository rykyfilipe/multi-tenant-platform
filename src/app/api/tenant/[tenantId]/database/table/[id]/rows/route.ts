/** @format */

import prisma from "@/lib/prisma";
import z from "zod";
import { NextResponse } from "next/server";
import { getUserFromRequest, verifyLogin } from "@/lib/auth";

const rowSchema = z.object({
	id: z.number().min(0),
	data: z.record(z.any()),
});

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const { id } = await params;

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) return userResult;

	const { userId, role } = userResult;
	if (role !== "ADMIN")
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsed = rowSchema.parse(body.row);

		// Caută tabelul
		const table = await prisma.table.findUnique({
			where: { id: Number(id) },
		});

		if (!table) {
			return NextResponse.json({ error: "Tabelul nu există" }, { status: 404 });
		}

		// Preia rows existente
		const existingRows = (table.rows as any[]) ?? [];

		// Adaugă rândul nou
		const updatedRows = [...existingRows, parsed];

		// Update în baza de date
		const updatedTable = await prisma.table.update({
			where: { id: Number(id) },
			data: { rows: updatedRows },
		});

		return NextResponse.json(updatedTable, { status: 200 });
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "Eroare la adăugare row" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const { id } = await params;

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) return userResult;

	const { userId, role } = userResult;
	if (role !== "ADMIN")
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsed = rowSchema.parse(body.updatedRow);

		// Caută tabelul
		const table = await prisma.table.findUnique({
			where: { id: Number(id) },
		});

		if (!table) {
			return NextResponse.json({ error: "Tabelul nu există" }, { status: 404 });
		}

		const existingRows = (table.rows as { id: number }[]) || [];

		const filtredRows = existingRows.filter(
			(row) => row.id !== Number(parsed.id),
		);
		const updatedRows = [...filtredRows, parsed];
		const sortedRows = updatedRows.sort((row1, row2) => row1.id - row2.id);

		// Update în baza de date
		const updatedTable = await prisma.table.update({
			where: { id: Number(id) },
			data: { rows: sortedRows },
		});

		return NextResponse.json(updatedTable, { status: 200 });
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "Eroare la adăugare row" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const rowId = searchParams.get("rowId");

	if (!rowId) {
		return NextResponse.json(
			{ error: "Parametrul `rowId` este obligatoriu" },
			{ status: 400 },
		);
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) return userResult;

	const { role } = userResult;
	if (role !== "ADMIN") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const tableId = Number(id);

		const table = await prisma.table.findUnique({
			where: { id: tableId },
		});

		if (!table) {
			return NextResponse.json({ error: "Tabelul nu există" }, { status: 404 });
		}

		const existingRows = (table.rows as { id: number }[]) || [];
		const filteredRows = existingRows.filter((row) => row.id !== Number(rowId));

		const updatedTable = await prisma.table.update({
			where: { id: tableId },
			data: { rows: filteredRows },
		});

		return NextResponse.json(updatedTable, { status: 200 });
	} catch (err) {
		return NextResponse.json(
			{ error: "Eroare la ștergerea rândului" },
			{ status: 500 },
		);
	}
}
