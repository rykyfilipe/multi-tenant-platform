/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { z } from "zod";

// Schema de validare pentru filtre
const FilterSchema = z.object({
	columnId: z.number().positive(),
	columnName: z.string().min(1),
	columnType: z.string().min(1),
	operator: z.string().min(1),
	value: z.any().optional().nullable(),
	secondValue: z.any().optional().nullable(),
});

const FiltersArraySchema = z.array(FilterSchema);

// Schema de validare pentru parametrii de query
const QueryParamsSchema = z.object({
	page: z.string().transform((val) => Math.max(1, parseInt(val) || 1)),
	pageSize: z
		.string()
		.transform((val) => Math.min(Math.max(1, parseInt(val) || 25), 100)),
	includeCells: z
		.string()
		.optional()
		.transform((val) => val !== "false"),
	globalSearch: z
		.string()
		.optional()
		.transform((val) => val?.trim() || ""),
	filters: z
		.string()
		.optional()
		.transform((val) => {
			if (!val) return [];
			try {
				const parsed = JSON.parse(decodeURIComponent(val));
				return FiltersArraySchema.parse(parsed);
			} catch {
				return [];
			}
		}),
	sortBy: z
		.string()
		.optional()
		.transform((val) => val || "id"),
	sortOrder: z
		.string()
		.optional()
		.transform((val) => (val === "desc" ? "desc" : "asc")),
});

// Tipuri TypeScript
type FilterConfig = z.infer<typeof FilterSchema>;
type QueryParams = z.infer<typeof QueryParamsSchema>;

// Clasa pentru construirea query-urilor Prisma optimizate
class PrismaQueryBuilder {
	private whereClause: any = {};
	private tableColumns: any[] = [];
	private tableId: number;

	constructor(tableId: number, tableColumns: any[]) {
		this.tableId = tableId;
		this.tableColumns = tableColumns;
		this.whereClause = { tableId };
	}

	// Adaugă global search
	addGlobalSearch(searchTerm: string): this {
		if (searchTerm && searchTerm.trim()) {
			this.whereClause.cells = {
				some: {
					value: {
						string_contains: searchTerm.trim(),
					},
				},
			};
		}
		return this;
	}

	// Adaugă filtre pentru coloane
	addColumnFilters(filters: FilterConfig[]): this {
		if (filters.length === 0) {
			return this;
		}

		const validFilters = filters.filter((filter) => this.isValidFilter(filter));

		if (validFilters.length === 0) {
			return this;
		}

		const filterConditions = validFilters.map((filter) =>
			this.buildFilterCondition(filter),
		);
		const nonEmptyConditions = filterConditions.filter(
			(condition) => Object.keys(condition).length > 0,
		);

		if (nonEmptyConditions.length > 0) {
			this.whereClause.AND = nonEmptyConditions;
		}

		return this;
	}

	// Validează un filtru
	private isValidFilter(filter: FilterConfig): boolean {
		if (!filter.columnId || !filter.operator) {
			return false;
		}

		const column = this.tableColumns.find((col) => col.id === filter.columnId);
		if (!column) {
			return false;
		}

		// Verifică dacă operatorul este valid pentru tipul de coloană
		const validOperators = this.getValidOperators(column.type);
		if (!validOperators.includes(filter.operator)) {
			return false;
		}

		// Verifică dacă valorile sunt valide pentru operator
		const isValid = this.validateFilterValues(filter, column.type);
		return isValid;
	}

