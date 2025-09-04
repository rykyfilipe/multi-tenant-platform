/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateTenantMemoryUsage } from "@/lib/memory-tracking";

interface BatchRowData {
	cells: Array<{
		columnId: number;
		value: any;
	}>;
}

interface BatchRequest {
	rows: BatchRowData[];
}

export async function POST(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	try {
		const session = await getServerSession();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { tenantId, databaseId, tableId } = await params;
		const userId = session.user.id;

		// Parse request body
		const body: BatchRequest = await request.json();
		const { rows } = body;

		if (!rows || !Array.isArray(rows) || rows.length === 0) {
			return NextResponse.json(
				{ error: "Invalid request: rows array is required" },
				{ status: 400 },
			);
		}

		// Verify user has access to the tenant
		const user = await prisma.user.findFirst({
			where: {
				id: Number(userId),
				tenants: {
					some: {
						tenantId: Number(tenantId),
					},
				},
			},
			select: {
				id: true,
				role: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const role = user.role;

		// Verify database exists and user has access
		const database = await prisma.database.findFirst({
			where: {
				id: Number(databaseId),
				tenantId: Number(tenantId),
			},
			select: {
				id: true,
				tenantId: true,
			},
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		// Verify table exists
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
			},
			select: {
				id: true,
				databaseId: true,
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Check permissions for non-admin users
		if (role !== "ADMIN") {
			const hasPermission = await prisma.tablePermission.findFirst({
				where: {
					userId: Number(userId),
					tableId: Number(tableId),
					canEdit: true,
				},
				select: { id: true },
			});

			if (!hasPermission) {
				return NextResponse.json({ error: "Access denied" }, { status: 403 });
			}
		}

		// Get table columns for validation
		const columns = await prisma.column.findMany({
			where: {
				tableId: Number(tableId),
			},
			select: {
				id: true,
				name: true,
				type: true,
				required: true,
			},
		});

		if (columns.length === 0) {
			return NextResponse.json(
				{ error: "Table has no columns" },
				{ status: 400 },
			);
		}

		// Validate each row
		for (const row of rows) {
			if (!row.cells || !Array.isArray(row.cells)) {
				return NextResponse.json(
					{ error: "Invalid row data: cells array is required" },
					{ status: 400 },
				);
			}

			// Check required columns
			const requiredColumns = columns.filter((col:any) => col.required);
			for (const requiredCol of requiredColumns) {
				const hasCell = row.cells.some(
					(cell) =>
						cell.columnId === requiredCol.id &&
						cell.value !== null &&
						cell.value !== "",
				);
				if (!hasCell) {
					return NextResponse.json(
						{ error: `Required column '${requiredCol.name}' is missing` },
						{ status: 400 },
					);
				}
			}

			// Validate column IDs
			for (const cell of row.cells) {
				const columnExists = columns.some((col:any) => col.id === cell.columnId);
				if (!columnExists) {
					return NextResponse.json(
						{ error: `Column with ID ${cell.columnId} not found` },
						{ status: 400 },
					);
				}
			}
		}

		// Create rows and cells in batch
		const createdRows = [];

		for (const rowData of rows) {
			// Create the row
			const newRow = await prisma.row.create({
				data: {
					tableId: Number(tableId),
				},
				select: {
					id: true,
					tableId: true,
					createdAt: true,
				},
			});

			// Create cells for this row
			const cellsData = rowData.cells.map((cell) => ({
				rowId: newRow.id,
				columnId: cell.columnId,
				value: cell.value,
			}));

			await prisma.cell.createMany({
				data: cellsData,
			});

			// Fetch the complete row with cells
			const completeRow = await prisma.row.findUnique({
				where: { id: newRow.id },
				include: {
					cells: {
						include: {
							column: {
								select: {
									id: true,
									name: true,
									type: true,
								},
							},
						},
					},
				},
			});

			createdRows.push(completeRow);
		}

		// Update memory tracking (async, don't wait)
		updateTenantMemoryUsage(Number(tenantId)).catch((error) => {
			console.error("Error updating memory cache:", error);
		});

		return NextResponse.json({
			message: `Successfully created ${createdRows.length} row(s)`,
			rows: createdRows,
		});
	} catch (error) {
		console.error("Error creating batch rows:", error);
		return NextResponse.json(
			{ error: "Failed to create rows" },
			{ status: 500 },
		);
	}
}
