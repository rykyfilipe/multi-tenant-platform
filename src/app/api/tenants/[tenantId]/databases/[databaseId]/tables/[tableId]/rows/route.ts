/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { checkPlanLimit } from "@/lib/planLimits";
import { updateMemoryAfterRowChange } from "@/lib/memory-middleware";
import { z } from "zod";

const RowSchema = z.object({
	cells: z.array(
		z.object({
			columnId: z.number(),
			value: z.any(),
		}),
	),
});

const BulkRowsSchema = z.object({
	rows: z.array(RowSchema),
});

export async function POST(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
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

		// Verificăm dacă este bulk import sau single row
		let isBulkImport = false;
		let parsedData: any;

		try {
			parsedData = BulkRowsSchema.parse(body);
			isBulkImport = true;
		} catch {
			parsedData = RowSchema.parse(body);
			isBulkImport = false;
		}

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

		// Verificăm limita de rânduri pentru planul utilizatorului
		const currentRowCount = await prisma.row.count({
			where: { table: { database: { tenantId: Number(tenantId) } } },
		});

		const rowsToAdd = isBulkImport ? parsedData.rows.length : 1;
		const rowLimitCheck = await checkPlanLimit(
			userId,
			"rows",
			currentRowCount + rowsToAdd,
		);

		if (!rowLimitCheck.allowed) {
			return NextResponse.json(
				{
					error: "Row limit exceeded",
					details: `You have ${currentRowCount} rows and are trying to add ${rowsToAdd} more. Your plan allows ${rowLimitCheck.limit} rows total.`,
					limit: rowLimitCheck.limit,
					current: currentRowCount,
				},
				{ status: 403 },
			);
		}

		// Funcție helper pentru procesarea celulelor
		const processCells = async (cells: any[], rowId: number) => {
			const processedCells = [];
			const validationErrors = [];

			for (const cell of cells) {
				const column = table.columns.find((col) => col.id === cell.columnId);

				if (!column) {
					validationErrors.push(`Unknown column ID: ${cell.columnId}`);
					continue;
				}

				// Validare pentru customArray
				if (column.type === "customArray" && cell.value) {
					if (column.customOptions && column.customOptions.length > 0) {
						if (!column.customOptions.includes(String(cell.value))) {
							validationErrors.push(
								`Column "${column.name}" must be one of: ${column.customOptions.join(", ")}. Got: "${cell.value}"`
							);
							continue;
						}
					}
				}

				if (
					column &&
					column.type === "reference" &&
					column.referenceTableId &&
					cell.value
				) {
					// Pentru coloanele de referință, validăm că cheia primară există
					const referenceTable = await prisma.table.findUnique({
						where: { id: column.referenceTableId },
						include: { columns: true, rows: { include: { cells: true } } },
					});

					if (referenceTable) {
						const refPrimaryKeyColumn = referenceTable.columns.find(
							(col) => col.primary,
						);

						if (refPrimaryKeyColumn) {
							// Căutăm rândul cu cheia primară specificată
							const referenceRow = referenceTable.rows.find((refRow) => {
								const refPrimaryKeyCell = refRow.cells.find(
									(refCell) => refCell.columnId === refPrimaryKeyColumn.id,
								);
								return (
									refPrimaryKeyCell && refPrimaryKeyCell.value === cell.value
								);
							});

							if (!referenceRow) {
								validationErrors.push(
									`Reference value "${cell.value}" not found in table "${referenceTable.name}" for column "${column.name}"`,
								);
								continue; // Omitem această celulă din procesare
							}
						}
					}
				}

				// Pentru toate coloanele, păstrăm valoarea originală
				processedCells.push({
					rowId: rowId,
					columnId: cell.columnId,
					value: cell.value,
				});
			}

			return { processedCells, validationErrors };
		};

		if (isBulkImport) {
			// Bulk import
			const createdRows = [];
			const allValidationErrors = [];

			for (const rowData of parsedData.rows) {
				// Creăm rândul
				const row = await prisma.row.create({
					data: {
						tableId: Number(tableId),
					},
				});

				// Procesăm celulele
				const { processedCells, validationErrors } = await processCells(
					rowData.cells,
					row.id,
				);

				// Adăugăm erorile de validare la lista totală
				if (validationErrors.length > 0) {
					allValidationErrors.push(
						`Row ${row.id}: ${validationErrors.join(", ")}`,
					);
				}

				// Salvăm celulele valide
				if (processedCells.length > 0) {
					await prisma.cell.createMany({
						data: processedCells,
					});
				}

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

				createdRows.push(createdRow);
			}

			// Actualizăm memoria după crearea rândurilor
			await updateMemoryAfterRowChange(Number(tenantId));

			// Dacă există erori de validare, le returnăm împreună cu rândurile create
			if (allValidationErrors.length > 0) {
				return NextResponse.json(
					{
						rows: createdRows,
						warnings: allValidationErrors,
						message: "Import completed with validation warnings",
					},
					{ status: 207 }, // 207 Multi-Status
				);
			}

			return NextResponse.json({ rows: createdRows }, { status: 201 });
		} else {
			// Single row creation
			const row = await prisma.row.create({
				data: {
					tableId: Number(tableId),
				},
			});

			// Procesăm celulele
			const { processedCells, validationErrors } = await processCells(
				parsedData.cells,
				row.id,
			);

			// Dacă există erori de validare, returnăm eroarea
			if (validationErrors.length > 0) {
				// Ștergem rândul creat dacă există erori
				await prisma.row.delete({ where: { id: row.id } });

				return NextResponse.json(
					{
						error: "Validation failed",
						details: validationErrors,
					},
					{ status: 400 },
				);
			}

			// Salvăm celulele
			await prisma.cell.createMany({
				data: processedCells,
			});

			// Actualizăm memoria după crearea rândului
			await updateMemoryAfterRowChange(Number(tenantId));

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
		}
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
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
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

		// Sortăm coloanele după ordine în aplicație
		const sortedRows = rows.map((row) => ({
			...row,
			cells: row.cells.sort((a, b) => a.column.order - b.column.order),
		}));

		return NextResponse.json(sortedRows);
	} catch (error) {
		console.error("Error fetching rows:", error);
		return NextResponse.json(
			{ error: "Failed to fetch rows" },
			{ status: 500 },
		);
	}
}
