/** @format */

import { NextRequest, NextResponse } from "next/server";
import { validateJwtToken } from "@/lib/api-security";

export async function GET(request: NextRequest) {
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

		const documentation = {
			title: "Multi-Tenant Platform Public API Documentation",
			description:
				"Complete API reference for accessing and managing your tenant's data through JWT authentication",
			version: "2.0.0",
			baseUrl: "http://localhost:3000/api/public",
			authentication: {
				type: "JWT Bearer Token",
				header: "Authorization: Bearer YOUR_JWT_TOKEN",
				note: "JWT tokens are automatically generated when users log in and contain userId and role information",
			},

			endpoints: [
				{
					method: "GET",
					path: "/tables",
					description:
						"List all tables accessible to the authenticated user's tenant",
					authentication: "Required - JWT Bearer Token",
					queryParams:
						"None - tenant ID is automatically extracted from JWT token",
					request: {
						headers: {
							Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
							"Content-Type": "application/json",
						},
					},
					response: {
						success: true,
						data: [
							{
								id: 1,
								name: "users",
								description: "User information table",
								database: {
									id: 1,
									name: "Main Database",
								},
							},
							{
								id: 2,
								name: "products",
								description: "Product catalog",
								database: {
									id: 1,
									name: "Main Database",
								},
							},
						],
						count: 2,
					},
					statusCodes: {
						"200": "Success - Returns list of tables",
						"401": "Unauthorized - Invalid or missing JWT token",
						"403": "Forbidden - User not associated with any tenant",
						"500": "Internal server error",
					},
				},
				{
					method: "GET",
					path: "/tables/{tableId}",
					description:
						"Get detailed information about a specific table including column structure",
					authentication: "Required - JWT Bearer Token",
					pathParams: {
						tableId: "number - The ID of the table to retrieve",
					},
					request: {
						headers: {
							Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
							"Content-Type": "application/json",
						},
						url: "/api/public/tables/1",
					},
					response: {
						success: true,
						data: {
							id: 1,
							name: "users",
							description: "User information table",
							database: {
								id: 1,
								name: "Main Database",
								tenantId: 1,
							},
							columns: [
								{
									id: 1,
									name: "id",
									type: "number",
									required: true,
									primary: true,
									order: 0,
									customOptions: [],
								},
								{
									id: 2,
									name: "name",
									type: "string",
									required: true,
									primary: false,
									order: 1,
									customOptions: [],
								},
								{
									id: 3,
									name: "email",
									type: "string",
									required: true,
									primary: false,
									order: 2,
									customOptions: [],
								},
							],
						},
					},
					statusCodes: {
						"200": "Success - Returns table details with columns",
						"400": "Bad Request - Invalid table ID",
						"401": "Unauthorized - Invalid or missing JWT token",
						"403": "Forbidden - User not associated with any tenant",
						"404": "Not Found - Table not found or not accessible",
						"500": "Internal server error",
					},
				},
				{
					method: "GET",
					path: "/tables/{tableId}/rows",
					description:
						"Get paginated rows from a specific table with optional filtering",
					authentication: "Required - JWT Bearer Token",
					pathParams: {
						tableId: "number - The ID of the table",
					},
					queryParams: {
						page: "number (optional) - Page number for pagination (default: 1)",
						limit:
							"number (optional) - Number of rows per page (default: 50, max: 100)",
					},
					request: {
						headers: {
							Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
							"Content-Type": "application/json",
						},
						url: "/api/public/tables/1/rows?page=1&limit=10",
					},
					response: {
						success: true,
						data: [
							{
								id: 1,
								name: "John Doe",
								email: "john@example.com",
								age: 30,
								createdAt: "2024-01-01T00:00:00.000Z",
								updatedAt: "2024-01-01T00:00:00.000Z",
							},
							{
								id: 2,
								name: "Jane Smith",
								email: "jane@example.com",
								age: 25,
								createdAt: "2024-01-01T00:00:00.000Z",
								updatedAt: "2024-01-01T00:00:00.000Z",
							},
						],
						pagination: {
							page: 1,
							limit: 10,
							total: 2,
							totalPages: 1,
						},
					},
					statusCodes: {
						"200": "Success - Returns paginated rows with pagination info",
						"400": "Bad Request - Invalid table ID or pagination parameters",
						"401": "Unauthorized - Invalid or missing JWT token",
						"403": "Forbidden - User not associated with any tenant",
						"404": "Not Found - Table not found or not accessible",
						"500": "Internal server error",
					},
				},
				{
					method: "POST",
					path: "/tables/{tableId}/rows",
					description: "Create a new row in a specific table",
					authentication: "Required - JWT Bearer Token",
					pathParams: {
						tableId: "number - The ID of the table",
					},
					request: {
						headers: {
							Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
							"Content-Type": "application/json",
						},
						url: "/api/public/tables/1/rows",
						body: {
							data: {
								name: "New User",
								email: "newuser@example.com",
								age: 28,
							},
						},
					},
					response: {
						success: true,
						data: {
							id: 3,
							name: "New User",
							email: "newuser@example.com",
							age: 28,
							createdAt: "2024-01-01T00:00:00.000Z",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					},
					statusCodes: {
						"201": "Created - Row successfully created",
						"400":
							"Bad Request - Invalid data format or missing required fields",
						"401": "Unauthorized - Invalid or missing JWT token",
						"403": "Forbidden - User not associated with any tenant",
						"404": "Not Found - Table not found or not accessible",
						"500": "Internal server error",
					},
					notes: [
						"All required fields must be provided in the data object",
						"Column names in data object must match exactly with table column names",
						"Data types are automatically converted to strings for storage",
						"Row ID is automatically generated and returned",
					],
				},
				{
					method: "GET",
					path: "/tables/{tableId}/rows/{rowId}",
					description: "Get a specific row from a table by its ID",
					authentication: "Required - JWT Bearer Token",
					pathParams: {
						tableId: "number - The ID of the table",
						rowId: "number - The ID of the specific row",
					},
					request: {
						headers: {
							Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
							"Content-Type": "application/json",
						},
						url: "/api/public/tables/1/rows/1",
					},
					response: {
						success: true,
						data: {
							id: 1,
							name: "John Doe",
							email: "john@example.com",
							age: 30,
							createdAt: "2024-01-01T00:00:00.000Z",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					},
					statusCodes: {
						"200": "Success - Returns the specific row",
						"400": "Bad Request - Invalid table ID or row ID",
						"401": "Unauthorized - Invalid or missing JWT token",
						"403": "Forbidden - User not associated with any tenant",
						"404": "Not Found - Table or row not found",
						"500": "Internal server error",
					},
				},
				{
					method: "PUT",
					path: "/tables/{tableId}/rows/{rowId}",
					description:
						"Update an existing row in a table (full update - replaces all data)",
					authentication: "Required - JWT Bearer Token",
					pathParams: {
						tableId: "number - The ID of the table",
						rowId: "number - The ID of the row to update",
					},
					request: {
						headers: {
							Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
							"Content-Type": "application/json",
						},
						url: "/api/public/tables/1/rows/1",
						body: {
							data: {
								name: "John Doe Updated",
								email: "john.updated@example.com",
								age: 31,
							},
						},
					},
					response: {
						success: true,
						data: {
							id: 1,
							name: "John Doe Updated",
							email: "john.updated@example.com",
							age: 31,
							createdAt: "2024-01-01T00:00:00.000Z",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					},
					statusCodes: {
						"200": "Success - Row successfully updated",
						"400":
							"Bad Request - Invalid data format or missing required fields",
						"401": "Unauthorized - Invalid or missing JWT token",
						"403": "Forbidden - User not associated with any tenant",
						"404": "Not Found - Table or row not found",
						"500": "Internal server error",
					},
					notes: [
						"This is a full update - all existing data will be replaced",
						"All required fields must be provided",
						"Row ID and timestamps cannot be modified",
						"Operation is atomic - either all fields are updated or none",
					],
				},
				{
					method: "DELETE",
					path: "/tables/{tableId}/rows/{rowId}",
					description: "Delete a specific row from a table",
					authentication: "Required - JWT Bearer Token",
					pathParams: {
						tableId: "number - The ID of the table",
						rowId: "number - The ID of the row to delete",
					},
					request: {
						headers: {
							Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
							"Content-Type": "application/json",
						},
						url: "/api/public/tables/1/rows/1",
					},
					response: {
						success: true,
						message: "Row deleted successfully",
					},
					statusCodes: {
						"200": "Success - Row successfully deleted",
						"400": "Bad Request - Invalid table ID or row ID",
						"401": "Unauthorized - Invalid or missing JWT token",
						"403": "Forbidden - User not associated with any tenant",
						"404": "Not Found - Table or row not found",
						"500": "Internal server error",
					},
					notes: [
						"Deletion is permanent and cannot be undone",
						"All associated cell data is automatically deleted",
						"Operation is atomic - either the row is deleted or not",
					],
				},
			],
			examples: {
				authentication: {
					description: "How to authenticate with JWT token",
					note: "JWT tokens are automatically generated when users log in to the platform",
					example: {
						headers: {
							Authorization:
								"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJWSUVXRVIiLCJpYXQiOjE3NTUwNzQ2NzF9.6HQpBi9i8sWFmR7-I6bfLQALUPQyjd_e3dRVEP0v9qc",
							"Content-Type": "application/json",
						},
					},
				},
				createRow: {
					description: "Complete example of creating a new row",
					request: {
						method: "POST",
						url: "http://localhost:3000/api/public/tables/1/rows",
						headers: {
							Authorization: "Bearer YOUR_JWT_TOKEN",
							"Content-Type": "application/json",
						},
						body: {
							data: {
								name: "Alice Johnson",
								email: "alice@example.com",
								age: 29,
								department: "Engineering",
							},
						},
					},
					response: {
						status: 201,
						body: {
							success: true,
							data: {
								id: 4,
								name: "Alice Johnson",
								email: "alice@example.com",
								age: 29,
								department: "Engineering",
								createdAt: "2024-01-01T00:00:00.000Z",
								updatedAt: "2024-01-01T00:00:00.000Z",
							},
						},
					},
				},
				updateRow: {
					description: "Complete example of updating an existing row",
					request: {
						method: "PUT",
						url: "http://localhost:3000/api/public/tables/1/rows/4",
						headers: {
							Authorization: "Bearer YOUR_JWT_TOKEN",
							"Content-Type": "application/json",
						},
						body: {
							data: {
								name: "Alice Johnson-Smith",
								email: "alice.smith@example.com",
								age: 30,
								department: "Senior Engineering",
							},
						},
					},
					response: {
						status: 200,
						body: {
							success: true,
							data: {
								id: 4,
								name: "Alice Johnson-Smith",
								email: "alice.smith@example.com",
								age: 30,
								department: "Senior Engineering",
								createdAt: "2024-01-01T00:00:00.000Z",
								updatedAt: "2024-01-01T00:00:00.000Z",
							},
						},
					},
				},
				pagination: {
					description: "Example of paginated row retrieval",
					request: {
						method: "GET",
						url: "http://localhost:3000/api/public/tables/1/rows?page=2&limit=5",
						headers: {
							Authorization: "Bearer YOUR_JWT_TOKEN",
							"Content-Type": "application/json",
						},
					},
					response: {
						status: 200,
						body: {
							success: true,
							data: [
								// Rows 6-10 (assuming 5 rows per page)
							],
							pagination: {
								page: 2,
								limit: 5,
								total: 25,
								totalPages: 5,
							},
						},
					},
				},
			},
			errorHandling: {
				commonErrors: [
					{
						code: 400,
						message: "Bad Request",
						causes: [
							"Invalid table ID or row ID format",
							"Missing required fields in request body",
							"Invalid pagination parameters",
							"Malformed JSON in request body",
						],
						example: {
							error: "Missing required field: email",
						},
					},
					{
						code: 401,
						message: "Unauthorized",
						causes: [
							"Missing Authorization header",
							"Invalid JWT token format",
							"Expired JWT token",
							"Invalid JWT signature",
						],
						example: {
							error: "Invalid or expired JWT token",
						},
					},
					{
						code: 403,
						message: "Forbidden",
						causes: [
							"User not associated with any tenant",
							"Insufficient permissions for the operation",
						],
						example: {
							error: "User not associated with any tenant",
						},
					},
					{
						code: 404,
						message: "Not Found",
						causes: [
							"Table not found or not accessible",
							"Row not found in the specified table",
							"Database not accessible to user's tenant",
						],
						example: {
							error: "Table not found",
						},
					},
					{
						code: 500,
						message: "Internal Server Error",
						causes: [
							"Database connection issues",
							"Unexpected server errors",
							"Data validation failures",
						],
						example: {
							error: "Internal server error",
						},
					},
				],
			},
			bestPractices: [
				"Always include the Authorization header with your JWT token",
				"Use appropriate HTTP status codes for error handling",
				"Implement proper pagination for large datasets",
				"Validate data before sending to the API",
				"Handle rate limiting gracefully",
				"Use HTTPS in production environments",
				"Store JWT tokens securely and don't expose them in client-side code",
				"Implement proper error handling for all API responses",
			],
			rateLimiting: {
				description: "API requests are rate-limited to prevent abuse",
				limits: {
					requestsPerMinute: 100,
					windowSize: "60 seconds",
					blockDuration: "5 minutes on limit exceeded",
				},
				headers: {
					"X-RateLimit-Limit": "100",
					"X-RateLimit-Remaining": "95",
					"X-RateLimit-Reset": "1640995200",
				},
			},
			security: {
				authentication: "JWT Bearer Token required for all endpoints",
				authorization: "Users can only access data from their own tenant",
				dataIsolation:
					"Multi-tenant architecture ensures complete data separation",
				https: "Always use HTTPS in production environments",
			},
			notes: [
				"All tables in your tenant are accessible through this API by default",
				"JWT tokens automatically contain user ID and role information",
				"Tenant ID is automatically extracted from the authenticated user",
				"Data is returned in a flattened format where column names become object keys",
				"Required fields must be provided when creating or updating rows",
				"Row operations are atomic and will rollback on errors",
				"Pagination is available for all row listing endpoints",
				"All timestamps are returned in ISO 8601 format",
			],
		};

		return NextResponse.json({
			success: true,
			data: documentation,
		});
	} catch (error) {
		console.error("Error fetching API documentation:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
