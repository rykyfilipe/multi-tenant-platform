/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { z } from "zod";

// Type definitions
interface TableColumn {
	id: number;
	name: string;
	type: string;
	primary?: boolean;
	referenceTableId?: number;
}

interface FilterCondition {
	columnId: number;
	columnName: string;
	columnType: string;
	operator: string;
	value?: unknown;
	secondValue?: unknown;
}

interface WhereClause {
	tableId: number;
	cells?: {
		some: {
			value: {
				string_contains: string;
			};
		};
	};
	AND?: Record<string, unknown>[];
}

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
							value: z.unknown().optional().nullable(),
							secondValue: z.unknown().optional().nullable(),
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
	private whereClause: WhereClause;
	private tableColumns: TableColumn[];
	private tableId: number;

	constructor(tableId: number, tableColumns: TableColumn[]) {
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
	addColumnFilters(filters: FilterCondition[]): this {
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
	private isValidFilter(filter: FilterCondition): boolean {
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
	private validateFilterValues(
		filter: FilterCondition,
		columnType: string,
	): boolean {
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
						value !== null &&
						value !== undefined &&
						!isNaN(parseFloat(value as string))
					);
				}
				if (["between", "not_between"].includes(operator)) {
					return (
						value !== null &&
						value !== undefined &&
						secondValue !== null &&
						secondValue !== undefined &&
						!isNaN(parseFloat(value as string)) &&
						!isNaN(parseFloat(secondValue as string))
					);
				}
				break;
			case "boolean":
				return true; // Boolean operators don't have specific value validation
			case "date":
			case "datetime":
				if (["equals", "before", "after"].includes(operator)) {
					return Boolean(value && !isNaN(new Date(value as string).getTime()));
				}
				if (["between", "not_between"].includes(operator)) {
					return Boolean(
						value &&
							secondValue &&
							!isNaN(new Date(value as string).getTime()) &&
							!isNaN(new Date(secondValue as string).getTime()),
					);
				}
				break;
			case "reference":
				return true; // Reference operators don't have specific value validation
			case "customArray":
				return true; // CustomArray operators don't have specific value validation
			default:
				return true;
		}

		return true;
	}

	// Construiește condiția pentru un filtru
	private buildFilterCondition(
		filter: FilterCondition,
	): Record<string, unknown> {
		const { columnId, operator, value, secondValue } = filter;
		const column = this.tableColumns.find((col) => col.id === columnId);
		if (!column) return {};

		switch (operator) {
			case "contains":
				return this.buildStringFilter(columnId, "contains", value);
			case "not_contains":
				return this.buildStringFilter(columnId, "not_contains", value);
			case "equals":
				return this.buildEqualsFilter(columnId, value, column.type);
			case "not_equals":
				return this.buildNotEqualsFilter(columnId, value, column.type);
			case "starts_with":
				return this.buildStringFilter(columnId, "starts_with", value);
			case "ends_with":
				return this.buildStringFilter(columnId, "ends_with", value);
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
					column.type,
				);
			case "not_between":
				return this.buildNotBetweenFilter(
					columnId,
					value,
					secondValue,
					column.type,
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
		value: unknown,
		negate: boolean = false,
	): Record<string, unknown> {
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

	private buildRegexFilter(
		columnId: number,
		value: unknown,
	): Record<string, unknown> {
		if (typeof value !== "string") {
			return {};
		}
		return {
			cells: {
				some: {
					columnId: Number(columnId),
					value: {
						string_matches: value.trim(),
					},
				},
			},
		};
	}

	private buildEqualsFilter(
		columnId: number,
		value: unknown,
		columnType: string,
	): Record<string, unknown> {
		if (columnType === "number") {
			return {
				cells: {
					some: {
						columnId: Number(columnId),
						value: { equals: parseFloat(value as string) },
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
						value: { equals: new Date(value as string) },
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
		value: unknown,
		columnType: string,
	): Record<string, unknown> {
		if (columnType === "number") {
			return {
				cells: {
					none: {
						columnId: Number(columnId),
						value: { equals: parseFloat(value as string) },
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
		value: unknown,
	): Record<string, unknown> {
		return {
			cells: {
				some: {
					columnId: Number(columnId),
					value: { [operator]: parseFloat(value as string) },
				},
			},
		};
	}

	private buildBetweenFilter(
		columnId: number,
		minValue: unknown,
		maxValue: unknown,
		columnType: string,
	): Record<string, unknown> {
		if (columnType === "number") {
			return {
				cells: {
					some: {
						columnId: Number(columnId),
						value: {
							gte: parseFloat(minValue as string),
							lte: parseFloat(maxValue as string),
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
							gte: new Date(minValue as string),
							lte: new Date(maxValue as string),
						},
					},
				},
			};
		}
		return {};
	}

	private buildNotBetweenFilter(
		columnId: number,
		minValue: unknown,
		maxValue: unknown,
		columnType: string,
	): Record<string, unknown> {
		if (columnType === "number") {
			return {
				cells: {
					none: {
						columnId: Number(columnId),
						value: {
							gte: parseFloat(minValue as string),
							lte: parseFloat(maxValue as string),
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
							gte: new Date(minValue as string),
							lte: new Date(maxValue as string),
						},
					},
				},
			};
		}
		return {};
	}

	private buildDateFilter(
		columnId: number,
		operator: string,
		value: unknown,
	): Record<string, unknown> {
		return {
			cells: {
				some: {
					columnId: Number(columnId),
					value: { [operator]: new Date(value as string) },
				},
			},
		};
	}

	private buildTodayFilter(columnId: number): Record<string, unknown> {
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

	private buildYesterdayFilter(columnId: number): Record<string, unknown> {
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

	private buildThisWeekFilter(columnId: number): Record<string, unknown> {
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

	private buildThisMonthFilter(columnId: number): Record<string, unknown> {
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

	private buildThisYearFilter(columnId: number): Record<string, unknown> {
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

	private buildEmptyFilter(columnId: number): Record<string, unknown> {
		return {
			cells: {
				none: {
					columnId: Number(columnId),
					value: { not: null },
				},
			},
		};
	}

	private buildNotEmptyFilter(columnId: number): Record<string, unknown> {
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
	getWhereClause(): WhereClause {
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
				// Handle multiple reference values (arrays)
				if (Array.isArray(value)) {
					// Multiple references - join all values
					if (value.length === 0) {
						value = "";
					} else {
						const refValues = value
							.filter((refValue) => refValue != null && refValue !== "")
							.map((refValue) => {
								const refKey = `${col.referenceTableId}-${refValue}`;
								return referenceMap.get(refKey) || refValue;
							});
						value = refValues.join(", ");
					}
				} else {
					// Single reference
					if (value == null || value === "") {
						value = "";
					} else {
						const refKey = `${col.referenceTableId}-${value}`;
						value = referenceMap.get(refKey) || value;
					}
				}
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
			["text", "string", "email", "url", "reference"].includes(column.type) &&
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

			// Handle multiple reference values (arrays)
			let cellValue: string;
			if (Array.isArray(cell.value)) {
				// For reference columns with multiple values, join them
				if (cell.value.length === 0) {
					cellValue = "";
				} else {
					cellValue = cell.value
						.filter((val: any) => val != null && val !== "")
						.join(", ");
				}
			} else {
				cellValue = String(cell.value);
			}

			// Skip empty values in filtering
			if (!cellValue || cellValue.trim() === "") return false;

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
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);

	// Verificare acces tenant
	    const isMember = requireTenantAccess(sessionResult, tenantId);
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
			.filter((col: TableColumn) => col.referenceTableId)
			.map((col: TableColumn) => col.referenceTableId);

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
		const sortedRows = filteredRows.map((row: Record<string, unknown>) => ({
			...row,
			cells: (row.cells as Array<{ column: { order: number } }>).sort(
				(a, b) => {
					return a.column.order - b.column.order;
				},
			),
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
