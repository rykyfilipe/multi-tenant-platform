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
	{ params }: { params: Promise<{ tenantId: string; tableId: string }> },
) {
	const { tenantId, tableId } = await params;
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
		const database = await prisma.database.findFirst({
			where: { tenantId: Number(tenantId) },
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
				databaseId: database.id,
			},
			include: {
				columns: true,
				rows: { select: { id: true } },
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table doesn't exist" },
				{ status: 404 },
			);
		}

		// === TRX ===
		const result = await prisma.$transaction(async (tx) => {
			const createdColumns: any[] = [];

			for (const col of parsedData.columns) {
				const parsedCol = ColumnSchema.parse(col);

				// dacă e referință, validăm că tabela referită există
				if (parsedCol.type === "reference" && !parsedCol.referenceTableId) {
					throw new Error("Reference column must include referenceTableId");
				}

				if (!colExists(table.columns, parsedCol)) {
					const newColumn = await tx.column.create({
						data: {
							name: parsedCol.name,
							type: parsedCol.type,
							required: parsedCol.required ?? false,
							primary: parsedCol.primary ?? false,
							autoIncrement: parsedCol.autoIncrement ?? false,
							tableId: table.id,
							referenceTableId: parsedCol.referenceTableId,
						},
					});

					createdColumns.push(newColumn);
				}
			}

			// Adăugăm cells default la fiecare rând
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

				if (cellsToCreate.length > 0) {
					await tx.cell.createMany({ data: cellsToCreate });
				}
			}

			return createdColumns;
		});

		const users = await prisma.user.findMany({
			where: {
				tenantId: Number(tenantId),
			},
		});

		Promise.all(
			users.map((user) =>
				prisma.columnPermission.create({
					data: {
						columnId: result[0].id,
						userId: user.id,
						tableId: table.id,
						tenantId: Number(tenantId),
						canRead: true,
						canEdit: role === "ADMIN",
					},
				}),
			),
		);

		return NextResponse.json({ newColumn: result[0] }, { status: 201 });
	} catch (error: any) {
		console.error("❌ Failed to create columns:", error);

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
