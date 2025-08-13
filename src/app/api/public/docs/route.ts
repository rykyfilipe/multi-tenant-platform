/** @format */

import {
	validateApiToken,
	createApiSuccessResponse,
	createApiErrorResponse,
	logApiSecurityEvent,
} from "@/lib/api-security";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Extract and validate token (optional for documentation)
		const token = request.headers.get("Authorization")?.split(" ")[1];
		let userId: number | undefined;

		if (token) {
			const tokenValidation = await validateApiToken(token);
			if (tokenValidation.isValid) {
				userId = tokenValidation.userId;
			}
		}

		// Log access
		logApiSecurityEvent("api_docs_access", {
			userId,
			action: "read",
		});

		// Comprehensive API documentation
		const apiDocs = {
			version: "1.0.0",
			title: "YDV Public API Documentation",
			description:
				"Complete API reference for the YDV multi-tenant data management platform",
			baseUrl: `${request.nextUrl.origin}/api/public`,
			authentication: {
				type: "Bearer Token",
				description:
					"All API requests require a valid API token in the Authorization header",
				example: "Authorization: Bearer YOUR_API_TOKEN",
				scopes: {
					"tables:read": "Read access to public tables and their data",
					"rows:write": "Create, update, and delete rows in public tables",
					"tables:write": "Create and modify public tables (admin only)",
				},
			},
			endpoints: {
				"GET /tables": {
					description:
						"List all public tables accessible to the authenticated user",
					authentication: "Required",
					scopes: ["tables:read"],
					parameters: "None",
					response: {
						example: {
							data: [
								{
									id: 1,
									name: "Products",
									description: "Product catalog",
									isPublic: true,
									createdAt: "2025-01-01T00:00:00Z",
									databaseId: 1,
									_count: {
										columns: 5,
										rows: 100,
									},
								},
							],
							metadata: {
								totalTables: 1,
								tenantId: 1,
							},
						},
					},
				},
				"GET /tables/{tableId}": {
					description:
						"Get detailed information about a specific public table including its schema and data",
					authentication: "Required",
					scopes: ["tables:read"],
					parameters: {
						path: {
							tableId: "Numeric ID of the table",
						},
						query: {
							page: "Page number (default: 1, max: 1000)",
							pageSize: "Items per page (default: 25, max: 100)",
						},
					},
					response: {
						example: {
							data: {
								id: 1,
								name: "Products",
								description: "Product catalog",
								databaseId: 1,
								columns: [
									{
										id: 1,
										name: "name",
										type: "string",
										required: true,
										primary: false,
										order: 0,
									},
								],
								rows: [
									{
										id: 1,
										createdAt: "2025-01-01T00:00:00Z",
										name: "Sample Product",
									},
								],
								pagination: {
									page: 1,
									pageSize: 25,
									totalRows: 100,
									totalPages: 4,
									hasNextPage: true,
									hasPreviousPage: false,
								},
							},
						},
					},
				},
				"POST /tables/{tableId}/rows": {
					description: "Create a new row in a public table",
					authentication: "Required",
					scopes: ["rows:write"],
					parameters: {
						path: {
							tableId: "Numeric ID of the table",
						},
						body: "JSON object with column names as keys and values matching the column types",
					},
					response: {
						example: {
							data: {
								name: "New Product",
								price: 29.99,
								category: "Electronics",
							},
						},
					},
				},
				"PATCH /tables/{tableId}/rows/{rowId}": {
					description: "Update an existing row in a public table",
					authentication: "Required",
					scopes: ["rows:write"],
					parameters: {
						path: {
							tableId: "Numeric ID of the table",
							rowId: "Numeric ID of the row",
						},
						body: "JSON object with column names as keys and new values",
					},
					response: {
						example: {
							data: {
								name: "Updated Product",
								price: 39.99,
								category: "Electronics",
							},
						},
					},
				},
				"DELETE /tables/{tableId}/rows/{rowId}": {
					description: "Delete a row from a public table",
					authentication: "Required",
					scopes: ["rows:write"],
					parameters: {
						path: {
							tableId: "Numeric ID of the table",
							rowId: "Numeric ID of the row",
						},
					},
					response: {
						example: {
							status: 200,
						},
					},
				},
			},
			dataTypes: {
				string: "Text data, max 10KB",
				text: "Long text data, max 10KB",
				number: "Numeric data (integers and decimals)",
				boolean: "True/false values",
				date: "ISO 8601 date strings",
				reference: "Numeric ID referencing another table row",
				customArray: "Predefined list of allowed values",
			},
			rateLimiting: {
				description: "API requests are rate-limited to ensure fair usage",
				limits: {
					"tables:read": "100 requests per minute per token",
					"rows:write": "100 requests per minute per token",
					general: "1000 requests per minute per IP",
				},
				headers: {
					"X-RateLimit-Limit": "Maximum requests per window",
					"X-RateLimit-Remaining": "Remaining requests in current window",
					"X-RateLimit-Reset": "When the rate limit resets",
				},
			},
			errorHandling: {
				description: "All errors follow a consistent format",
				format: {
					error: "Human-readable error message",
					timestamp: "ISO 8601 timestamp of when the error occurred",
					details: "Additional error details when available",
				},
				statusCodes: {
					400: "Bad Request - Invalid parameters or data",
					401: "Unauthorized - Missing or invalid authentication",
					403: "Forbidden - Insufficient permissions",
					404: "Not Found - Resource doesn't exist",
					413: "Payload Too Large - Request exceeds size limits",
					429: "Too Many Requests - Rate limit exceeded",
					500: "Internal Server Error - Server-side error",
				},
			},
			bestPractices: [
				"Always include proper error handling in your applications",
				"Use pagination for large datasets to improve performance",
				"Cache responses when appropriate to reduce API calls",
				"Validate data before sending to the API",
				"Monitor your API usage and stay within rate limits",
				"Use HTTPS for all API requests in production",
				"Store API tokens securely and never expose them in client-side code",
			],
			support: {
				documentation: `${request.nextUrl.origin}/docs/api`,
				help: `${request.nextUrl.origin}/docs/help`,
				contact: `${request.nextUrl.origin}/#contact`,
			},
		};

		return createApiSuccessResponse(apiDocs, 200, {
			cacheControl: "public, max-age=3600", // 1 hour cache
			requestId: request.headers.get("X-Request-ID"),
		});
	} catch (error) {
		console.error("Error generating API documentation:", error);

		logApiSecurityEvent("api_error", {
			error: error instanceof Error ? error.message : "Unknown error",
			path: request.nextUrl.pathname,
		});

		return createApiErrorResponse("Internal server error", 500);
	}
}
