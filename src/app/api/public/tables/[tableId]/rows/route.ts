/** @format */

import { getPublicUserFromRequest, verifyPublicToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ tableId: string }> },
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

		const { tableId: id } = await params;
		const tableId = parseInt(id);
		const body = await req.json();

		if (isNaN(tableId)) {
			return NextResponse.json({ error: "Invalid tableId" }, { status: 400 });
		}

		// Fetch table and columns
		const table = await prisma.table.findUnique({
			where: {
				id: tableId,
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

		const { columns } = table;

		// Validare coloane lipsă (dacă sunt required)
		for (const col of columns) {
			if (col.required && !(col.name in body)) {
				return NextResponse.json(
					{ error: `Missing required field: ${col.name}` },
					{ status: 400 },
				);
			}
		}

		// Validare tipuri și valori
		for (const [key, value] of Object.entries(body)) {
			const col = columns.find((c) => c.name === key);
			if (!col) {
				return NextResponse.json(
					{ error: `Unknown column: ${key}` },
					{ status: 400 },
				);
			}

			const baseType = col.type;
			try {
				// Validare avansată în funcție de tip
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
				} else if (baseType === "customArray") {
					// Validare pentru customArray - valoarea trebuie să fie una din opțiunile definite
					if (col.customOptions && col.customOptions.length > 0) {
						// Ensure value is a string before checking
						if (typeof value !== "string") {
							throw new Error("Value must be a string for customArray type");
						}
						if (!col.customOptions.includes(value)) {
							throw new Error(
								`Value must be one of: ${col.customOptions.join(", ")}`,
							);
						}
					} else {
						throw new Error("No custom options defined for this column");
					}
				} else {
					throw new Error(`Unsupported type: ${baseType}`);
				}
			} catch (err: any) {
				return NextResponse.json(
					{ error: `Validation failed for "${key}": ${err.message}` },
					{ status: 400 },
				);
			}
		}

		// Creăm row și cells
		const newRow = await prisma.row.create({
			data: {
				tableId: table.id,
				cells: {
					create: columns.map((col) => ({
						columnId: col.id,
						value: body[col.name] ?? null,
					})),
				},
			},
			include: {
				cells: {
					include: { column: true },
				},
			},
		});

		// Răspuns formatat frumos
		const prettyRow: Record<string, any> = {};
		for (const cell of newRow.cells) {
			prettyRow[cell.column.name] = cell.value;
		}

		return NextResponse.json(prettyRow, { status: 201 });
	} catch (err) {
		console.error("Error creating row:", err);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