	// Obține operatorii valizi pentru un tip de coloană
	private getValidOperators(columnType: string): string[] {
		switch (columnType) {
			case "text":
			case "string":
			case "email":
			case "url":
				return [
					"contains",
					"not_contains",
					"equals",
					"not_equals",
					"starts_with",
					"ends_with",
					"regex",
					"is_empty",
					"is_not_empty",
				];
			case "number":
			case "integer":
			case "decimal":
				return [
					"equals",
					"not_equals",
					"greater_than",
					"greater_than_or_equal",
					"less_than",
					"less_than_or_equal",
					"between",
					"not_between",
					"is_empty",
					"is_not_empty",
				];
			case "boolean":
				return ["equals", "not_equals", "is_empty", "is_not_empty"];
			case "date":
			case "datetime":
				return [
					"equals",
					"not_equals",
					"before",
					"after",
					"between",
					"not_between",
					"today",
					"yesterday",
					"this_week",
					"this_month",
					"this_year",
					"is_empty",
					"is_not_empty",
				];
			case "reference":
				return ["equals", "not_equals", "is_empty", "is_not_empty"];
			case "customArray":
				return ["equals", "not_equals", "is_empty", "is_not_empty"];
			default:
				return ["equals", "not_equals", "is_empty", "is_not_empty"];
		}
	}

	// Validează valorile unui filtru
	private validateFilterValues(
		filter: FilterConfig,
		columnType: string,
	): boolean {
		const { operator, value, secondValue } = filter;

		// Operatori care nu necesită valori
		const noValueOperators = [
			"today",
			"yesterday",
			"this_week",
			"this_month",
			"this_year",
		];
		if (noValueOperators.includes(operator)) return true;

		// Verificări specifice pentru tipul de coloană
		switch (columnType) {
			case "text":
			case "string":
			case "email":
			case "url":
				if (
					["contains", "equals", "starts_with", "ends_with", "regex"].includes(
						operator,
					)
				) {
					// Allow empty strings for text operators (they will be handled in buildFilterCondition)
					return value !== null && value !== undefined;
				}
				break;
			case "number":
			case "integer":
			case "decimal":
				if (
					[
						"equals",
						"greater_than",
						"greater_than_or_equal",
						"less_than",
						"less_than_or_equal",
					].includes(operator)
				) {
					return (
						value !== null && value !== undefined && !isNaN(parseFloat(value))
					);
				}
				if (["between", "not_between"].includes(operator)) {
					return (
						value !== null &&
						value !== undefined &&
						secondValue !== null &&
						secondValue !== undefined &&
						!isNaN(parseFloat(value)) &&
						!isNaN(parseFloat(secondValue))
					);
				}
				break;
			case "date":
			case "datetime":
				if (["equals", "before", "after"].includes(operator)) {
					return value && !isNaN(new Date(value).getTime());
				}
				if (["between", "not_between"].includes(operator)) {
					return (
						value &&
						secondValue &&
						!isNaN(new Date(value).getTime()) &&
						!isNaN(new Date(secondValue).getTime())
					);
				}
				break;
		}

		return true;
	}

	// Construiește condiția pentru un filtru
	private buildFilterCondition(filter: FilterConfig): any {
		const { columnId, operator, value, secondValue } = filter;
		const column = this.tableColumns.find((col) => col.id === columnId);
		if (!column) return {};

		const columnType = column.type === "reference" ? "text" : column.type;

		switch (operator) {
			// String operators
			case "contains":
				return this.buildStringFilter(columnId, "string_contains", value);
			case "not_contains":
				return this.buildStringFilter(columnId, "string_contains", value, true);
			case "equals":
				return this.buildEqualsFilter(columnId, value, columnType);
			case "not_equals":
				return this.buildNotEqualsFilter(columnId, value, columnType);
			case "starts_with":
				return this.buildStringFilter(columnId, "string_starts_with", value);
			case "ends_with":
				return this.buildStringFilter(columnId, "string_ends_with", value);
			case "regex":
				return this.buildRegexFilter(columnId, value);

			// Numeric operators
			case "greater_than":
				return this.buildNumericFilter(columnId, "gt", value);
			case "greater_than_or_equal":
				return this.buildNumericFilter(columnId, "gte", value);
			case "less_than":
				return this.buildNumericFilter(columnId, "lt", value);
			case "less_than_or_equal":
				return this.buildNumericFilter(columnId, "lte", value);
			case "between":
				return this.buildBetweenFilter(
					columnId,
					value,
					secondValue,
					columnType,
				);
			case "not_between":
				return this.buildNotBetweenFilter(
					columnId,
					value,
					secondValue,
					columnType,
				);

			// Date operators
			case "before":
				return this.buildDateFilter(columnId, "lt", value);
			case "after":
				return this.buildDateFilter(columnId, "gt", value);
			case "today":
				return this.buildTodayFilter(columnId);
			case "yesterday":
				return this.buildYesterdayFilter(columnId);
			case "this_week":
				return this.buildThisWeekFilter(columnId);
			case "this_month":
				return this.buildThisMonthFilter(columnId);
			case "this_year":
				return this.buildThisYearFilter(columnId);

			// Empty/not empty operators
			case "is_empty":
				return this.buildEmptyFilter(columnId);
			case "is_not_empty":
				return this.buildNotEmptyFilter(columnId);

			default:
				return {};
		}
	}

