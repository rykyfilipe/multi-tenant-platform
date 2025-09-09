/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkTableEditPermission } from "@/lib/auth";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { checkPlanLimit } from "@/lib/planLimits";
import { updateMemoryAfterRowChange } from "@/lib/memory-middleware";
import { z } from "zod";
import {
	ApiErrors,
	ApiSuccess,
	handleApiError,
	asyncHandler,
} from "@/lib/api-error-handler";
import {
	TransactionManager,
	createRowWithCellsTransaction,
} from "@/lib/transaction-manager";
import { validateSecurity } from "@/lib/security-validation";
import {
	trackUserAction,
	trackDatabaseOperationFromResponse,
} from "@/lib/api-tracker";

const RowSchema = z.object({
	cells: z.array(
		z.object({
			columnId: z.number(),
			value: z.any(),
		}),
	),
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
	const startTime = Date.now();

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

	// Check table edit permissions instead of hard-coded role check
	const canEdit = await checkTableEditPermission(
		userId,
		Number(tableId),
		Number(tenantId),
	);
	if (!canEdit)
		return NextResponse.json(
			{ error: "Insufficient permissions to edit this table" },
			{ status: 403 },
		);

	try {
		const body = await request.json();

		// Parse single row data
		const parsedData = RowSchema.parse(body);

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

		const rowLimitCheck = await checkPlanLimit(
			userId,
			"rows",
			currentRowCount + 1,
		);

		if (!rowLimitCheck.allowed) {
			return NextResponse.json(
				{
					error: "Row limit exceeded",
					details: `You have ${currentRowCount} rows and are trying to add 1 more. Your plan allows ${rowLimitCheck.limit} rows total.`,
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

			// Verificăm că toate coloanele required au valori
			const requiredColumns = table.columns.filter((col: any) => col.required);
			const providedColumnIds = new Set(
				cells.map((cell: any) => cell.columnId),
			);

			for (const requiredCol of requiredColumns) {
				if (!providedColumnIds.has(requiredCol.id)) {
					validationErrors.push(
						`Required column "${requiredCol.name}" is missing`,
					);
				}
			}

			// Dacă există erori de validare pentru coloanele required, returnăm erorile
			if (validationErrors.length > 0) {
				return { processedCells: [], validationErrors };
			}

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

				// Verificăm că coloanele required au valori
				if (column.required) {
					if (column.type === "reference") {
						// Pentru coloanele de tip reference, verificăm că array-ul nu este gol
						if (!Array.isArray(cell.value) || cell.value.length === 0) {
							validationErrors.push(
								`Required column "${column.name}" must have at least one reference selected`,
							);
							continue;
						}
					} else {
						// Pentru alte tipuri, verificăm că valoarea nu este goală
						if (
							cell.value === null ||
							cell.value === undefined ||
							cell.value === ""
						) {
							validationErrors.push(
								`Required column "${column.name}" cannot be empty`,
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
					// Pentru coloanele de referință, validăm că valoarea cheii primare există
					const referenceTable = await prisma.table.findFirst({
						where: { id: column.referenceTableId },
						include: {
							columns: {
								where: { primary: true },
								select: { id: true, name: true, type: true },
							},
						},
					});

					if (referenceTable && referenceTable.columns.length > 0) {
						const primaryColumn = referenceTable.columns[0];

						// Pentru reference columns, cell.value este întotdeauna un array (always multiple)
						if (Array.isArray(cell.value)) {
							// Validăm fiecare valoare a cheii primare din array
							for (const primaryKeyValue of cell.value) {
								// Verificăm dacă există un rând cu această valoare a cheii primare
								const referenceRow = await prisma.row.findFirst({
									where: {
										tableId: column.referenceTableId,
										cells: {
											some: {
												columnId: primaryColumn.id,
												value: {
													equals: primaryKeyValue,
												},
											},
										},
									},
								});

								if (!referenceRow) {
									validationErrors.push(
										`Reference value "${primaryKeyValue}" not found in table "${referenceTable.name}" for column "${column.name}"`,
									);
								}
							}
							// Dacă există erori de validare, omitem această celulă
							if (validationErrors.some((err) => err.includes(column.name))) {
								continue;
							}
						} else {
							// Pentru single reference values, convertim la array și validăm
							const primaryKeyValue = cell.value;
							if (primaryKeyValue) {
								// Verificăm dacă există un rând cu această valoare a cheii primare
								const referenceRow = await prisma.row.findFirst({
									where: {
										tableId: column.referenceTableId,
										cells: {
											some: {
												columnId: primaryColumn.id,
												value: {
													equals: primaryKeyValue,
												},
											},
										},
									},
								});

								if (!referenceRow) {
									validationErrors.push(
										`Reference value "${primaryKeyValue}" not found in table "${referenceTable.name}" for column "${column.name}"`,
									);
									continue; // Omitem această celulă din procesare
								}
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

		// Validez toate celulele înainte de crearea rândului
		const validationErrors = [];
		const cellsToCreate = [];

		for (const cell of parsedData.cells) {
			const column = table.columns.find((col: any) => col.id === cell.columnId);

			if (!column) {
				validationErrors.push(`Unknown column ID: ${cell.columnId}`);
				continue;
			}

			// Validez securitatea pentru input-uri de tip string
			if (typeof cell.value === "string") {
				const securityCheck = validateSecurity(cell.value);
				if (!securityCheck.isValid) {
					validationErrors.push(
						`Security threat detected in column "${
							column.name
						}": ${securityCheck.threats.join(", ")}`,
					);
					continue;
				}
				cell.value = securityCheck.sanitized;
			}

			// Validez coloanele required
			if (
				column.required &&
				(cell.value === null || cell.value === undefined || cell.value === "")
			) {
				validationErrors.push(
					`Required column "${column.name}" cannot be empty`,
				);
				continue;
			}

			// Validez coloanele customArray
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

			// Validez referințele
			if (column.type === "reference" && column.referenceTableId) {
				const referenceTable = await prisma.table.findFirst({
					where: { id: column.referenceTableId },
					include: { columns: { where: { primary: true } } },
				});

				if (referenceTable && referenceTable.columns.length > 0) {
					const primaryColumn = referenceTable.columns[0];
					const referenceValues = Array.isArray(cell.value)
						? cell.value
						: [cell.value];

					for (const refValue of referenceValues) {
						if (refValue) {
							const referenceRow = await prisma.row.findFirst({
								where: {
									tableId: column.referenceTableId,
									cells: {
										some: {
											columnId: primaryColumn.id,
											value: { equals: refValue },
										},
									},
								},
							});

							if (!referenceRow) {
								validationErrors.push(
									`Reference value "${refValue}" not found in table "${referenceTable.name}" for column "${column.name}"`,
								);
							}
						}
					}
				}
			}

			cellsToCreate.push({
				columnId: cell.columnId,
				value: cell.value,
			});
		}

		// Returnez erori de validare dacă există
		if (validationErrors.length > 0) {
			return ApiErrors.validationFailed(validationErrors).toResponse();
		}

		// Creez rândul și celulele într-o tranzacție
		const transactionResult = await createRowWithCellsTransaction(
			Number(tableId),
			cellsToCreate,
		);

		if (!transactionResult.success) {
			console.error("Transaction failed:", transactionResult.error);
			return ApiErrors.databaseError(
				"Failed to create row and cells",
			).toResponse();
		}

		// Actualizez memoria după crearea rândului
		try {
			await updateMemoryAfterRowChange(Number(tenantId));
		} catch (memoryError) {
			console.warn("Memory update failed:", memoryError);
			// Nu returnez eroare pentru actualizarea memoriei, dar o loghez
		}

		// Returnez rândul creat cu celulele
		const createdRow = await prisma.row.findUnique({
			where: { id: transactionResult.data!.row.id },
			include: {
				cells: {
					include: {
						column: true,
					},
				},
			},
		});

		// Track user activity and database operation
		if (createdRow) {
			trackUserAction(
				userId,
				Number(tenantId),
				"create",
				"row",
				createdRow.id,
				request,
				{
					tableId: Number(tableId),
					databaseId: Number(databaseId),
					cellsCount: cellsToCreate.length,
				},
			);

			trackDatabaseOperationFromResponse(
				Number(tenantId),
				Number(databaseId),
				"create_row",
				`table_${tableId}`,
				createdRow,
				startTime,
			);
		}

		return ApiSuccess.created(
			createdRow,
			"Row created successfully",
		).toResponse(201);
	} catch (error) {
		const path = `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows`;
		return handleApiError(error, path);
	}
}

// Function to apply string filters that couldn't be handled by Prisma
async function applyStringFilters(
	rows: any[],
	filters: any[],
	tableColumns: any[],
): Promise<any[]> {
	const stringFilters = filters.filter((filter) => {
		const column = tableColumns.find((col) => col.id === filter.columnId);
		if (!column) return false;

		return (
			["text", "string", "email", "url"].includes(column.type) &&
			["starts_with", "ends_with", "contains", "not_contains", "equals", "not_equals", "is_empty", "is_not_empty"].includes(
				filter.operator,
			)
		);
	});

	if (stringFilters.length === 0) return rows;

	return rows.filter((row) => {
		return stringFilters.every((filter) => {
			const cell = row.cells?.find((c: any) => c.columnId === filter.columnId);
			
			// Handle is_empty and is_not_empty operators first
			if (filter.operator === "is_empty") {
				// Check if cell is empty
				return !cell || cell.value === null || cell.value === undefined || cell.value === "";
			} else if (filter.operator === "is_not_empty") {
				// Check if cell is not empty
				return cell && cell.value !== null && cell.value !== undefined && cell.value !== "";
			}

			// Handle empty/null cells for other operators
			if (!cell || cell.value === null || cell.value === undefined || cell.value === "") {
				return false; // For other operators, empty cell doesn't match
			}

			// For other operators, check if filter value is empty
			if (filter.value === null || filter.value === undefined || filter.value === "") {
				return false; // Empty filter value doesn't match anything
			}

			const cellValue = String(cell.value);
			const filterValue = String(filter.value);

			switch (filter.operator) {
				case "starts_with":
					return cellValue.toLowerCase().startsWith(filterValue.toLowerCase());
				case "ends_with":
					return cellValue.toLowerCase().endsWith(filterValue.toLowerCase());
				case "contains":
					return cellValue.toLowerCase().includes(filterValue.toLowerCase());
				case "not_contains":
					return !cellValue.toLowerCase().includes(filterValue.toLowerCase());
				case "equals":
					return cellValue === filterValue;
				case "not_equals":
					return cellValue !== filterValue;
				case "is_empty":
					return false; // Cell has value, so it's not empty
				case "is_not_empty":
					return true; // Cell has value, so it's not empty
				default:
					return true;
			}
		});
	});
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
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Get table columns for filtering
		const tableColumns = await prisma.column.findMany({
			where: { tableId: Number(tableId) },
			select: {
				id: true,
				name: true,
				type: true,
				order: true,
				semanticType: true,
			},
			orderBy: { order: "asc" },
		});

		// Verificăm permisiunile pentru utilizatorii non-admin
		if (sessionResult.user.role !== "ADMIN") {
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

		// Get pagination and filter parameters from URL
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const pageSize = parseInt(url.searchParams.get("pageSize") || "25");
		const includeCells = url.searchParams.get("includeCells") !== "false"; // Default to true for backwards compatibility

		// Filter parameters
		const globalSearch = url.searchParams.get("search") || "";
		const filters = url.searchParams.get("filters") || "";
		const sortBy = url.searchParams.get("sortBy") || "id";
		const sortOrder = url.searchParams.get("sortOrder") || "asc";

		// Validate pagination parameters
		const validPage = Math.max(1, page);
		const validPageSize = Math.min(Math.max(1, pageSize), 100); // Limit page size to 100
		const skip = (validPage - 1) * validPageSize;

		// Build where clause for filtering
		let whereClause: any = {
			tableId: Number(tableId),
		};

		// Parse filters from URL parameter
		let parsedFilters: any[] = [];
		try {
			if (filters) {
				parsedFilters = JSON.parse(decodeURIComponent(filters));
			}
		} catch (error) {
			console.warn("Failed to parse filters:", error);
		}

		// Apply column filters
		if (parsedFilters.length > 0) {
			console.log("🔍 API - Processing filters:", parsedFilters);
			const filterConditions = parsedFilters.map((filter: any) => {
				const { columnId, operator, value, secondValue } = filter;
				
				// Find the column to determine the correct data type
				const column = tableColumns.find((col: any) => col.id === Number(columnId));
				if (!column) {
					console.warn(`Column with ID ${columnId} not found`);
					return {};
				}
				
				// Convert values to appropriate types based on column type
				let convertedValue = value;
				let convertedSecondValue = secondValue;
				
				if (["number", "integer", "decimal"].includes(column.type)) {
					convertedValue = value !== null && value !== undefined && value !== "" ? Number(value) : null;
					convertedSecondValue = secondValue !== null && secondValue !== undefined && secondValue !== "" ? Number(secondValue) : null;
				} else if (["boolean"].includes(column.type)) {
					convertedValue = value === "true" || value === true;
				}
				
				console.log(`🔍 API - Filter ${operator} on column ${column.name} (${column.type}):`, {
					originalValue: value,
					convertedValue,
					originalSecondValue: secondValue,
					convertedSecondValue
				});

				switch (operator) {
					case "contains":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										path: ["$"],
										string_contains: value,
									},
								},
							},
						};
					case "not_contains":
						return {
							cells: {
								none: {
									columnId: Number(columnId),
									value: {
										path: ["$"],
										string_contains: value,
									},
								},
							},
						};
					case "equals":
						// For string columns, handle in post-processing
						if (["text", "string", "email", "url"].includes(column.type)) {
							return {};
						}
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: convertedValue,
								},
							},
						};
					case "not_equals":
					case "notEquals":
						// For string columns, handle in post-processing
						if (["text", "string", "email", "url"].includes(column.type)) {
							return {};
						}
						return {
							cells: {
								none: {
									columnId: Number(columnId),
									value: convertedValue,
								},
							},
						};
					case "starts_with":
					case "ends_with":
						// These will be handled by post-processing string filters
						return {};
					case "regex":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										path: ["$"],
										string_matches: value,
									},
								},
							},
						};
					case "greater_than":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										gt: convertedValue,
									},
								},
							},
						};
					case "greater_than_or_equal":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										gte: convertedValue,
									},
								},
							},
						};
					case "less_than":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										lt: convertedValue,
									},
								},
							},
						};
					case "less_than_or_equal":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										lte: convertedValue,
									},
								},
							},
						};
					case "between":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										gte: convertedValue,
										lte: convertedSecondValue,
									},
								},
							},
						};
					case "not_between":
						return {
							cells: {
								none: {
									columnId: Number(columnId),
									value: {
										gte: convertedValue,
										lte: convertedSecondValue,
									},
								},
							},
						};
					case "today":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										path: ["$"],
										equals: new Date().toISOString().split("T")[0],
									},
								},
							},
						};
					case "yesterday":
						const yesterday = new Date();
						yesterday.setDate(yesterday.getDate() - 1);
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										path: ["$"],
										equals: yesterday.toISOString().split("T")[0],
									},
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
									columnId: Number(columnId),
									value: {
										path: ["$"],
										gte: startOfWeek.toISOString(),
										lte: endOfWeek.toISOString(),
									},
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
						);
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										path: ["$"],
										gte: startOfMonth.toISOString(),
										lte: endOfMonth.toISOString(),
									},
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
									columnId: Number(columnId),
									value: {
										path: ["$"],
										gte: startOfYear.toISOString(),
										lte: endOfYear.toISOString(),
									},
								},
							},
						};
					case "is_empty":
					case "is_not_empty":
						// These will be handled by post-processing string filters
						return {};
					case "before":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										lt: new Date(convertedValue).toISOString(),
									},
								},
							},
						};
					case "after":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										gt: new Date(convertedValue).toISOString(),
									},
								},
							},
						};
					default:
						console.warn(`Unsupported filter operator: ${operator}`);
						return {};
				}
			});

			// Combine all filter conditions with AND logic
			if (filterConditions.length > 0) {
				console.log("🔍 API - Filter conditions:", filterConditions);
				whereClause = {
					...whereClause,
					AND: filterConditions,
				};
			}
		}

		// Apply global search if provided
		if (globalSearch.trim()) {
			const searchTerm = globalSearch.trim();
			// Combine global search with existing filters using AND logic
			if (whereClause.AND) {
				whereClause = {
					...whereClause,
					AND: [
						...whereClause.AND,
						{
							cells: {
								some: {
									value: {
										path: ["$"],
										string_contains: searchTerm,
									},
								},
							},
						},
					],
				};
			} else {
				whereClause = {
					...whereClause,
					cells: {
						some: {
							value: {
								path: ["$"],
								string_contains: searchTerm,
							},
						},
					},
				};
			}
		}

		// Get total count for pagination info with filters applied
		console.log("🔍 API - Final whereClause:", JSON.stringify(whereClause, null, 2));
		const totalRows = await prisma.row.count({
			where: whereClause,
		});

		// Build orderBy clause
		let orderByClause: any = {};
		if (sortBy === "id") {
			orderByClause.id = sortOrder;
		} else if (sortBy === "createdAt") {
			orderByClause.createdAt = sortOrder;
		} else {
			// Default to id ordering
			orderByClause.id = "asc";
		}

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
										semanticType: true,
									},
								},
							},
					  }
					: false,
			},
			orderBy: [orderByClause],
			skip,
			take: validPageSize,
		});

		// Apply string filters that couldn't be handled by Prisma
		let filteredRows = rows;
		if (parsedFilters.length > 0) {
			filteredRows = await applyStringFilters(
				rows,
				parsedFilters,
				tableColumns,
			);
		}

		// For string filters, we need to get the total count differently
		// since we can't efficiently count with string filters in Prisma
		let finalTotalRows = totalRows;
		if (parsedFilters.length > 0) {
			// If we have string filters, we need to get all rows to count them
			// This is not ideal for performance but necessary for accurate pagination
			const allRows = await prisma.row.findMany({
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
											semanticType: true,
										},
									},
								},
						  }
						: false,
				},
				orderBy: [orderByClause],
			});
			
			const allFilteredRows = await applyStringFilters(
				allRows,
				parsedFilters,
				tableColumns,
			);
			finalTotalRows = allFilteredRows.length;
		}

		// Sortăm coloanele după ordine în aplicație dacă includem cells
		const sortedRows = includeCells
			? filteredRows.map((row: any) => ({
					...row,
					cells: row.cells.sort((a: any, b: any) => {
						// TypeScript assertion: when includeCells is true, cells include column relation
						const cellA = a as any;
						const cellB = b as any;
						return cellA.column.order - cellB.column.order;
					}),
			  }))
			: filteredRows;

		const totalPages = Math.ceil(finalTotalRows / validPageSize);

		return NextResponse.json({
			data: sortedRows,
			pagination: {
				page: validPage,
				pageSize: validPageSize,
				totalRows: finalTotalRows,
				totalPages,
				hasNext: validPage < totalPages,
				hasPrev: validPage > 1,
			},
			filters: {
				applied: parsedFilters.length > 0 || globalSearch.trim() !== "",
				globalSearch,
				columnFilters: parsedFilters,
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

// POST endpoint for filtering rows with JSON body
export async function POST_FILTER(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const { tenantId, databaseId, tableId } = await params;

	// Verificare autentificare
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);

	// Verificare acces tenant
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		// Parse request body
		const body = await request.json();
		
		// Validate required fields
		if (!body.page || !body.pageSize) {
			return NextResponse.json(
				{ error: "Missing required fields: page, pageSize" },
				{ status: 400 }
			);
		}

		// Extract filter parameters from body
		const {
			page = 1,
			pageSize = 25,
			includeCells = true,
			globalSearch = "",
			filters = [],
			sortBy = "id",
			sortOrder = "asc"
		} = body;

		// Validate pagination parameters
		const validPage = Math.max(1, parseInt(page.toString()));
		const validPageSize = Math.min(Math.max(1, parseInt(pageSize.toString())), 100);
		const skip = (validPage - 1) * validPageSize;

		// Verificare existență database și table
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

		// Verificare permisiuni pentru utilizatorii non-admin
		if (sessionResult.user.role !== "ADMIN") {
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

		// Obține coloanele tabelului
		const tableColumns = await prisma.column.findMany({
			where: { tableId: Number(tableId) },
			select: {
				id: true,
				name: true,
				type: true,
				referenceTableId: true,
				order: true,
				semanticType: true,
			},
			orderBy: { order: "asc" },
		});

		// Build where clause for filtering
		let whereClause: any = {
			tableId: Number(tableId),
		};

		// Apply global search
		if (globalSearch && globalSearch.trim()) {
			whereClause.cells = {
				some: {
					value: {
						string_contains: globalSearch.trim(),
					},
				},
			};
		}

		// Apply column filters
		if (filters && filters.length > 0) {
			console.log("🔍 POST API - Processing filters:", filters);
			const filterConditions = filters.map((filter: any) => {
				const { columnId, operator, value, secondValue } = filter;
				
				// Find the column to determine the correct data type
				const column = tableColumns.find((col: any) => col.id === Number(columnId));
				if (!column) {
					console.warn(`Column with ID ${columnId} not found`);
					return {};
				}
				
				// Convert values to appropriate types based on column type
				let convertedValue = value;
				let convertedSecondValue = secondValue;
				
				if (["number", "integer", "decimal"].includes(column.type)) {
					convertedValue = value !== null && value !== undefined && value !== "" ? Number(value) : null;
					convertedSecondValue = secondValue !== null && secondValue !== undefined && secondValue !== "" ? Number(secondValue) : null;
				} else if (["boolean"].includes(column.type)) {
					convertedValue = value === "true" || value === true;
				}
				
				console.log(`🔍 POST API - Filter ${operator} on column ${column.name} (${column.type}):`, {
					originalValue: value,
					convertedValue,
					originalSecondValue: secondValue,
					convertedSecondValue
				});

				switch (operator) {
					case "contains":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: {
										path: ["$"],
										string_contains: value,
									},
								},
							},
						};
					case "not_contains":
						return {
							cells: {
								none: {
									columnId: Number(columnId),
									value: {
										path: ["$"],
										string_contains: value,
									},
								},
							},
						};
					case "equals":
						// For string columns, handle in post-processing
						if (["text", "string", "email", "url"].includes(column.type)) {
							return {
								cells: {
									some: {
										columnId: Number(columnId),
										value: value,
									},
								},
							};
						}
						// For numeric columns
						if (["number", "integer", "decimal"].includes(column.type)) {
							return {
								cells: {
									some: {
										columnId: Number(columnId),
										value: convertedValue,
									},
								},
							};
						}
						// For boolean columns
						if (column.type === "boolean") {
							return {
								cells: {
									some: {
										columnId: Number(columnId),
										value: convertedValue,
									},
								},
							};
						}
						// For date columns
						if (["date", "datetime"].includes(column.type)) {
							return {
								cells: {
									some: {
										columnId: Number(columnId),
										value: new Date(value),
									},
								},
							};
						}
						return {};
					case "not_equals":
						if (["text", "string", "email", "url"].includes(column.type)) {
							return {
								cells: {
									none: {
										columnId: Number(columnId),
										value: value,
									},
								},
							};
						}
						if (["number", "integer", "decimal"].includes(column.type)) {
							return {
								cells: {
									none: {
										columnId: Number(columnId),
										value: convertedValue,
									},
								},
							};
						}
						if (column.type === "boolean") {
							return {
								cells: {
									none: {
										columnId: Number(columnId),
										value: convertedValue,
									},
								},
							};
						}
						return {};
					case "greater_than":
						if (["number", "integer", "decimal"].includes(column.type)) {
							return {
								cells: {
									some: {
										columnId: Number(columnId),
										value: { gt: convertedValue },
									},
								},
							};
						}
						return {};
					case "greater_than_or_equal":
						if (["number", "integer", "decimal"].includes(column.type)) {
							return {
								cells: {
									some: {
										columnId: Number(columnId),
										value: { gte: convertedValue },
									},
								},
							};
						}
						return {};
					case "less_than":
						if (["number", "integer", "decimal"].includes(column.type)) {
							return {
								cells: {
									some: {
										columnId: Number(columnId),
										value: { lt: convertedValue },
									},
								},
							};
						}
						return {};
					case "less_than_or_equal":
						if (["number", "integer", "decimal"].includes(column.type)) {
							return {
								cells: {
									some: {
										columnId: Number(columnId),
										value: { lte: convertedValue },
									},
								},
							};
						}
						return {};
					case "between":
						if (["number", "integer", "decimal"].includes(column.type)) {
							return {
								cells: {
									some: {
										columnId: Number(columnId),
										value: {
											gte: convertedValue,
											lte: convertedSecondValue,
										},
									},
								},
							};
						}
						if (["date", "datetime"].includes(column.type)) {
							return {
								cells: {
									some: {
										columnId: Number(columnId),
										value: {
											gte: new Date(value),
											lte: new Date(secondValue),
										},
									},
								},
							};
						}
						return {};
					case "not_between":
						if (["number", "integer", "decimal"].includes(column.type)) {
							return {
								cells: {
									none: {
										columnId: Number(columnId),
										value: {
											gte: convertedValue,
											lte: convertedSecondValue,
										},
									},
								},
							};
						}
						if (["date", "datetime"].includes(column.type)) {
							return {
								cells: {
									none: {
										columnId: Number(columnId),
										value: {
											gte: new Date(value),
											lte: new Date(secondValue),
										},
									},
								},
							};
						}
						return {};
					case "is_empty":
						return {
							cells: {
								none: {
									columnId: Number(columnId),
									value: { not: null },
								},
							},
						};
					case "is_not_empty":
						return {
							cells: {
								some: {
									columnId: Number(columnId),
									value: { not: null },
								},
							},
						};
					default:
						return {};
				}
			});

			// Add filter conditions to where clause
			const nonEmptyConditions = filterConditions.filter(
				(condition: any) => Object.keys(condition).length > 0,
			);
			if (nonEmptyConditions.length > 0) {
				whereClause.AND = nonEmptyConditions;
			}
		}

		// Get total count for pagination
		const totalRows = await prisma.row.count({
			where: whereClause,
		});

		// Build order by clause
		let orderByClause: any = {};
		if (sortBy === "id") {
			orderByClause.id = sortOrder;
		} else if (sortBy === "createdAt") {
			orderByClause.createdAt = sortOrder;
		} else {
			orderByClause.id = "asc";
		}

		// Fetch rows with pagination
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
										referenceTableId: true,
										semanticType: true,
									},
								},
							},
					  }
					: false,
			},
			orderBy: [orderByClause],
			skip: skip,
			take: validPageSize,
		});

		// Apply string filters that couldn't be handled by Prisma
		let filteredRows = rows;
		if (filters && filters.length > 0) {
			filteredRows = await applyStringFilters(
				rows,
				filters,
				tableColumns,
			);
		}

		// Sort cells by column order
		const sortedRows = includeCells
			? filteredRows.map((row: any) => ({
					...row,
					cells: row.cells.sort((a: any, b: any) => {
						const cellA = a as any;
						const cellB = b as any;
						return cellA.column.order - cellB.column.order;
					}),
			  }))
			: filteredRows;

		const totalPages = Math.ceil(totalRows / validPageSize);

		return NextResponse.json({
			data: sortedRows,
			pagination: {
				page: validPage,
				pageSize: validPageSize,
				totalRows: totalRows,
				totalPages,
				hasNext: validPage < totalPages,
				hasPrev: validPage > 1,
			},
			filters: {
				applied: filters.length > 0 || globalSearch !== "",
				globalSearch: globalSearch,
				columnFilters: filters,
				validFiltersCount: filters.length,
			},
		});

	} catch (error) {
		console.error("Error in POST filtering:", error);
		return NextResponse.json(
			{ error: "Failed to filter rows" },
			{ status: 500 },
		);
	}
}
