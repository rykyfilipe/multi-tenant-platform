/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";

const RowSchema = z.object({
	cells: z.array(z.object({
		columnId: z.number(),
		value: z.any(),
	})),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string; tableId: string }> },
) {
	const { tenantId, databaseId, tableId } = await params;
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
		const parsedData = RowSchema.parse(body);

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

		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
			},
			include: {
				columns: true,
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table not found" },
				{ status: 404 },
			);
		}

		// Creăm rândul
		const row = await prisma.row.create({
			data: {
				tableId: Number(tableId),
			},
		});

		// Creăm celulele pentru rând
		const cells = parsedData.cells.map((cell) => ({
			rowId: row.id,
			columnId: cell.columnId,
			value: cell.value,
		}));

		await prisma.cell.createMany({
			data: cells,
		});

		// Returnăm rândul cu celulele
		const createdRow = await prisma.row.findUnique({
			where: { id: row.id },
			include: {
				cells: {
					include: {
						column: true,
					},
				},
			},
		});

		return NextResponse.json(createdRow, { status: 201 });
	} catch (error) {
		console.error("Error creating row:", error);
		return NextResponse.json(
			{ error: "Failed to create row" },
			{ status: 500 },
		);
	}
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string; tableId: string }> },
) {
	const { tenantId, databaseId, tableId } = await params;
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
	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
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

		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table not found" },
				{ status: 404 },
			);
		}

		// Verificăm permisiunile pentru utilizatorii non-admin
		if (role !== "ADMIN") {
			const permission = await prisma.tablePermission.findFirst({
				where: {
					userId: userId,
					tableId: Number(tableId),
					canRead: true,
				},
			});

			if (!permission) {
				return NextResponse.json(
					{ error: "Access denied" },
					{ status: 403 },
				);
			}
		}

		const rows = await prisma.row.findMany({
			where: {
				tableId: Number(tableId),
			},
			include: {
				cells: {
					include: {
						column: true,
					},
				},
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		return NextResponse.json(rows);
	} catch (error) {
		console.error("Error fetching rows:", error);
		return NextResponse.json(
			{ error: "Failed to fetch rows" },
			{ status: 500 },
		);
	}
} 