	// Helper methods pentru construirea filtrelor
	private buildStringFilter(
		columnId: number,
		operator: string,
		value: any,
		negate: boolean = false,
	): any {
		// Skip filters with empty values
		if (!value || value.toString().trim() === "") {
			return {};
		}

		const trimmedValue = value.toString().trim();

		// For string operations on JSON fields, we need to use raw SQL
		// This will be handled in the main query using Prisma.sql
		return {
			cells: {
				[negate ? "none" : "some"]: {
					columnId: Number(columnId),
					value: {
						not: null, // Ensure the cell has a value
					},
				},
			},
		};
	}

	private buildRegexFilter(columnId: number, value: any): any {
		return {
			cells: {
				some: {
					columnId: Number(columnId),
					value: {
						string_matches: value.toString().trim(),
					},
				},
			},
		};
	}

	private buildEqualsFilter(
		columnId: number,
		value: any,
		columnType: string,
	): any {
		if (columnType === "number") {
			return {
				cells: {
					some: {
						columnId: Number(columnId),
						value: { equals: parseFloat(value) },
					},
				},
			};
		}
		if (columnType === "boolean") {
			return {
				cells: {
					some: {
						columnId: Number(columnId),
						value: { equals: value === "true" || value === true },
					},
				},
			};
		}
		if (columnType === "date" || columnType === "datetime") {
			return {
				cells: {
					some: {
						columnId: Number(columnId),
						value: { equals: new Date(value) },
					},
				},
			};
		}
		// Skip filters with empty values for text columns
		if (!value || value.toString().trim() === "") {
			return {};
		}

		return {
			cells: {
				some: {
					columnId: Number(columnId),
					value: { equals: value.toString().trim() },
				},
			},
		};
	}

	private buildNotEqualsFilter(
		columnId: number,
		value: any,
		columnType: string,
	): any {
		if (columnType === "number") {
			return {
				cells: {
					none: {
						columnId: Number(columnId),
						value: { equals: parseFloat(value) },
					},
				},
			};
		}
		// Skip filters with empty values for text columns
		if (!value || value.toString().trim() === "") {
			return {};
		}

		return {
			cells: {
				none: {
					columnId: Number(columnId),
					value: { equals: value.toString().trim() },
				},
			},
		};
	}

	private buildNumericFilter(
		columnId: number,
		operator: string,
		value: any,
	): any {
		return {
			cells: {
				some: {
					columnId: Number(columnId),
					value: { [operator]: parseFloat(value) },
				},
			},
		};
	}

	private buildBetweenFilter(
		columnId: number,
		minValue: any,
		maxValue: any,
		columnType: string,
	): any {
		if (columnType === "number") {
			return {
				cells: {
					some: {
						columnId: Number(columnId),
						value: {
							gte: parseFloat(minValue),
							lte: parseFloat(maxValue),
						},
					},
				},
			};
		}
		if (columnType === "date" || columnType === "datetime") {
			return {
				cells: {
					some: {
						columnId: Number(columnId),
						value: {
							gte: new Date(minValue),
							lte: new Date(maxValue),
						},
					},
				},
			};
		}
		return {};
	}

