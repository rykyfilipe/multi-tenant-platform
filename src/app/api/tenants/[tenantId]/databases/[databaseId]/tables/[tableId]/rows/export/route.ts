/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";

// Schema de validare pentru parametrii de export
const ExportParamsSchema = z.object({
	format: z.string().default("csv"),
	limit: z
		.string()
		.transform((val) => Math.min(Math.max(1, parseInt(val) || 10000), 100000)),
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
				return z
					.array(
						z.object({
							columnId: z.number().positive(),
							columnName: z.string().min(1),
							columnType: z.string().min(1),
							operator: z.string().min(1),
							value: z.any().optional().nullable(),
							secondValue: z.any().optional().nullable(),
						}),
					)
					.parse(parsed);
			} catch {
				return [];
			}
		}),
});

// Clasa pentru construirea query-urilor Prisma optimizate pentru export
class ExportQueryBuilder {
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
		if (searchTerm) {
			this.whereClause.cells = {
				some: {
					value: {
						string_contains: searchTerm,
					},
				},
			};
		}
		return this;
	}

	// Adaugă filtre pentru coloane
	addColumnFilters(filters: any[]): this {
		if (filters.length === 0) return this;

		const validFilters = filters.filter((filter) => this.isValidFilter(filter));
		if (validFilters.length === 0) return this;

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
	private isValidFilter(filter: any): boolean {
		if (!filter.columnId || !filter.operator) return false;

		const column = this.tableColumns.find((col) => col.id === filter.columnId);
		if (!column) return false;

		const validOperators = this.getValidOperators(column.type);
		if (!validOperators.includes(filter.operator)) return false;

		return this.validateFilterValues(filter, column.type);
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
	private validateFilterValues(filter: any, columnType: string): boolean {
		const { operator, value, secondValue } = filter;

		const noValueOperators = [
			"today",
			"yesterday",
			"this_week",
			"this_month",
			"this_year",
		];
		if (noValueOperators.includes(operator)) return true;

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
	private buildFilterCondition(filter: any): any {
		const { columnId, operator, value, secondValue } = filter;
		const column = this.tableColumns.find((col) => col.id === columnId);
		if (!column) return {};

		const columnType = column.type === "reference" ? "text" : column.type;

		switch (operator) {
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
		if (!value || value.toString().trim() === "") {
			return {};
		}

		// For string operations on JSON fields, we need to use a different approach
		// Since Prisma doesn't support string_starts_with on JSON fields directly
		// We'll use the equals operator with a pattern match approach
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

// Funcție pentru generarea CSV-ului
function generateCSV(rows: any[], columns: any[], tables: any[]): string {
	const referenceMap = new Map<string, any>();

	// Map pentru referințe
	tables.forEach((table: any) => {
		table.rows?.forEach((row: any) => {
			const key = `${table.id}-${row.id}`;
			const primaryCell = row.cells?.find((cell: any) => {
				const col = table.columns?.find((c: any) => c.id === cell.columnId);
				return col?.primary;
			});
			if (primaryCell) {
				referenceMap.set(key, primaryCell.value);
			}
		});
	});

	// Header
	const headers = columns.map((col: any) => col.name);
	const csvRows = [headers.join(";")];

	// Rânduri
	rows.forEach((row: any) => {
		const rowData = columns.map((col: any) => {
			const cell = row.cells?.find((c: any) => c.columnId === col.id);
			if (!cell) return "";

			let value = cell.value;

			// Tipuri speciale
			if (col.type === "reference" && col.referenceTableId) {
				const refKey = `${col.referenceTableId}-${value}`;
				value = referenceMap.get(refKey) || value;
			} else if (col.type === "date" || col.type === "datetime") {
				try {
					value = new Date(value).toLocaleDateString("ro-RO");
				} catch {}
			} else if (col.type === "boolean") {
				value = value === true || value === "true" ? "✓" : "✗";
			} else if (col.type === "customArray" && Array.isArray(value)) {
				value = value.join(", ");
			}

			// Eliminare newline-uri interne
			if (typeof value === "string") {
				value = `"${value}"`;
			}

			return value || "";
		});

		csvRows.push(rowData.join(";"));
	});

	return csvRows.join("\n");
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

// GET endpoint pentru export CSV
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
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	// Verificare acces tenant
	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (!isMember) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

		// Parsare și validare parametri query
		const url = new URL(request.url);
		const queryParams = {
			format: url.searchParams.get("format") || "csv",
			limit: url.searchParams.get("limit") || "10000",
			globalSearch: url.searchParams.get("globalSearch") || "",
			filters: url.searchParams.get("filters") || "[]",
		};

		// Validare parametri cu Zod
		const validatedParams = ExportParamsSchema.parse(queryParams);

		// Verificare format suportat (doar CSV)
		if (validatedParams.format !== "csv") {
			return NextResponse.json(
				{ error: "Only CSV format is supported" },
				{ status: 400 },
			);
		}

		// Obține coloanele tabelului pentru validare filtre
		const tableColumns = await prisma.column.findMany({
			where: { tableId: Number(tableId) },
			select: {
				id: true,
				name: true,
				type: true,
				referenceTableId: true,
				order: true,
				primary: true,
				customOptions: true,
			},
			orderBy: { order: "asc" },
		});

		// Construiește query-ul Prisma optimizat
		const queryBuilder = new ExportQueryBuilder(Number(tableId), tableColumns);

		queryBuilder
			.addGlobalSearch(validatedParams.globalSearch)
			.addColumnFilters(validatedParams.filters);

		const whereClause = queryBuilder.getWhereClause();

		// Obține rândurile pentru export
		const rows = await prisma.row.findMany({
			where: whereClause,
			include: {
				cells: {
					include: {
						column: {
							select: {
								id: true,
								name: true,
								type: true,
								order: true,
								referenceTableId: true,
								primary: true,
								customOptions: true,
							},
						},
					},
				},
			},
			orderBy: { id: "asc" },
			take: validatedParams.limit,
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

		// Obține tabelele de referință pentru procesare
		const referenceTableIds = tableColumns
			.filter((col: any) => col.referenceTableId)
			.map((col: any) => col.referenceTableId);

		const referenceTables = await prisma.table.findMany({
			where: {
				id: { in: referenceTableIds },
			},
			include: {
				columns: {
					select: {
						id: true,
						name: true,
						type: true,
						primary: true,
					},
				},
				rows: {
					include: {
						cells: {
							select: {
								columnId: true,
								value: true,
							},
						},
					},
				},
			},
		});

		// Sortare coloane după ordine în aplicație pentru fiecare rând
		const sortedRows = filteredRows.map((row: any) => ({
			...row,
			cells: row.cells.sort((a: any, b: any) => {
				const cellA = a as any;
				const cellB = b as any;
				return cellA.column.order - cellB.column.order;
			}),
		}));

		// Asigură-te că coloanele sunt sortate corect după ordine
		const sortedColumns = [...tableColumns].sort((a, b) => a.order - b.order);

		// Generează CSV-ul
		const csvContent = generateCSV(sortedRows, sortedColumns, referenceTables);

		// Răspuns cu CSV
		return new NextResponse(csvContent, {
			status: 200,
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": `attachment; filename="table_${tableId}_export_${
					new Date().toISOString().split("T")[0]
				}.csv"`,
				"Cache-Control": "no-cache", // Pentru export-uri dinamice
			},
		});
	} catch (error) {
		console.error("Error exporting rows:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Invalid export parameters",
					details: error.errors,
					code: "VALIDATION_ERROR",
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Failed to export rows",
				code: "INTERNAL_ERROR",
			},
			{ status: 500 },
		);
	}
}
