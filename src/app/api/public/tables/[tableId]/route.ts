/** @format */

import prisma from "@/lib/prisma";
import { verifyPublicToken, getPublicUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tableId: string }> },
) {
	const isValid = await verifyPublicToken(request);
	if (!isValid) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getPublicUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	try {
		const token = await prisma.apiToken.findFirst({
			where: { userId: userId },
			select: { scopes: true },
		});

		if (!token || !token.scopes.includes("tables:read")) {
			return NextResponse.json(
				{ error: "Forbidden: Insufficient permissions" },
				{ status: 403 },
			);
		}

		const { tableId } = await params;

		// Get pagination parameters
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const pageSize = parseInt(url.searchParams.get("pageSize") || "25");
		const validPage = Math.max(1, page);
		const validPageSize = Math.min(Math.max(1, pageSize), 100);
		const skip = (validPage - 1) * validPageSize;

		// First, get table with columns only
		const table = await prisma.table.findUnique({
			where: {
				id: parseInt(tableId),
				isPublic: true, // Doar tabelele publice
			},
			include: {
				columns: {
					orderBy: {
						order: "asc",
					},
				},
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table not found or not public" },
				{ status: 404 },
			);
		}

		// Get total count for pagination
		const totalRows = await prisma.row.count({
			where: { tableId: parseInt(tableId) },
		});

		console.log(
			`DEBUG: Table ${tableId} has ${totalRows} total rows, page=${validPage}, pageSize=${validPageSize}, skip=${skip}`,
		);

		// Get paginated rows with cells
		const rows = await prisma.row.findMany({
			where: { tableId: parseInt(tableId) },
			include: {
				cells: {
					include: {
						column: true,
					},
				},
			},
			orderBy: { createdAt: "asc" },
			skip,
			take: validPageSize,
		});

		console.log(`DEBUG: Found ${rows.length} rows for current page`);

		// Optimized column mapping
		const columnMap = new Map<number, string>();
		const columnTypeMap = new Map<number, string>();
		for (const column of table.columns) {
			columnMap.set(column.id, column.name);
			columnTypeMap.set(column.id, column.type);
		}

		// Găsim cheia primară a tabelului
		const primaryKeyColumn = table.columns.find((col) => col.primary);

		// Optimized row transformation - no Promise.all needed since no async operations
		const transformedRows = rows.map((row) => {
			const rowData: Record<string, any> = {
				id: row.id,
				createdAt: row.createdAt,
			};

			// Process cells efficiently
			for (const cell of row.cells) {
				const columnName = columnMap.get(cell.columnId);
				if (columnName) {
					rowData[columnName] = cell.value;
				}
			}

			return rowData;
		});

		// Structură user-friendly with pagination metadata
		const result = {
			id: table.id,
			name: table.name,
			description: table.description,
			databaseId: table.databaseId,
			rows: transformedRows,
			pagination: {
				page: validPage,
				pageSize: validPageSize,
				totalRows,
				totalPages: Math.ceil(totalRows / validPageSize),
				hasNextPage: validPage < Math.ceil(totalRows / validPageSize),
				hasPreviousPage: validPage > 1,
			},
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching table:", error);
		return NextResponse.json(
			{ error: "Failed to fetch table" },
			{ status: 500 },
		);
	}
}