	private buildNotBetweenFilter(
		columnId: number,
		minValue: any,
		maxValue: any,
		columnType: string,
	): any {
		if (columnType === "number") {
			return {
				cells: {
					none: {
						columnId: Number(columnId),
						value: {
							gte: parseFloat(minValue),
							lte: parseFloat(maxValue),
						},
					},
				},
			};
		}
		if (columnType === "date" || columnType === "datetime") {
			return {
				cells: {
					none: {
						columnId: Number(columnId),
						value: {
							gte: new Date(minValue),
							lte: new Date(maxValue),
						},
					},
				},
			};
		}
		return {};
	}

	private buildDateFilter(columnId: number, operator: string, value: any): any {
		return {
			cells: {
				some: {
					columnId: Number(columnId),
					value: { [operator]: new Date(value) },
				},
			},
		};
	}

	private buildTodayFilter(columnId: number): any {
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
					columnId: Number(columnId),
					value: {
						gte: startOfDay,
						lte: endOfDay,
					},
				},
			},
		};
	}

	private buildYesterdayFilter(columnId: number): any {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const startOfDay = new Date(
			yesterday.getFullYear(),
			yesterday.getMonth(),
			yesterday.getDate(),
		);
		const endOfDay = new Date(
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
					columnId: Number(columnId),
					value: {
						gte: startOfDay,
						lte: endOfDay,
					},
				},
			},
		};
	}

	private buildThisWeekFilter(columnId: number): any {
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
						gte: startOfWeek,
						lte: endOfWeek,
					},
				},
			},
		};
	}

	private buildThisMonthFilter(columnId: number): any {
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
					columnId: Number(columnId),
					value: {
						gte: startOfMonth,
						lte: endOfMonth,
					},
				},
			},
		};
	}

	private buildThisYearFilter(columnId: number): any {
		const currentYear = new Date().getFullYear();
		const startOfYear = new Date(currentYear, 0, 1);
		const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

		return {
			cells: {
				some: {
					columnId: Number(columnId),
					value: {
						gte: startOfYear,
						lte: endOfYear,
					},
				},
			},
		};
	}

	private buildEmptyFilter(columnId: number): any {
		return {
			cells: {
				none: {
					columnId: Number(columnId),
					value: { not: null },
				},
			},
		};
	}

	private buildNotEmptyFilter(columnId: number): any {
		return {
			cells: {
				some: {
					columnId: Number(columnId),
					value: { not: null },
				},
			},
		};
	}

	// Returnează clauza where finală
	getWhereClause(): any {
		return this.whereClause;
	}
}

// Function to apply string filters that couldn't be handled by Prisma
async function applyStringFilters(
	rows: any[],
	filters: FilterConfig[],
	tableColumns: any[],
): Promise<any[]> {
	const stringFilters = filters.filter((filter) => {
		const column = tableColumns.find((col) => col.id === filter.columnId);
		if (!column) return false;

		return (
			["text", "string", "email", "url"].includes(column.type) &&
			["starts_with", "ends_with", "contains", "not_contains"].includes(
				filter.operator,
			)
		);
	});

	if (stringFilters.length === 0) return rows;

	return rows.filter((row) => {
		return stringFilters.every((filter) => {
			const cell = row.cells?.find((c: any) => c.columnId === filter.columnId);
			if (!cell || !cell.value) return false;

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
				default:
					return true;
			}
		});
	});
}

