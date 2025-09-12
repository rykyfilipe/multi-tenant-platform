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
import { FilterConfig } from "@/types/filtering-enhanced";
import { FilterValidator } from "@/lib/filter-validator";
import { PrismaFilterBuilder } from "@/lib/prisma-filter-builder";
import { logger } from "@/lib/error-logger";

const RowSchema = z.object({
	cells: z.array(
		z.object({
			columnId: z.number(),
			value: z.any(),
		}),
	),
});

// Enhanced filter validation schema
const FilterSchema = z.object({
	id: z.string().min(1),
	columnId: z.number().positive(),
	columnName: z.string().min(1),
	columnType: z.enum(['text', 'string', 'email', 'url', 'number', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'time', 'json', 'reference', 'customArray']),
	operator: z.string().min(1),
	value: z.any().optional().nullable(),
	secondValue: z.any().optional().nullable(),
});

const QueryParamsSchema = z.object({
	page: z.string().transform((val) => Math.max(1, parseInt(val) || 1)),
	pageSize: z.string().transform((val) => Math.min(Math.max(1, parseInt(val) || 25), 100)),
	includeCells: z.string().optional().transform((val) => val !== "false"),
	search: z.string().optional().transform((val) => val?.trim() || ""),
	filters: z.string().optional().transform((val) => {
			if (!val) return [];
			try {
				// Handle potential double encoding
				let decoded = val;
				try {
					decoded = decodeURIComponent(val);
				} catch (e) {
					// If decodeURIComponent fails, use the original value
					decoded = val;
				}
				
				const parsed = JSON.parse(decoded);
				logger.info("Parsed filters successfully", { original: val, decoded, parsed });
				return z.array(FilterSchema).parse(parsed);
			} catch (error) {
				logger.warn("Failed to parse filters", { error, filters: val, errorMessage: error instanceof Error ? error.message : String(error) });
				throw new Error("Invalid filters format");
			}
		}),
	sortBy: z.string().optional().transform((val) => val || "id"),
	sortOrder: z.string().optional().transform((val) => (val === "desc" ? "desc" : "asc")),
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

			// Creăm un map cu celulele existente pentru acces rapid
			const providedCellsMap = new Map(
				cells.map((cell: any) => [cell.columnId, cell.value])
			);

			// Pentru fiecare coloană din tabel, verificăm dacă există o celulă
			// Dacă nu există și coloana are defaultValue, o adăugăm
			for (const column of table.columns) {
				if (!providedCellsMap.has(column.id)) {
					// Dacă coloana are defaultValue, o folosim
					if (column.defaultValue !== null && column.defaultValue !== undefined) {
						cells.push({
							columnId: column.id,
							value: column.defaultValue
						});
						providedCellsMap.set(column.id, column.defaultValue);
					}
				}
			}

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


export async function GET(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const startTime = Date.now();
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
		// Parse and validate query parameters
		const url = new URL(request.url);
		logger.info("🔍 GET /rows - Request details", {
			fullUrl: request.url,
			tenantId: String(tenantId),
			databaseId: String(databaseId),
			tableId: String(tableId),
			userId: String(userId),
			searchParams: Object.fromEntries(url.searchParams.entries())
		});
		
		const queryParams = {
			page: url.searchParams.get("page") || "1",
			pageSize: url.searchParams.get("pageSize") || "25",
			includeCells: url.searchParams.get("includeCells") || "true",
			search: url.searchParams.get("search") || "",
			filters: url.searchParams.get("filters") || "",
			sortBy: url.searchParams.get("sortBy") || "id",
			sortOrder: url.searchParams.get("sortOrder") || "asc",
		};
		
		logger.info("🔍 GET /rows - Parsed query params", { queryParams });

		let validatedParams;
		try {
			validatedParams = QueryParamsSchema.parse(queryParams);
			logger.info("✅ GET /rows - Query params validation successful", { validatedParams });
		} catch (validationError) {
			logger.error("❌ GET /rows - Query params validation failed", validationError as Error, { 
				queryParams,
				errorMessage: validationError instanceof Error ? validationError.message : String(validationError)
			});
			return NextResponse.json(
				{ 
					error: "Invalid query parameters", 
					details: validationError instanceof Error ? validationError.message : String(validationError),
					receivedParams: queryParams
				}, 
				{ status: 400 }
			);
		}
		
		const { page, pageSize, includeCells, search, filters, sortBy, sortOrder } = validatedParams;
		
		logger.info("🔍 GET /rows - Starting database and table verification", {
			page, pageSize, includeCells, search, filters, sortBy, sortOrder
		});

		// Verify database exists and belongs to tenant
		const database = await prisma.database.findFirst({
			where: {
				id: Number(databaseId),
				tenantId: Number(tenantId),
			},
		});

		if (!database) {
			logger.warn("❌ Database not found", { tenantId: String(tenantId), databaseId: String(databaseId), userId: String(userId) });
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}
		
		logger.info("✅ Database found", { databaseId: String(databaseId), databaseName: database.name });

		// Verify table exists
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
			},
		});

		if (!table) {
			logger.warn("❌ Table not found", { tenantId: String(tenantId), databaseId: String(databaseId), tableId: String(tableId), userId: String(userId) });
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}
		
		logger.info("✅ Table found", { tableId: String(tableId), tableName: table.name });

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

		// Check permissions for non-admin users
		if (sessionResult.user.role !== "ADMIN") {
			const permission = await prisma.tablePermission.findFirst({
				where: {
					userId: userId,
					tableId: Number(tableId),
					canRead: true,
				},
			});

			if (!permission) {
			logger.warn("Access denied to table", { tenantId: String(tenantId), tableId: String(tableId), userId: String(userId) });
				return NextResponse.json({ error: "Access denied" }, { status: 403 });
			}
		}

		// Convert filters to proper FilterConfig format
		const convertedFilters: FilterConfig[] = filters.map(filter => ({
			...filter,
			columnType: filter.columnType as any,
			operator: filter.operator as any,
			value: filter.value ?? null,
			secondValue: filter.secondValue ?? null
		}));

		// Validate filters using the new validator
		logger.info("Validating filters", { 
			filters: convertedFilters, 
			tableColumns: tableColumns.map((col : any) => ({ id: col.id, name: col.name, type: col.type })),
			tenantId: String(tenantId), 
			tableId: String(tableId), 
			userId: String(userId) 
		});
		
		const validationResult = FilterValidator.validateFilters(convertedFilters, tableColumns);
		if (!validationResult.isValid) {
			logger.warn("Invalid filters provided", { 
				errors: validationResult.errors, 
				filters: convertedFilters, 
				tableColumns: tableColumns.map((col: any) => ({ id: col.id, name: col.name, type: col.type })),
				tenantId: String(tenantId), 
				tableId: String(tableId), 
				userId: String(userId) 
			});
		return NextResponse.json(
				{ 
					error: "Invalid filters", 
					details: validationResult.errors,
					warnings: validationResult.warnings 
				}, 
				{ status: 400 }
			);
		}

		// Log warnings if any
		if (validationResult.warnings.length > 0) {
			logger.info("Filter validation warnings", { 
				warnings: validationResult.warnings, 
				tenantId: String(tenantId), 
				tableId: String(tableId), 
				userId: String(userId) 
			});
		}
		
		logger.info("✅ Filter validation successful, proceeding with query", {
			convertedFilters,
			search,
			sortBy,
			sortOrder,
			page,
			pageSize
		});

		// Cache removed - using direct Prisma queries


		// Build optimized where clause using PrismaFilterBuilder
		const filterBuilder = new PrismaFilterBuilder(Number(tableId), tableColumns);
		filterBuilder
			.addGlobalSearch(search)
			.addColumnFilters(convertedFilters);

		const whereClause = filterBuilder.getWhereClause();
		const hasPostProcessFilters = filterBuilder.hasPostProcessFilters();

		// Execute optimized query with Prisma
		logger.info("🔍 Executing filtered query", { 
			whereClause: JSON.stringify(whereClause, null, 2),
			tenantId: String(tenantId), 
			tableId: String(tableId), 
			userId: String(userId),
			filtersCount: convertedFilters.length,
			hasGlobalSearch: !!search,
			hasPostProcessFilters
		});

		let totalRows: number;
		let rows: any[];

		if (hasPostProcessFilters) {
			// If we have post-process filters, we need to get all rows first
			// then apply post-process filtering
			const allRows = await prisma.row.findMany({
				where: whereClause,
				include: {
					cells: includeCells ? {
								include: {
							column: true
						}
					} : false
				}
			});

			// Apply post-process filters
			const filteredRows = filterBuilder.applyPostProcessFilters(allRows);
			totalRows = filteredRows.length;

			// Apply pagination to filtered results
			const skip = (page - 1) * pageSize;
			rows = filteredRows.slice(skip, skip + pageSize);
		} else {
			// Normal flow without post-process filters
			totalRows = await prisma.row.count({
				where: whereClause
			});
			
			// Calculate pagination
			const totalPages = Math.ceil(totalRows / pageSize);
			const skip = (page - 1) * pageSize;

			// Execute the main query
			rows = await prisma.row.findMany({
				where: whereClause,
				include: {
					cells: includeCells ? {
								include: {
							column: true
						}
					} : false
				},
				skip,
				take: pageSize,
				orderBy: {
					[sortBy]: sortOrder
				}
			});
		}
		
		logger.info("📊 Query count result", { 
			totalRows, 
			tenantId: String(tenantId), 
			tableId: String(tableId) 
		});

		// Calculate pagination
		const totalPages = Math.ceil(totalRows / pageSize);
		
		logger.info("📋 Query rows result", { 
			rowsCount: rows.length, 
			tenantId: String(tenantId), 
			tableId: String(tableId),
			includeCells,
			hasPostProcessFilters
		});

		// Build pagination info
		const pagination = {
			page,
			pageSize,
			totalRows,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1
		};

		// Cache removed - using direct Prisma queries

		const executionTime = Date.now() - startTime;

		logger.info("✅ Filtered query completed successfully", { 
			tenantId: String(tenantId), 
			tableId: String(tableId), 
			userId: String(userId),
			rowsReturned: rows.length,
			totalRows,
			executionTime,
			cacheHit: false,
			pagination: {
				page,
				pageSize,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1
			}
		});

		return NextResponse.json({
			data: rows,
			pagination,
			filters: convertedFilters,
			appliedFilters: convertedFilters,
			globalSearch: search,
			sortBy,
			sortOrder,
			executionTime,
			cacheHit: false
		});

	} catch (error) {
		logger.error("Error in filtered rows query", error as Error, {
			tenantId: String(tenantId),
			tableId: String(tableId),
			userId: String(userId),
			executionTime: Date.now() - startTime
		});

		return NextResponse.json(
			{ 
				error: "Failed to fetch filtered rows", 
				details: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}
