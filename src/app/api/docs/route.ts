/** @format */

import { NextRequest, NextResponse } from "next/server";

/**
 * API Documentation Endpoint
 * Returns OpenAPI 3.0 specification for the entire API
 */
export async function GET(request: NextRequest) {
	const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
	
	const openApiSpec = {
		openapi: "3.0.3",
		info: {
			title: "Multi-Tenant Platform API",
			description: "Comprehensive API for multi-tenant database management platform",
			version: "1.0.0",
			contact: {
				name: "API Support",
				email: "support@example.com",
			},
			license: {
				name: "MIT",
				url: "https://opensource.org/licenses/MIT",
			},
		},
		servers: [
			{
				url: baseUrl,
				description: "Production server",
			},
			{
				url: "http://localhost:3000",
				description: "Development server",
			},
		],
		security: [
			{
				bearerAuth: [],
			},
			{
				apiKey: [],
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description: "JWT token obtained from authentication endpoints",
				},
				apiKey: {
					type: "apiKey",
					in: "header",
					name: "X-API-Key",
					description: "API key for programmatic access",
				},
			},
			schemas: {
				Error: {
					type: "object",
					properties: {
						error: {
							type: "string",
							description: "Error message",
						},
						code: {
							type: "string",
							description: "Error code",
						},
						details: {
							type: "object",
							description: "Additional error details",
						},
					},
					required: ["error"],
				},
				Success: {
					type: "object",
					properties: {
						success: {
							type: "boolean",
							example: true,
						},
						message: {
							type: "string",
							description: "Success message",
						},
						data: {
							type: "object",
							description: "Response data",
						},
					},
					required: ["success"],
				},
				User: {
					type: "object",
					properties: {
						id: {
							type: "integer",
							description: "User ID",
						},
						email: {
							type: "string",
							format: "email",
							description: "User email address",
						},
						name: {
							type: "string",
							description: "User display name",
						},
						role: {
							type: "string",
							enum: ["ADMIN", "EDITOR", "VIEWER"],
							description: "User role",
						},
						tenantId: {
							type: "integer",
							description: "Associated tenant ID",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "User creation timestamp",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
						},
					},
					required: ["id", "email", "name", "role", "tenantId"],
				},
				Tenant: {
					type: "object",
					properties: {
						id: {
							type: "integer",
							description: "Tenant ID",
						},
						name: {
							type: "string",
							description: "Tenant name",
						},
						slug: {
							type: "string",
							description: "Tenant URL slug",
						},
						subscriptionStatus: {
							type: "string",
							enum: ["active", "canceled", "past_due", "trialing"],
							description: "Subscription status",
						},
						plan: {
							type: "string",
							enum: ["Free", "Pro", "Enterprise"],
							description: "Subscription plan",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Tenant creation timestamp",
						},
					},
					required: ["id", "name", "slug", "plan"],
				},
				Database: {
					type: "object",
					properties: {
						id: {
							type: "integer",
							description: "Database ID",
						},
						name: {
							type: "string",
							description: "Database name",
						},
						description: {
							type: "string",
							description: "Database description",
						},
						tenantId: {
							type: "integer",
							description: "Associated tenant ID",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Database creation timestamp",
						},
					},
					required: ["id", "name", "tenantId"],
				},
				Table: {
					type: "object",
					properties: {
						id: {
							type: "integer",
							description: "Table ID",
						},
						name: {
							type: "string",
							description: "Table name",
						},
						description: {
							type: "string",
							description: "Table description",
						},
						databaseId: {
							type: "integer",
							description: "Associated database ID",
						},
						columns: {
							type: "array",
							items: {
								$ref: "#/components/schemas/Column",
							},
							description: "Table columns",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Table creation timestamp",
						},
					},
					required: ["id", "name", "databaseId"],
				},
				Column: {
					type: "object",
					properties: {
						id: {
							type: "integer",
							description: "Column ID",
						},
						name: {
							type: "string",
							description: "Column name",
						},
						type: {
							type: "string",
							enum: ["TEXT", "NUMBER", "DATE", "BOOLEAN", "EMAIL", "URL", "PHONE"],
							description: "Column data type",
						},
						required: {
							type: "boolean",
							description: "Whether column is required",
						},
						tableId: {
							type: "integer",
							description: "Associated table ID",
						},
					},
					required: ["id", "name", "type", "tableId"],
				},
				Row: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Row ID",
						},
						tableId: {
							type: "integer",
							description: "Associated table ID",
						},
						data: {
							type: "object",
							description: "Row data as key-value pairs",
							additionalProperties: true,
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Row creation timestamp",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
						},
					},
					required: ["id", "tableId", "data"],
				},
			},
		},
		paths: {
			"/api/auth/signin": {
				post: {
					tags: ["Authentication"],
					summary: "User Sign In",
					description: "Authenticate user with email and password",
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										email: {
											type: "string",
											format: "email",
											description: "User email address",
										},
										password: {
											type: "string",
											format: "password",
											description: "User password",
										},
									},
									required: ["email", "password"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Authentication successful",
							content: {
								"application/json": {
									schema: {
										allOf: [
											{ $ref: "#/components/schemas/Success" },
											{
												type: "object",
												properties: {
													data: {
														type: "object",
														properties: {
															user: { $ref: "#/components/schemas/User" },
															token: {
																type: "string",
																description: "JWT access token",
															},
														},
													},
												},
											},
										],
									},
								},
							},
						},
						"401": {
							description: "Authentication failed",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Error" },
								},
							},
						},
					},
				},
			},
			"/api/auth/signout": {
				post: {
					tags: ["Authentication"],
					summary: "User Sign Out",
					description: "Sign out the current user",
					security: [{ bearerAuth: [] }],
					responses: {
						"200": {
							description: "Sign out successful",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Success" },
								},
							},
						},
					},
				},
			},
			"/api/tenants/{tenantId}/databases": {
				get: {
					tags: ["Databases"],
					summary: "List Databases",
					description: "Get all databases for a tenant",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "tenantId",
							in: "path",
							required: true,
							schema: {
								type: "integer",
							},
							description: "Tenant ID",
						},
					],
					responses: {
						"200": {
							description: "List of databases",
							content: {
								"application/json": {
									schema: {
										allOf: [
											{ $ref: "#/components/schemas/Success" },
											{
												type: "object",
												properties: {
													data: {
														type: "array",
														items: { $ref: "#/components/schemas/Database" },
													},
												},
											},
										],
									},
								},
							},
						},
						"403": {
							description: "Access denied",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Error" },
								},
							},
						},
					},
				},
				post: {
					tags: ["Databases"],
					summary: "Create Database",
					description: "Create a new database",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "tenantId",
							in: "path",
							required: true,
							schema: {
								type: "integer",
							},
							description: "Tenant ID",
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: {
											type: "string",
											description: "Database name",
										},
										description: {
											type: "string",
											description: "Database description",
										},
									},
									required: ["name"],
								},
							},
						},
					},
					responses: {
						"201": {
							description: "Database created successfully",
							content: {
								"application/json": {
									schema: {
										allOf: [
											{ $ref: "#/components/schemas/Success" },
											{
												type: "object",
												properties: {
													data: { $ref: "#/components/schemas/Database" },
												},
											},
										],
									},
								},
							},
						},
						"400": {
							description: "Invalid request data",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Error" },
								},
							},
						},
					},
				},
			},
			"/api/tenants/{tenantId}/databases/{databaseId}/tables": {
				get: {
					tags: ["Tables"],
					summary: "List Tables",
					description: "Get all tables in a database",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "tenantId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Tenant ID",
						},
						{
							name: "databaseId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Database ID",
						},
					],
					responses: {
						"200": {
							description: "List of tables",
							content: {
								"application/json": {
									schema: {
										allOf: [
											{ $ref: "#/components/schemas/Success" },
											{
												type: "object",
												properties: {
													data: {
														type: "array",
														items: { $ref: "#/components/schemas/Table" },
													},
												},
											},
										],
									},
								},
							},
						},
					},
				},
				post: {
					tags: ["Tables"],
					summary: "Create Table",
					description: "Create a new table in a database",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "tenantId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Tenant ID",
						},
						{
							name: "databaseId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Database ID",
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: {
											type: "string",
											description: "Table name",
										},
										description: {
											type: "string",
											description: "Table description",
										},
										columns: {
											type: "array",
											items: {
												type: "object",
												properties: {
													name: { type: "string" },
													type: { type: "string" },
													required: { type: "boolean" },
												},
												required: ["name", "type"],
											},
											description: "Table columns",
										},
									},
									required: ["name", "columns"],
								},
							},
						},
					},
					responses: {
						"201": {
							description: "Table created successfully",
							content: {
								"application/json": {
									schema: {
										allOf: [
											{ $ref: "#/components/schemas/Success" },
											{
												type: "object",
												properties: {
													data: { $ref: "#/components/schemas/Table" },
												},
											},
										],
									},
								},
							},
						},
					},
				},
			},
			"/api/tenants/{tenantId}/databases/{databaseId}/tables/{tableId}/rows": {
				get: {
					tags: ["Rows"],
					summary: "List Rows",
					description: "Get all rows in a table with pagination",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "tenantId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Tenant ID",
						},
						{
							name: "databaseId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Database ID",
						},
						{
							name: "tableId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Table ID",
						},
						{
							name: "page",
							in: "query",
							schema: { type: "integer", default: 1 },
							description: "Page number",
						},
						{
							name: "limit",
							in: "query",
							schema: { type: "integer", default: 50 },
							description: "Items per page",
						},
					],
					responses: {
						"200": {
							description: "List of rows with pagination",
							content: {
								"application/json": {
									schema: {
										allOf: [
											{ $ref: "#/components/schemas/Success" },
											{
												type: "object",
												properties: {
													data: {
														type: "array",
														items: { $ref: "#/components/schemas/Row" },
													},
													pagination: {
														type: "object",
														properties: {
															page: { type: "integer" },
															limit: { type: "integer" },
															total: { type: "integer" },
															pages: { type: "integer" },
														},
													},
												},
											},
										],
									},
								},
							},
						},
					},
				},
				post: {
					tags: ["Rows"],
					summary: "Create Row",
					description: "Create a new row in a table",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "tenantId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Tenant ID",
						},
						{
							name: "databaseId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Database ID",
						},
						{
							name: "tableId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Table ID",
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										data: {
											type: "object",
											description: "Row data as key-value pairs",
											additionalProperties: true,
										},
									},
									required: ["data"],
								},
							},
						},
					},
					responses: {
						"201": {
							description: "Row created successfully",
							content: {
								"application/json": {
									schema: {
										allOf: [
											{ $ref: "#/components/schemas/Success" },
											{
												type: "object",
												properties: {
													data: { $ref: "#/components/schemas/Row" },
												},
											},
										],
									},
								},
							},
						},
					},
				},
			},
			"/api/tenants/{tenantId}/analytics": {
				get: {
					tags: ["Analytics"],
					summary: "Get Analytics Data",
					description: "Get analytics data for a tenant",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "tenantId",
							in: "path",
							required: true,
							schema: { type: "integer" },
							description: "Tenant ID",
						},
						{
							name: "period",
							in: "query",
							schema: {
								type: "string",
								enum: ["7d", "30d", "90d", "1y"],
								default: "30d",
							},
							description: "Analytics period",
						},
					],
					responses: {
						"200": {
							description: "Analytics data",
							content: {
								"application/json": {
									schema: {
										allOf: [
											{ $ref: "#/components/schemas/Success" },
											{
												type: "object",
												properties: {
													data: {
														type: "object",
														properties: {
															databases: { type: "integer" },
															tables: { type: "integer" },
															rows: { type: "integer" },
															users: { type: "integer" },
															storage: { type: "number" },
															activity: {
																type: "array",
																items: {
																	type: "object",
																	properties: {
																		date: { type: "string" },
																		actions: { type: "integer" },
																	},
																},
															},
														},
													},
												},
											},
										],
									},
								},
							},
						},
					},
				},
			},
		},
	};

	return NextResponse.json(openApiSpec, {
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
}
