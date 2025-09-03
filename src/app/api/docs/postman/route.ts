/** @format */

import { NextRequest, NextResponse } from "next/server";

/**
 * Postman Collection Generator
 * Returns a Postman collection for easy API testing
 */
export async function GET(request: NextRequest) {
	const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
	
	const postmanCollection = {
		info: {
			name: "Multi-Tenant Platform API",
			description: "Complete API collection for multi-tenant database management platform",
			schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
			version: "1.0.0",
		},
		auth: {
			type: "bearer",
			bearer: [
				{
					key: "token",
					value: "{{jwt_token}}",
					type: "string",
				},
			],
		},
		variable: [
			{
				key: "base_url",
				value: baseUrl,
				type: "string",
			},
			{
				key: "jwt_token",
				value: "",
				type: "string",
			},
			{
				key: "tenant_id",
				value: "1",
				type: "string",
			},
			{
				key: "database_id",
				value: "1",
				type: "string",
			},
			{
				key: "table_id",
				value: "1",
				type: "string",
			},
		],
		item: [
			{
				name: "Authentication",
				item: [
					{
						name: "Sign In",
						request: {
							method: "POST",
							header: [
								{
									key: "Content-Type",
									value: "application/json",
								},
							],
							body: {
								mode: "raw",
								raw: JSON.stringify({
									email: "your-email@example.com",
									password: "your-password",
								}, null, 2),
							},
							url: {
								raw: "{{base_url}}/api/auth/signin",
								host: ["{{base_url}}"],
								path: ["api", "auth", "signin"],
							},
							description: "Authenticate user with email and password",
						},
						event: [
							{
								listen: "test",
								script: {
									exec: [
										"if (pm.response.code === 200) {",
										"    const response = pm.response.json();",
										"    if (response.data && response.data.token) {",
										"        pm.collectionVariables.set('jwt_token', response.data.token);",
										"        pm.collectionVariables.set('tenant_id', response.data.user.tenantId);",
										"    }",
										"}",
									],
									type: "text/javascript",
								},
							},
						],
					},
					{
						name: "Sign Out",
						request: {
							method: "POST",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/auth/signout",
								host: ["{{base_url}}"],
								path: ["api", "auth", "signout"],
							},
							description: "Sign out the current user",
						},
					},
				],
			},
			{
				name: "Databases",
				item: [
					{
						name: "List Databases",
						request: {
							method: "GET",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases"],
							},
							description: "Get all databases for a tenant",
						},
					},
					{
						name: "Create Database",
						request: {
							method: "POST",
							header: [
								{
									key: "Content-Type",
									value: "application/json",
								},
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							body: {
								mode: "raw",
								raw: JSON.stringify({
									name: "My Database",
									description: "A sample database",
								}, null, 2),
							},
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases"],
							},
							description: "Create a new database",
						},
						event: [
							{
								listen: "test",
								script: {
									exec: [
										"if (pm.response.code === 201) {",
										"    const response = pm.response.json();",
										"    if (response.data && response.data.id) {",
										"        pm.collectionVariables.set('database_id', response.data.id);",
										"    }",
										"}",
									],
									type: "text/javascript",
								},
							},
						],
					},
					{
						name: "Get Database",
						request: {
							method: "GET",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}"],
							},
							description: "Get a specific database",
						},
					},
					{
						name: "Update Database",
						request: {
							method: "PUT",
							header: [
								{
									key: "Content-Type",
									value: "application/json",
								},
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							body: {
								mode: "raw",
								raw: JSON.stringify({
									name: "Updated Database Name",
									description: "Updated description",
								}, null, 2),
							},
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}"],
							},
							description: "Update a database",
						},
					},
					{
						name: "Delete Database",
						request: {
							method: "DELETE",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}"],
							},
							description: "Delete a database",
						},
					},
				],
			},
			{
				name: "Tables",
				item: [
					{
						name: "List Tables",
						request: {
							method: "GET",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}/tables",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}", "tables"],
							},
							description: "Get all tables in a database",
						},
					},
					{
						name: "Create Table",
						request: {
							method: "POST",
							header: [
								{
									key: "Content-Type",
									value: "application/json",
								},
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							body: {
								mode: "raw",
								raw: JSON.stringify({
									name: "My Table",
									description: "A sample table",
									columns: [
										{
											name: "name",
											type: "TEXT",
											required: true,
										},
										{
											name: "email",
											type: "EMAIL",
											required: true,
										},
										{
											name: "age",
											type: "NUMBER",
											required: false,
										},
									],
								}, null, 2),
							},
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}/tables",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}", "tables"],
							},
							description: "Create a new table",
						},
						event: [
							{
								listen: "test",
								script: {
									exec: [
										"if (pm.response.code === 201) {",
										"    const response = pm.response.json();",
										"    if (response.data && response.data.id) {",
										"        pm.collectionVariables.set('table_id', response.data.id);",
										"    }",
										"}",
									],
									type: "text/javascript",
								},
							},
						],
					},
					{
						name: "Get Table",
						request: {
							method: "GET",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}/tables/{{table_id}}",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}", "tables", "{{table_id}}"],
							},
							description: "Get a specific table",
						},
					},
					{
						name: "Update Table",
						request: {
							method: "PUT",
							header: [
								{
									key: "Content-Type",
									value: "application/json",
								},
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							body: {
								mode: "raw",
								raw: JSON.stringify({
									name: "Updated Table Name",
									description: "Updated description",
								}, null, 2),
							},
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}/tables/{{table_id}}",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}", "tables", "{{table_id}}"],
							},
							description: "Update a table",
						},
					},
					{
						name: "Delete Table",
						request: {
							method: "DELETE",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}/tables/{{table_id}}",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}", "tables", "{{table_id}}"],
							},
							description: "Delete a table",
						},
					},
				],
			},
			{
				name: "Rows",
				item: [
					{
						name: "List Rows",
						request: {
							method: "GET",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}/tables/{{table_id}}/rows?page=1&limit=50",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}", "tables", "{{table_id}}", "rows"],
								query: [
									{
										key: "page",
										value: "1",
									},
									{
										key: "limit",
										value: "50",
									},
								],
							},
							description: "Get all rows in a table with pagination",
						},
					},
					{
						name: "Create Row",
						request: {
							method: "POST",
							header: [
								{
									key: "Content-Type",
									value: "application/json",
								},
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							body: {
								mode: "raw",
								raw: JSON.stringify({
									data: {
										name: "John Doe",
										email: "john@example.com",
										age: 30,
									},
								}, null, 2),
							},
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}/tables/{{table_id}}/rows",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}", "tables", "{{table_id}}", "rows"],
							},
							description: "Create a new row",
						},
					},
					{
						name: "Get Row",
						request: {
							method: "GET",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}/tables/{{table_id}}/rows/{{row_id}}",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}", "tables", "{{table_id}}", "rows", "{{row_id}}"],
							},
							description: "Get a specific row",
						},
					},
					{
						name: "Update Row",
						request: {
							method: "PUT",
							header: [
								{
									key: "Content-Type",
									value: "application/json",
								},
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							body: {
								mode: "raw",
								raw: JSON.stringify({
									data: {
										name: "Jane Doe",
										email: "jane@example.com",
										age: 25,
									},
								}, null, 2),
							},
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}/tables/{{table_id}}/rows/{{row_id}}",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}", "tables", "{{table_id}}", "rows", "{{row_id}}"],
							},
							description: "Update a row",
						},
					},
					{
						name: "Delete Row",
						request: {
							method: "DELETE",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/databases/{{database_id}}/tables/{{table_id}}/rows/{{row_id}}",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "databases", "{{database_id}}", "tables", "{{table_id}}", "rows", "{{row_id}}"],
							},
							description: "Delete a row",
						},
					},
				],
			},
			{
				name: "Analytics",
				item: [
					{
						name: "Get Analytics",
						request: {
							method: "GET",
							header: [
								{
									key: "Authorization",
									value: "Bearer {{jwt_token}}",
								},
							],
							url: {
								raw: "{{base_url}}/api/tenants/{{tenant_id}}/analytics?period=30d",
								host: ["{{base_url}}"],
								path: ["api", "tenants", "{{tenant_id}}", "analytics"],
								query: [
									{
										key: "period",
										value: "30d",
									},
								],
							},
							description: "Get analytics data for a tenant",
						},
					},
				],
			},
		],
	};

	return NextResponse.json(postmanCollection, {
		headers: {
			"Content-Type": "application/json",
			"Content-Disposition": "attachment; filename=multi-tenant-platform-api.postman_collection.json",
		},
	});
}
