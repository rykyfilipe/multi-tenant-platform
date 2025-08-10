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
				const column = table.columns.find(
					(col: any) => col.id === cell.columnId,
				);

				if (!column) {
					validationErrors.push(`Unknown column ID: ${cell.columnId}`);
					continue;
				}

				// Validare pentru customArray
				if (column.type === "customArray" && cell.value) {
					if (column.customOptions && column.customOptions.length > 0) {
						if (!column.customOptions.includes(String(cell.value))) {
							validationErrors.push(
								`Column "${
									column.name
								}" must be one of: ${column.customOptions.join(", ")}. Got: "${
									cell.value
								}"`,
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
							(col: any) => col.primary,
						);

						if (refPrimaryKeyColumn) {
							// Căutăm rândul cu cheia primară specificată
							const referenceRow = referenceTable.rows.find((refRow: any) => {
								const refPrimaryKeyCell = refRow.cells.find(
									(refCell: any) => refCell.columnId === refPrimaryKeyColumn.id,
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

		// Get pagination parameters from URL
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const pageSize = parseInt(url.searchParams.get("pageSize") || "25");
		const includeCells = url.searchParams.get("includeCells") !== "false"; // Default to true for backwards compatibility

		// Get filter parameters from URL
		const globalSearch = url.searchParams.get("globalSearch") || "";
		const filtersParam = url.searchParams.get("filters") || "[]";

		let filters: any[] = [];
		try {
			filters = JSON.parse(filtersParam);
		} catch (error) {
			console.warn("Invalid filters parameter, using empty array");
			filters = [];
		}

		console.log(
			`DEBUG PARAMS: Received page=${url.searchParams.get(
				"page",
			)}, pageSize=${url.searchParams.get(
				"pageSize",
			)}, globalSearch="${globalSearch}", filters=${filters.length}`,
		);

		// Validate pagination parameters
		const validPage = Math.max(1, page);
		const validPageSize = Math.min(Math.max(1, pageSize), 100); // Limit page size to 100
		const skip = (validPage - 1) * validPageSize;

		// Build where clause for filtering
		let whereClause: any = {
			tableId: Number(tableId),
		};

		// Apply global search if provided
		if (globalSearch.trim()) {
			whereClause.cells = {
				some: {
					value: {
						path: ["$"],
						string_contains: globalSearch.trim(),
					},
				},
			};
		}

		// Apply column-specific filters
		if (filters.length > 0) {
			const filterConditions = filters.map((filter: any) => {
				const { columnId, operator, value, secondValue } = filter;

				switch (operator) {
					case "contains":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												string_contains: value,
											},
										},
									],
								},
							},
						};
					case "not_contains":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											NOT: {
												value: {
													path: ["$"],
													string_contains: value,
												},
											},
										},
									],
								},
							},
						};
					case "equals":
						return {
							cells: {
								some: {
									AND: [{ columnId: Number(columnId) }, { value: value }],
								},
							},
						};
					case "not_equals":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{ NOT: { value: value } },
									],
								},
							},
						};
					case "starts_with":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												string_starts_with: value,
											},
										},
									],
								},
							},
						};
					case "ends_with":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												string_ends_with: value,
											},
										},
									],
								},
							},
						};
					case "greater_than":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												gt: Number(value),
											},
										},
									],
								},
							},
						};
					case "greater_than_or_equal":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												gte: Number(value),
											},
										},
									],
								},
							},
						};
					case "less_than":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												lt: Number(value),
											},
										},
									],
								},
							},
						};
					case "less_than_or_equal":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												lte: Number(value),
											},
										},
									],
								},
							},
						};
					case "between":
						if (secondValue !== undefined && secondValue !== null) {
							return {
								cells: {
									some: {
										AND: [
											{ columnId: Number(columnId) },
											{
												value: {
													path: ["$"],
													gte: Number(value),
													lte: Number(secondValue),
												},
											},
										],
									},
								},
							};
						}
						return {};
					case "not_between":
						if (secondValue !== undefined && secondValue !== null) {
							return {
								cells: {
									some: {
										AND: [
											{ columnId: Number(columnId) },
											{
												OR: [
													{
														value: {
															path: ["$"],
															lt: Number(value),
														},
													},
													{
														value: {
															path: ["$"],
															gt: Number(secondValue),
														},
													},
												],
											},
										],
									},
								},
							};
						}
						return {};
					case "before":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												lt: new Date(value),
											},
										},
									],
								},
							},
						};
					case "after":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												gt: new Date(value),
											},
										},
									],
								},
							},
						};
					case "today":
						const today = new Date();
						const startOfDay = new Date(
							today.getFullYear(),
							today.getMonth(),
							today.getDate(),
						);
						const endOfDay = new Date(
							today.getFullYear(),
							today.getMonth(),
							today.getDate(),
							23,
							59,
							59,
							999,
						);
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												gte: startOfDay,
												lte: endOfDay,
											},
										},
									],
								},
							},
						};
					case "yesterday":
						const yesterday = new Date();
						yesterday.setDate(yesterday.getDate() - 1);
						const startOfYesterday = new Date(
							yesterday.getFullYear(),
							yesterday.getMonth(),
							yesterday.getDate(),
						);
						const endOfYesterday = new Date(
							yesterday.getFullYear(),
							yesterday.getMonth(),
							yesterday.getDate(),
							23,
							59,
							59,
							999,
						);
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												gte: startOfYesterday,
												lte: endOfYesterday,
											},
										},
									],
								},
							},
						};
					case "this_week":
						const now = new Date();
						const startOfWeek = new Date(now);
						startOfWeek.setDate(now.getDate() - now.getDay());
						startOfWeek.setHours(0, 0, 0, 0);
						const endOfWeek = new Date(startOfWeek);
						endOfWeek.setDate(startOfWeek.getDate() + 6);
						endOfWeek.setHours(23, 59, 59, 999);
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												gte: startOfWeek,
												lte: endOfWeek,
											},
										},
									],
								},
							},
						};
					case "this_month":
						const currentMonth = new Date();
						const startOfMonth = new Date(
							currentMonth.getFullYear(),
							currentMonth.getMonth(),
							1,
						);
						const endOfMonth = new Date(
							currentMonth.getFullYear(),
							currentMonth.getMonth() + 1,
							0,
							23,
							59,
							59,
							999,
						);
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												gte: startOfMonth,
												lte: endOfMonth,
											},
										},
									],
								},
							},
						};
					case "this_year":
						const currentYear = new Date().getFullYear();
						const startOfYear = new Date(currentYear, 0, 1);
						const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											value: {
												path: ["$"],
												gte: startOfYear,
												lte: endOfYear,
											},
										},
									],
								},
							},
						};
					case "is_empty":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											OR: [{ value: null }, { value: "" }],
										},
									],
								},
							},
						};
					case "is_not_empty":
						return {
							cells: {
								some: {
									AND: [
										{ columnId: Number(columnId) },
										{
											AND: [{ NOT: { value: null } }, { NOT: { value: "" } }],
										},
									],
								},
							},
						};
					default:
						return {};
				}
			});

			// Combine all filter conditions with AND
			if (filterConditions.length > 0) {
				whereClause.AND = filterConditions.filter(
					(condition: any) => Object.keys(condition).length > 0,
				);
			}
		}

		// Get total count for pagination info with filters applied
		const totalRows = await prisma.row.count({
			where: whereClause,
		});

		console.log(
			`DEBUG MAIN: Table ${tableId} has ${totalRows} total rows after filtering, page=${validPage}, pageSize=${validPageSize}, skip=${skip}`,
		);

		// Optimized query with proper indexing support and filters
		const rows = await prisma.row.findMany({
			where: whereClause,
			include: {
				cells: includeCells
					? {
							include: {
								column: {
									select: {
										id: true,
										name: true,
										type: true,
										order: true,
									},
								},
							},
					  }
					: false,
			},
			orderBy: [
				{
					id: "asc", // Use primary key for better performance
				},
			],
			skip,
			take: validPageSize,
		});

		console.log(`DEBUG MAIN: Found ${rows.length} rows for current page`);

		// Sortăm coloanele după ordine în aplicație dacă includem cells
		const sortedRows = includeCells
			? rows.map((row: any) => ({
					...row,
					cells: row.cells.sort((a: any, b: any) => {
						// TypeScript assertion: when includeCells is true, cells include column relation
						const cellA = a as any;
						const cellB = b as any;
						return cellA.column.order - cellB.column.order;
					}),
			  }))
			: rows;

		const totalPages = Math.ceil(totalRows / validPageSize);

		return NextResponse.json({
			data: sortedRows,
			pagination: {
				page: validPage,
				pageSize: validPageSize,
				totalRows,
				totalPages,
				hasNext: validPage < totalPages,
				hasPrev: validPage > 1,
			},
		});
	} catch (error) {
		console.error("Error fetching rows:", error);
		return NextResponse.json(
			{ error: "Failed to fetch rows" },
			{ status: 500 },
		);
	}
}
