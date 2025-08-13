/** @format */

import prisma from "@/lib/prisma";
import { 
  validateApiToken, 
  checkApiPermissions, 
  createApiSuccessResponse, 
  createApiErrorResponse,
  sanitizeApiInput,
  validateRequestSize,
  logApiSecurityEvent
} from "@/lib/api-security";
import { enhancedCachedOperations } from "@/lib/api-cache";
import { NextRequest, NextResponse } from "next/server";
import { API_VALIDATION_SCHEMAS } from "@/lib/api-security";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tableId: string }> },
) {
	const startTime = Date.now();
	
	try {
		// Validate request size
		if (!validateRequestSize(request)) {
			return createApiErrorResponse(
				"Request too large",
				413,
				{ maxSize: "10MB" }
			);
		}

		// Extract and validate token
		const token = request.headers.get("Authorization")?.split(" ")[1];
		if (!token) {
			return createApiErrorResponse("Missing authorization token", 401);
		}

		const tokenValidation = await validateApiToken(token);
		if (!tokenValidation.isValid) {
			logApiSecurityEvent("invalid_token", { error: tokenValidation.error });
			return createApiErrorResponse(
				tokenValidation.error || "Invalid token",
				401
			);
		}

		const { userId, scopes } = tokenValidation;

		// Validate required scopes
		if (!scopes?.includes("tables:read")) {
			logApiSecurityEvent("insufficient_scopes", { 
				userId, 
				requiredScopes: ["tables:read"],
				userScopes: scopes 
			});
			return createApiErrorResponse(
				"Forbidden: Insufficient permissions",
				403,
				{ requiredScopes: ["tables:read"] }
			);
		}

		// Parse and validate parameters
		const { tableId } = await params;
		const validatedTableId = API_VALIDATION_SCHEMAS.tableId.safeParse(tableId);
		if (!validatedTableId.success) {
			return createApiErrorResponse(
				"Invalid table ID",
				400,
				{ details: validatedTableId.error.errors }
			);
		}

		// Parse pagination parameters
		const url = new URL(request.url);
		const paginationParams = API_VALIDATION_SCHEMAS.pagination.safeParse({
			page: url.searchParams.get("page"),
			pageSize: url.searchParams.get("pageSize"),
		});

		if (!paginationParams.success) {
			return createApiErrorResponse(
				"Invalid pagination parameters",
				400,
				{ details: paginationParams.error.errors }
			);
		}

		const { page, pageSize } = paginationParams.data;
		const skip = (page - 1) * pageSize;

		// Check permissions
		const permissions = await checkApiPermissions(userId!, validatedTableId.data, ["tables:read"]);
		if (!permissions.hasAccess) {
			logApiSecurityEvent("access_denied", { 
				userId, 
				tableId: validatedTableId.data,
				error: permissions.error 
			});
			return createApiErrorResponse(
				permissions.error || "Access denied",
				403
			);
		}

		// Get table schema from cache
		const table = await enhancedCachedOperations.getTableSchema(validatedTableId.data);
		if (!table) {
			return createApiErrorResponse(
				"Table not found",
				404
			);
		}

		// Check if table is public
		if (!table.isPublic) {
			logApiSecurityEvent("private_table_access_attempt", { 
				userId, 
				tableId: validatedTableId.data 
			});
			return createApiErrorResponse(
				"Table not found or not public",
				404
			);
		}

		// Get total count and rows in parallel for better performance
		const [totalRows, rows] = await Promise.all([
			prisma.row.count({
				where: { tableId: validatedTableId.data },
			}),
			prisma.row.findMany({
				where: { tableId: validatedTableId.data },
				include: {
					cells: {
						include: {
							column: true,
						},
					},
				},
				orderBy: { createdAt: "asc" },
				skip,
				take: pageSize,
			}),
		]);

		// Optimized column mapping
		const columnMap = new Map<number, { name: string; type: string }>();
		for (const column of table.columns) {
			columnMap.set(column.id, { name: column.name, type: column.type });
		}

		// Transform rows efficiently
		const transformedRows = rows.map((row: any) => {
			const rowData: Record<string, any> = {
				id: row.id,
				createdAt: row.createdAt,
			};

			// Process cells efficiently
			for (const cell of row.cells) {
				const column = columnMap.get(cell.columnId);
				if (column) {
					rowData[column.name] = cell.value;
				}
			}

			return rowData;
		});

		// Prepare response data
		const result = {
			id: table.id,
			name: table.name,
			description: table.description,
			databaseId: table.databaseId,
			columns: table.columns.map((col: any) => ({
				id: col.id,
				name: col.name,
				type: col.type,
				required: col.required,
				primary: col.primary,
				order: col.order,
			})),
			rows: transformedRows,
			pagination: {
				page,
				pageSize,
				totalRows,
				totalPages: Math.ceil(totalRows / pageSize),
				hasNextPage: page < Math.ceil(totalRows / pageSize),
				hasPreviousPage: page > 1,
			},
		};

		// Log successful access
		logApiSecurityEvent("table_access", { 
			userId, 
			tableId: validatedTableId.data,
			action: "read",
			duration: Date.now() - startTime
		});

		// Return success response with security headers
		return createApiSuccessResponse(result, 200, {
			cacheControl: "public, max-age=300", // 5 minutes cache
			requestId: request.headers.get("X-Request-ID"),
		});

	} catch (error) {
		console.error("Error fetching table:", error);
		
		// Log error for security monitoring
		logApiSecurityEvent("api_error", { 
			error: error instanceof Error ? error.message : "Unknown error",
			tableId: params ? parseInt((await params).tableId) : undefined,
			path: request.nextUrl.pathname
		});

		return createApiErrorResponse(
			"Internal server error",
			500
		);
	}
}
