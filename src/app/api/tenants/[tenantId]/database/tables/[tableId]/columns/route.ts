/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";
import { colExists } from "@/lib/utils";

const ColumnSchema = z.object({
	name: z.string().min(1, "Name is mandatory"),
	type: z.enum(["string", "boolean", "number", "date"]),
	required: z.boolean().optional(),
	primary: z.boolean().optional(),
	autoIncrement: z.boolean().optional(),
});

const ColumnsSchema = z.object({
	columns: z.array(ColumnSchema),
});

// Funcție helper pentru a determina valoarea default bazată pe tipul coloanei
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
			default:
				return "";
		}
	}
	return null; // Pentru coloanele non-required, folosim null
};

export async function POST(
	request: Request,
	{ params }: { params: { tenantId: string; tableId: string } },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { tenantId, tableId } = await params;
	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsedData = ColumnsSchema.parse(body);

		const database = await prisma.database.findFirst({
			where: { tenantId: Number(tenantId) },
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		// Găsim tabla cu toate coloanele și rândurile existente
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: database.id,
			},
			include: {
				columns: true,
				rows: { select: { id: true } }, // Selectăm doar ID-urile pentru performanță
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table doesn't exist" },
				{ status: 404 },
			);
		}

		// Folosim o transaction pentru a asigura consistența datelor
		const result = await prisma.$transaction(async (tx) => {
			// 1. Creăm coloanele noi
			const createdColumns: any = [];

			for (const col of parsedData.columns) {
				const parsedCol = ColumnSchema.parse(col);

				if (!colExists(table.columns, parsedCol)) {
					const newColumn = await tx.column.create({
						data: {
							name: parsedCol.name,
							type: parsedCol.type,
							required: parsedCol.required ?? false,
							primary: parsedCol.primary ?? false,
							autoIncrement: parsedCol.autoIncrement ?? false,
							tableId: table.id,
						},
					});
					createdColumns.push(newColumn);
				}
			}

			// 2. Creăm cells pentru fiecare coloană nouă și fiecare rând existent
			if (createdColumns.length > 0 && table.rows.length > 0) {
				const cellsToCreate: {
					rowId: number;
					columnId: number;
					value: any;
				}[] = [];

				for (const column of createdColumns) {
					for (const row of table.rows) {
						const defaultValue = getDefaultValue(column.type, column.required);

						cellsToCreate.push({
							rowId: row.id,
							columnId: column.id,
							value: defaultValue,
						});
					}
				}

				// Creăm toate cells-urile într-o singură operație batch
				if (cellsToCreate.length > 0) {
					await tx.cell.createMany({
						data: cellsToCreate,
					});
				}
			}

			return createdColumns;
		});

		// Returnăm rezultatul cu informații despre cells-urile create
		const totalCellsCreated = result.length * table.rows.length;

		return NextResponse.json(
			{
				columns: result,
				message: `${result.length} columns created successfully`,
				cellsCreated: totalCellsCreated,
				rowsAffected: table.rows.length,
			},
			{ status: 201 },
		);
	} catch (error: any) {
		console.error("❌ Failed to create columns:", error);

		// Oferim mesaje de eroare mai detaliate
		if (error.code === "P2002") {
			return NextResponse.json(
				{ error: "Column with this name already exists" },
				{ status: 409 },
			);
		}

		if (error.code === "P2025") {
			return NextResponse.json(
				{ error: "Referenced table or database not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(
			{ error: error?.message ?? "Failed to create columns" },
			{ status: 500 },
		);
	}
}
