/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateApiToken } from "@/lib/api-security";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tableId: string; rowId: string }> },
) {
	try {
		const authHeader = request.headers.get("authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return NextResponse.json(
				{ error: "Missing or invalid authorization header" },
				{ status: 401 },
			);
		}

		const token = authHeader.substring(7);
		const tokenData = await validateApiToken(token);

		if (!tokenData.isValid) {
			return NextResponse.json(
				{ error: "Invalid or expired API token" },
				{ status: 401 },
			);
		}

		const tableId = parseInt((await params).tableId);
		const rowId = parseInt((await params).rowId);

		if (isNaN(tableId) || isNaN(rowId)) {
			return NextResponse.json(
				{ error: "Invalid table ID or row ID" },
				{ status: 400 },
			);
		}

		// Get the specific row (all tables are public by default)
		const row = await prisma.row.findFirst({
			where: {
				id: rowId,
				tableId: tableId,
			},
			select: {
				id: true,
				cells: {
					select: {
						id: true,
						value: true,
						column: {
							select: {
								id: true,
								name: true,
								type: true,
							},
						},
					},
				},
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!row) {
			return NextResponse.json({ error: "Row not found" }, { status: 404 });
		}

		// Transform the response
		const rowData: any = {
			id: row.id,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};

		row.cells.forEach((cell: any) => {
			rowData[cell.column.name] = cell.value;
		});

		return NextResponse.json({
			success: true,
			data: rowData,
		});
	} catch (error) {
		console.error("Error fetching row:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ tableId: string; rowId: string }> },
) {
	try {
		const authHeader = request.headers.get("authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return NextResponse.json(
				{ error: "Missing or invalid authorization header" },
				{ status: 401 },
			);
		}

		const token = authHeader.substring(7);
		const tokenData = await validateApiToken(token);

		if (!tokenData.isValid) {
			return NextResponse.json(
				{ error: "Invalid or expired API token" },
				{ status: 401 },
			);
		}

		const tableId = parseInt((await params).tableId);
		const rowId = parseInt((await params).rowId);

		if (isNaN(tableId) || isNaN(rowId)) {
			return NextResponse.json(
				{ error: "Invalid table ID or row ID" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { data } = body;

		if (!data || typeof data !== "object") {
			return NextResponse.json(
				{ error: "Invalid data format" },
				{ status: 400 },
			);
		}

		// Get table columns to validate data
		const table = await prisma.table.findUnique({
			where: { id: tableId },
			select: {
				columns: {
					select: {
						id: true,
						name: true,
						type: true,
						isRequired: true,
					},
				},
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Check if row exists
		const existingRow = await prisma.row.findFirst({
			where: {
				id: rowId,
				tableId: tableId,
			},
		});

		if (!existingRow) {
			return NextResponse.json({ error: "Row not found" }, { status: 404 });
		}

		// Validate required fields
		const requiredColumns = table.columns.filter((col: any) => col.isRequired);
		for (const col of requiredColumns) {
			if (!(col.name in data)) {
				return NextResponse.json(
					{ error: `Missing required field: ${col.name}` },
					{ status: 400 },
				);
			}
		}

		// Update the row by updating its cells
		await prisma.$transaction(async (tx: any) => {
			// Delete existing cells
			await tx.cell.deleteMany({
				where: { rowId },
			});

			// Create new cells
			await tx.cell.createMany({
				data: Object.entries(data).map(([columnName, value]) => {
					const column = table.columns.find(
						(col: any) => col.name === columnName,
					);
					if (!column) {
						throw new Error(`Unknown column: ${columnName}`);
					}
					return {
						rowId,
						columnId: column.id,
						value: value?.toString() || "",
					};
				}),
			});
		});

		// Get the updated row
		const updatedRow = await prisma.row.findFirst({
			where: { id: rowId },
			select: {
				id: true,
				cells: {
					select: {
						id: true,
						value: true,
						column: {
							select: {
								id: true,
								name: true,
								type: true,
							},
						},
					},
				},
				createdAt: true,
				updatedAt: true,
			},
		});

		// Transform the response
		const rowData: any = {
			id: updatedRow!.id,
			createdAt: updatedRow!.createdAt,
			updatedAt: updatedRow!.updatedAt,
		};

		updatedRow!.cells.forEach((cell: any) => {
			rowData[cell.column.name] = cell.value;
		});

		return NextResponse.json({
			success: true,
			data: rowData,
		});
	} catch (error) {
		console.error("Error updating row:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ tableId: string; rowId: string }> },
) {
	try {
		const authHeader = request.headers.get("authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return NextResponse.json(
				{ error: "Missing or invalid authorization header" },
				{ status: 401 },
			);
		}

		const token = authHeader.substring(7);
		const tokenData = await validateApiToken(token);

		if (!tokenData.isValid) {
			return NextResponse.json(
				{ error: "Invalid or expired API token" },
				{ status: 401 },
			);
		}

		const tableId = parseInt((await params).tableId);
		const rowId = parseInt((await params).rowId);

		if (isNaN(tableId) || isNaN(rowId)) {
			return NextResponse.json(
				{ error: "Invalid table ID or row ID" },
				{ status: 400 },
			);
		}

		// Check if row exists
		const existingRow = await prisma.row.findFirst({
			where: {
				id: rowId,
				tableId: tableId,
			},
		});

		if (!existingRow) {
			return NextResponse.json({ error: "Row not found" }, { status: 404 });
		}

		// Delete the row (cells will be deleted automatically due to cascade)
		await prisma.row.delete({
			where: { id: rowId },
		});

		return NextResponse.json({
			success: true,
			message: "Row deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting row:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
