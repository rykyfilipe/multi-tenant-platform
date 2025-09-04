/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkTableEditPermission } from "@/lib/auth";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { z } from "zod";
import { colExists } from "@/lib/utils";
import { Column } from "@/types/database";

// === VALIDARE ===
const ColumnSchema = z.object({
	name: z.string().min(1, "Name is mandatory"),
	type: z.enum([
		"string",
		"text", // Accept both "string" and "text" for compatibility
		"boolean",
		"number",
		"date",
		"reference",
		"customArray",
	]), // Remove the transform - keep "text" as "text"
	semanticType: z.string().optional(), // What this column represents (product_name, product_price, etc.)
	required: z.boolean().optional(),
	primary: z.boolean().optional(),
	autoIncrement: z.boolean().optional(),
	referenceTableId: z.number().optional(), // doar pt type "reference"
	customOptions: z.array(z.string()).optional(), // doar pt type "customArray"
	order: z.number().optional(), // Ordinea coloanei
});

const ColumnsSchema = z.object({
	columns: z.array(ColumnSchema),
});

// === VALOARE IMPLICITĂ ===
const getDefaultValue = (
	columnType: string,
	required: boolean = false,
): unknown => {
	if (required) {
		switch (columnType) {
			case "string":
			case "text": // Handle both "string" and "text"
				return "";
			case "number":
				return 0;
			case "boolean":
				return false;
			case "date":
				return new Date().toISOString();
			case "reference":
				return null; // referințele încep goale
			case "customArray":
				return null; // customArray începe gol
			default:
				return "";
		}
	}
	return null;
};

// === ROUTA POST ===
export async function POST(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const { tenantId, databaseId, tableId } = await params;
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	// Check table edit permissions for column operations instead of hard-coded role check
	const canEdit = await checkTableEditPermission(
		userId,
		Number(tableId),
		Number(tenantId),
	);
	if (!canEdit)
		return NextResponse.json(
			{ error: "Insufficient permissions to edit columns in this table" },
			{ status: 403 },
		);

	try {
		const body = await request.json();
		const parsedData = ColumnsSchema.parse(body);

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
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Transform Prisma columns to match the expected Column interface
		const transformedColumns: Column[] = table.columns.map(
			(col: { referenceTableId: number | null }) => ({
				...col,
				referenceTableId: col.referenceTableId ?? undefined,
			}),
		);

		// Verificăm dacă coloanele există deja
		for (const column of parsedData.columns) {
			if (colExists(transformedColumns, column)) {
				return NextResponse.json(
					{ error: `Column "${column.name}" already exists` },
					{ status: 409 },
				);
			}
		}

		// Verificăm dacă există deja o cheie primară în tabelă
		const existingPrimaryKey = table.columns.find(
			(col: { primary?: boolean }) => col.primary,
		);
		const newPrimaryKey = parsedData.columns.find((col) => col.primary);

		if (existingPrimaryKey && newPrimaryKey) {
			return NextResponse.json(
				{
					error:
						"Table already has a primary key. Only one primary key is allowed per table.",
				},
				{ status: 409 },
			);
		}

		// Verificăm că tabelele de referință au cheie primară definită
		for (const column of parsedData.columns) {
			if (column.type === "reference" && column.referenceTableId) {
				const referenceTable = await prisma.table.findUnique({
					where: { id: column.referenceTableId },
					include: { columns: true },
				});

				if (!referenceTable) {
					return NextResponse.json(
						{
							error: `Reference table with ID ${column.referenceTableId} not found.`,
						},
						{ status: 404 },
					);
				}

				const hasPrimaryKey = referenceTable.columns.some(
					(col: { primary?: boolean }) => col.primary,
				);
				if (!hasPrimaryKey) {
					return NextResponse.json(
						{
							error: `Table "${referenceTable.name}" must have a primary key defined before it can be referenced.`,
						},
						{ status: 400 },
					);
				}
			}

			// Verificăm că coloanele customArray au opțiuni definite
			if (column.type === "customArray") {
				if (!column.customOptions || column.customOptions.length === 0) {
					return NextResponse.json(
						{
							error: `Column "${column.name}" of type customArray must have at least one custom option defined.`,
						},
						{ status: 400 },
					);
				}
			}
		}

		// Creăm coloanele
		const createdColumns = [];
		for (let i = 0; i < parsedData.columns.length; i++) {
			const columnData = parsedData.columns[i];

			// Calculăm ordinea - fie folosim ordinea specificată, fie o calculăm automat
			const order =
				columnData.order !== undefined
					? columnData.order
					: table.columns.length + i;

			const column = await prisma.column.create({
				data: {
					name: columnData.name,
					type: columnData.type,
					semanticType: columnData.semanticType || null,
					required: columnData.required || false,
					primary: columnData.primary || false,
					referenceTableId: columnData.referenceTableId || null,
					customOptions: columnData.customOptions || undefined,
					order: order,
					tableId: Number(tableId),
				},
			});

			createdColumns.push(column);

			// Adăugăm valori implicite pentru coloanele existente
			if (table.rows.length > 0) {
				const cells = table.rows.map((row: { id: number }) => ({
					rowId: row.id,
					columnId: column.id,
					value: getDefaultValue(columnData.type, columnData.required),
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
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const { tenantId, databaseId, tableId } = await params;
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
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
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
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
				return NextResponse.json({ error: "Access denied" }, { status: 403 });
			}
		}

		// Sortăm coloanele după ordine
		const sortedColumns = table.columns.sort(
			(a: { order: number }, b: { order: number }) => a.order - b.order,
		);
		return NextResponse.json(sortedColumns);
	} catch (error) {
		console.error("Error fetching columns:", error);
		return NextResponse.json(
			{ error: "Failed to fetch columns" },
			{ status: 500 },
		);
	}
}