// GET endpoint pentru rânduri filtrate cu filtrare completă pe server
export async function GET(
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

	console.log("userId", userId);
	console.log("tenantId", tenantId);
	console.log("sessionResult", sessionResult);

	// Verificare acces tenant
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
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

		// Parsare și validare parametri query
		const url = new URL(request.url);
		const queryParams = {
			page: url.searchParams.get("page") || "1",
			pageSize: url.searchParams.get("pageSize") || "25",
			includeCells: url.searchParams.get("includeCells") || "true",
			globalSearch: url.searchParams.get("globalSearch") || "",
			filters: url.searchParams.get("filters") || "[]",
			sortBy: url.searchParams.get("sortBy") || "id",
			sortOrder: url.searchParams.get("sortOrder") || "asc",
		};

		// Validare parametri cu Zod
		const validatedParams = QueryParamsSchema.parse(queryParams);

		// Obține coloanele tabelului pentru validare filtre
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

		// Construiește query-ul Prisma optimizat
		const queryBuilder = new PrismaQueryBuilder(Number(tableId), tableColumns);

		queryBuilder
			.addGlobalSearch(validatedParams.globalSearch)
			.addColumnFilters(validatedParams.filters);

		const whereClause = queryBuilder.getWhereClause();

		// Obține numărul total de rânduri pentru paginare
		const totalRows = await prisma.row.count({
			where: whereClause,
		});

		// Construiește clauza de sortare
		let orderByClause: any = {};
		if (validatedParams.sortBy === "id") {
			orderByClause.id = validatedParams.sortOrder;
		} else if (validatedParams.sortBy === "createdAt") {
			orderByClause.createdAt = validatedParams.sortOrder;
		} else {
			// Sortare implicită după ID
			orderByClause.id = "asc";
		}

		// Query optimizat cu filtrare și paginare
		const rows = await prisma.row.findMany({
			where: whereClause,
			include: {
				cells: validatedParams.includeCells
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
			skip: (validatedParams.page - 1) * validatedParams.pageSize,
			take: validatedParams.pageSize,
		});

		// Apply string filters that couldn't be handled by Prisma
		let filteredRows = rows;
		if (validatedParams.filters.length > 0) {
			filteredRows = await applyStringFilters(
				rows,
				validatedParams.filters,
				tableColumns,
			);
		}

		// Sortare coloane după ordine în aplicație
		const sortedRows = validatedParams.includeCells
			? filteredRows.map((row: any) => ({
					...row,
					cells: row.cells.sort((a: any, b: any) => {
						const cellA = a as any;
						const cellB = b as any;
						return cellA.column.order - cellB.column.order;
					}),
			  }))
			: filteredRows;

		// Folosim totalRows calculat înainte de paginare pentru calculul corect al totalPages
		// Nu recalculăm totalRows după filtrarea string, deoarece aceasta afectează doar pagina curentă
		const totalPages = Math.ceil(totalRows / validatedParams.pageSize);

		// Răspuns optimizat cu informații complete
		return NextResponse.json({
			data: sortedRows,
			pagination: {
				page: validatedParams.page,
				pageSize: validatedParams.pageSize,
				totalRows: totalRows,
				totalPages,
				hasNext: validatedParams.page < totalPages,
				hasPrev: validatedParams.page > 1,
			},
			filters: {
				applied:
					validatedParams.filters.length > 0 ||
					validatedParams.globalSearch !== "",
				globalSearch: validatedParams.globalSearch,
				columnFilters: validatedParams.filters,
				validFiltersCount: validatedParams.filters.length,
			},
			performance: {
				queryTime: Date.now(), // Pentru tracking performanță
				filteredRows: totalRows,
				originalTableSize: await prisma.row.count({
					where: { tableId: Number(tableId) },
				}),
			},
		});
	} catch (error) {
		console.error("Error fetching filtered rows:", error);

		// Răspuns de eroare detaliat pentru debugging
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Invalid query parameters",
					details: error.errors,
					code: "VALIDATION_ERROR",
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Failed to fetch filtered rows",
				code: "INTERNAL_ERROR",
			},
			{ status: 500 },
		);
	}
}
