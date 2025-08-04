/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";
import { colExists } from "@/lib/utils";
import { Column } from "@/types/database";

// === VALIDARE ===
const ColumnSchema = z.object({
	name: z.string().min(1, "Name is mandatory"),
	type: z.enum(["string", "boolean", "number", "date", "reference"]),
	required: z.boolean().optional(),
	primary: z.boolean().optional(),
	autoIncrement: z.boolean().optional(),
	referenceTableId: z.number().optional(), // doar pt type "reference"
});

const ColumnsSchema = z.object({
	columns: z.array(ColumnSchema),
});

// === VALOARE IMPLICITĂ ===
const getDefaultValue = (
	columnType: string,
	required: boolean = false,
): any => {
	if (required) {
		switch (columnType) {
			case "string":
				return "";
			case "number":
				return 0;
			case "boolean":
				return false;
			case "date":
				return new Date().toISOString();
			case "reference":
				return null; // referințele încep goale
			default:
				return "";
		}
	}
	return null;
};

// === ROUTA POST ===
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
		const parsedData = ColumnsSchema.parse(body);
		console.log("Parsed Data:", parsedData);

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
				rows: { select: { id: true } },
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table not found" },
				{ status: 404 },
			);
		}

		// Transform Prisma columns to match the expected Column interface
		const transformedColumns: Column[] = table.columns.map((col) => ({
			...col,
			referenceTableId: col.referenceTableId ?? undefined,
		}));

		// Verificăm dacă coloanele există deja
		for (const column of parsedData.columns) {
			if (colExists(transformedColumns, column)) {
				return NextResponse.json(
					{ error: `Column "${column.name}" already exists` },
					{ status: 409 },
				);
			}
		}

		// Creăm coloanele
		const createdColumns = [];
		for (const columnData of parsedData.columns) {
			const column = await prisma.column.create({
				data: {
					name: columnData.name,
					type: columnData.type,
					required: columnData.required || false,
					primary: columnData.primary || false,
					autoIncrement: columnData.autoIncrement || false,
					referenceTableId: columnData.referenceTableId || null,
					tableId: Number(tableId),
				},
			});

			createdColumns.push(column);

			// Adăugăm valori implicite pentru coloanele existente
			if (table.rows.length > 0) {
				const defaultValue = getDefaultValue(
					columnData.type,
					columnData.required,
				);

				const cells = table.rows.map((row) => ({
					rowId: row.id,
					columnId: column.id,
					value: defaultValue,
				}));

				await prisma.cell.createMany({
					data: cells,
				});
			}
		}

		return NextResponse.json(createdColumns, { status: 201 });
	} catch (error) {
		console.error("Error creating columns:", error);
		return NextResponse.json(
			{ error: "Failed to create columns" },
			{ status: 500 },
		);
	}
}

// === ROUTA GET ===
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

		return NextResponse.json(table.columns);
	} catch (error) {
		console.error("Error fetching columns:", error);
		return NextResponse.json(
			{ error: "Failed to fetch columns" },
			{ status: 500 },
		);
	}
} 