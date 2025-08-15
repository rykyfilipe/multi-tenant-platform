/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateJwtToken } from "@/lib/api-security";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tableId: string }> },
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
		const tokenData = await validateJwtToken(token);

		if (!tokenData.isValid) {
			return NextResponse.json(
				{ error: "Invalid or expired JWT token" },
				{ status: 401 },
			);
		}

		if (!tokenData.userId) {
			return NextResponse.json(
				{ error: "Invalid token data" },
				{ status: 401 },
			);
		}

		const tableId = parseInt((await params).tableId);
		if (isNaN(tableId)) {
			return NextResponse.json({ error: "Invalid table ID" }, { status: 400 });
		}

		// Get user to extract tenant ID for security
		const user = await prisma.user.findUnique({
			where: { id: tokenData.userId },
			select: { tenantId: true },
		});

		if (!user || !user.tenantId) {
			return NextResponse.json(
				{ error: "User not associated with any tenant" },
				{ status: 403 },
			);
		}

		// Verify table belongs to user's tenant
		const table = await prisma.table.findFirst({
			where: {
				id: tableId,
				database: {
					tenantId: user.tenantId,
				},
			},
			select: { id: true },
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = (page - 1) * limit;
		const filtersParam = searchParams.get("filters");
		const sortBy = searchParams.get("sortBy");
		const sortOrder = searchParams.get("sortOrder") || "asc";

		// Parse filters if provided
		let filters: Record<string, any> = {};
		if (filtersParam) {
			try {
				filters = JSON.parse(filtersParam);
			} catch (error) {
				return NextResponse.json(
					{ error: "Invalid filters format. Must be valid JSON" },
					{ status: 400 },
				);
			}
		}

		// Build where clause for filtering
		let whereClause: any = { tableId };

		// Apply filters if any
		if (Object.keys(filters).length > 0) {
			// Get table columns to validate filter fields
			const tableColumns = await prisma.column.findMany({
				where: { tableId },
				select: { id: true, name: true, type: true },
			});

			const columnNames = tableColumns.map((col: any) => col.name);
			const validFilters: Record<string, any> = {};

			// Process each filter
			for (const [columnName, filterConfig] of Object.entries(filters)) {
				if (!columnNames.includes(columnName)) {
					continue; // Skip invalid column names
				}

				const config = filterConfig as any;
				const { operator, value } = config;

				if (!operator || value === undefined) {
					continue;
				}

				// Build filter condition based on operator
				switch (operator) {
					case "equals":
						validFilters[columnName] = { equals: value };
						break;
					case "not_equals":
						validFilters[columnName] = { not: value };
						break;
					case "contains":
						validFilters[columnName] = { contains: value, mode: "insensitive" };
						break;
					case "not_contains":
						validFilters[columnName] = {
							not: { contains: value, mode: "insensitive" },
						};
						break;
					case "starts_with":
						validFilters[columnName] = {
							startsWith: value,
							mode: "insensitive",
						};
						break;
					case "ends_with":
						validFilters[columnName] = { endsWith: value, mode: "insensitive" };
						break;
					case "gt":
						validFilters[columnName] = { gt: value };
						break;
					case "gte":
						validFilters[columnName] = { gte: value };
						break;
					case "lt":
						validFilters[columnName] = { lt: value };
						break;
					case "lte":
						validFilters[columnName] = { lte: value };
						break;
					case "between":
						if (Array.isArray(value) && value.length === 2) {
							validFilters[columnName] = { gte: value[0], lte: value[1] };
						}
						break;
					case "in":
						if (Array.isArray(value)) {
							validFilters[columnName] = { in: value };
						}
						break;
					case "not_in":
						if (Array.isArray(value)) {
							validFilters[columnName] = { notIn: value };
						}
						break;
					case "is_null":
						if (value === true) {
							validFilters[columnName] = null;
						}
						break;
					case "is_not_null":
						if (value === true) {
							validFilters[columnName] = { not: null };
						}
						break;
				}
			}

			// Apply filters to cells
			if (Object.keys(validFilters).length > 0) {
				whereClause.cells = {
					some: {
						column: {
							name: { in: Object.keys(validFilters) },
						},
						value: validFilters,
					},
				};
			}
		}

		// Build order by clause - default to createdAt
		let orderBy: any = { createdAt: "desc" };
		let needsPostSorting = false;
		let sortColumnId: string | null = null;

		if (sortBy) {
			// Validate sort column exists and get its ID
			const sortColumn = await prisma.column.findFirst({
				where: { tableId, name: sortBy },
				select: { id: true, name: true },
			});

			if (sortColumn) {
				sortColumnId = sortColumn.id;
				// For dynamic columns, we'll need to sort after fetching
				needsPostSorting = true;
			}
		}

		// Get rows from the table with filtering and pagination
		const [rows, totalCount] = await Promise.all([
			prisma.row.findMany({
				where: whereClause,
				select: {
					id: true,
					createdAt: true,
					updatedAt: true,
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
				},
				orderBy: orderBy,
				// Remove skip/take for now to sort all rows properly
				// We'll apply pagination after sorting
			}),
			prisma.row.count({
				where: whereClause,
			}),
		]);

		// Transform rows to a more API-friendly format
		let transformedRows = rows.map((row: any) => {
			const rowData: any = {
				id: row.id,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
			};

			// Convert cells to key-value pairs
			row.cells.forEach((cell: any) => {
				rowData[cell.column.name] = cell.value;
			});

			return rowData;
		});

		// Apply sorting if needed
		if (needsPostSorting && sortColumnId && sortBy) {
			transformedRows.sort((a: any, b: any) => {
				const aValue = a[sortBy] || "";
				const bValue = b[sortBy] || "";

				// Handle numeric values
				const aNum = parseFloat(aValue);
				const bNum = parseFloat(bValue);

				if (!isNaN(aNum) && !isNaN(bNum)) {
					return sortOrder === "desc" ? bNum - aNum : aNum - bNum;
				}

				// Handle string values
				const comparison = aValue.toString().localeCompare(bValue.toString());
				return sortOrder === "desc" ? -comparison : comparison;
			});
		}

		// Apply pagination after sorting
		const startIndex = offset;
		const endIndex = startIndex + limit;
		const paginatedRows = transformedRows.slice(startIndex, endIndex);

		return NextResponse.json({
			success: true,
			data: transformedRows,
			pagination: {
				page,
				limit,
				total: totalCount,
				totalPages: Math.ceil(totalCount / limit),
			},
			filters: filtersParam ? JSON.parse(filtersParam) : null,
			sorting: {
				sortBy: sortBy || "createdAt",
				sortOrder: sortOrder,
			},
		});
	} catch (error) {
		console.error("Error fetching table rows:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tableId: string }> },
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
		const tokenData = await validateJwtToken(token);

		if (!tokenData.isValid) {
			return NextResponse.json(
				{ error: "Invalid or expired JWT token" },
				{ status: 401 },
			);
		}

		if (!tokenData.userId) {
			return NextResponse.json(
				{ error: "Invalid token data" },
				{ status: 401 },
			);
		}

		const tableId = parseInt((await params).tableId);
		if (isNaN(tableId)) {
			return NextResponse.json({ error: "Invalid table ID" }, { status: 400 });
		}

		// Get user to extract tenant ID for security
		const user = await prisma.user.findUnique({
			where: { id: tokenData.userId },
			select: { tenantId: true },
		});

		if (!user || !user.tenantId) {
			return NextResponse.json(
				{ error: "User not associated with any tenant" },
				{ status: 403 },
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
						required: true,
						referenceTableId: true,
					},
				},
				database: {
					select: {
						tenantId: true,
					},
				},
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Verify table belongs to user's tenant
		if (table.database.tenantId !== user.tenantId) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Validate required fields
		const requiredColumns = table.columns.filter((col: any) => col.required);
		for (const col of requiredColumns) {
			if (!(col.name in data)) {
				return NextResponse.json(
					{ error: `Missing required field: ${col.name}` },
					{ status: 400 },
				);
			}
		}

		// Validate reference columns
		const referenceColumns = table.columns.filter(
			(col: any) => col.type === "reference" && col.referenceTableId,
		);
		for (const col of referenceColumns) {
			if (
				data[col.name] !== undefined &&
				data[col.name] !== null &&
				data[col.name] !== ""
			) {
				// For reference columns, validate that the referenced row exists
				const referenceTable = await prisma.table.findUnique({
					where: { id: col.referenceTableId },
					select: {
						id: true,
						name: true,
						columns: {
							select: {
								id: true,
								name: true,
								primary: true,
							},
						},
					},
				});

				if (!referenceTable) {
					return NextResponse.json(
						{ error: `Reference table not found for column: ${col.name}` },
						{ status: 400 },
					);
				}

				// Find the primary key column
				const primaryKeyColumn = referenceTable.columns.find(
					(refCol: any) => refCol.primary,
				);
				if (!primaryKeyColumn) {
					return NextResponse.json(
						{
							error: `Primary key column not found in reference table: ${referenceTable.name}`,
						},
						{ status: 400 },
					);
				}

				// Check if the referenced row exists
				const referencedRow = await prisma.row.findFirst({
					where: {
						tableId: col.referenceTableId,
						cells: {
							some: {
								columnId: primaryKeyColumn.id,
								value: {
									equals: data[col.name],
								},
							},
						},
					},
					select: { id: true },
				});

				if (!referencedRow) {
					return NextResponse.json(
						{
							error: `Reference value "${data[col.name]}" not found in table "${
								referenceTable.name
							}" for column "${col.name}"`,
						},
						{ status: 400 },
					);
				}
			}
		}

		// Create the row
		const row = await prisma.row.create({
			data: {
				tableId,
				cells: {
					create: Object.entries(data).map(([columnName, value]) => {
						const column = table.columns.find(
							(col: any) => col.name === columnName,
						);
						if (!column) {
							throw new Error(`Unknown column: ${columnName}`);
						}
						return {
							columnId: column.id,
							value: value?.toString() || "",
						};
					}),
				},
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
			},
		});

		// Transform the response
		const rowData: any = {
			id: row.id,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};

		row.cells.forEach((cell: any) => {
			rowData[cell.column.name] = cell.value;
		});

		return NextResponse.json(
			{
				success: true,
				data: rowData,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Error creating row:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
