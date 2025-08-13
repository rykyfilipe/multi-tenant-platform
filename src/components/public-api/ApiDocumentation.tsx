/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
	AlertTriangle,
	BookOpen,
	Code,
	Database,
	FileText,
	Filter,
	Globe,
	Lock,
	Shield,
	Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

interface ApiDocumentation {
	title: string;
	description: string;
	version: string;
	baseUrl: string;
	authentication: {
		type: string;
		header: string;
		note: string;
	};
	endpoints: Array<{
		method: string;
		path: string;
		description: string;
		authentication: string;
		pathParams?: any;
		queryParams?: any;
		request: any;
		response: any;
		statusCodes: any;
		notes?: string[];
	}>;
	examples: any;
	errorHandling: any;
	bestPractices: string[];
	rateLimiting: any;
	security: any;
	notes: string[];
}

export const ApiDocumentation = () => {
	const [documentation, setDocumentation] = useState<ApiDocumentation | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDocumentation = async () => {
			try {
				// For demo purposes, we'll use the documentation structure directly
				// In production, this would fetch from /api/public/docs
				const demoDoc: ApiDocumentation = {
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
							queryParams: {
								"None - tenant ID is automatically extracted from JWT token":
									"",
							},
							request: {
								headers: {
									Authorization:
										"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
								],
								count: 1,
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
									Authorization:
										"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
								"Get paginated rows from a specific table with advanced filtering and sorting",
							authentication: "Required - JWT Bearer Token",
							pathParams: {
								tableId: "number - The ID of the table",
							},
							queryParams: {
								page: "number (optional) - Page number for pagination (default: 1)",
								limit:
									"number (optional) - Number of rows per page (default: 50, max: 100)",
								filters:
									"string (optional) - JSON stringified filter conditions",
								sortBy: "string (optional) - Column name to sort by",
								sortOrder:
									"string (optional) - 'asc' or 'desc' (default: 'asc')",
							},
							request: {
								headers: {
									Authorization:
										"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
									"Content-Type": "application/json",
								},
								url: '/api/public/tables/1/rows?page=1&limit=10&filters={"name":{"operator":"contains","value":"john"}}&sortBy=name&sortOrder=asc',
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
								],
								pagination: {
									page: 1,
									limit: 10,
									total: 1,
									totalPages: 1,
								},
							},
							statusCodes: {
								"200": "Success - Returns paginated rows with pagination info",
								"400":
									"Bad Request - Invalid table ID or pagination parameters",
								"401": "Unauthorized - Invalid or missing JWT token",
								"403": "Forbidden - User not associated with any tenant",
								"404": "Not Found - Table not found or not accessible",
								"500": "Internal server error",
							},
							notes: [
								"Advanced filtering supports multiple operators and conditions",
								"Filters are applied before pagination for accurate results",
								"Sorting can be combined with filtering and pagination",
							],
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
									Authorization:
										"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
									Authorization:
										"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
									Authorization:
										"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
						advancedFiltering: {
							description: "Advanced filtering examples with operators",
							examples: [
								{
									title: "Simple text search",
									description: "Find rows where name contains 'john'",
									filter: { name: { operator: "contains", value: "john" } },
									url: '/api/public/tables/1/rows?filters={"name":{"operator":"contains","value":"john"}}',
								},
								{
									title: "Multiple conditions",
									description:
										"Find rows where age > 25 AND department = 'Engineering'",
									filter: {
										age: { operator: "gt", value: 25 },
										department: { operator: "equals", value: "Engineering" },
									},
									url: '/api/public/tables/1/rows?filters={"age":{"operator":"gt","value":25},"department":{"operator":"equals","value":"Engineering"}}',
								},
								{
									title: "Date range filtering",
									description: "Find rows created between two dates",
									filter: {
										createdAt: {
											operator: "between",
											value: ["2024-01-01", "2024-12-31"],
										},
									},
									url: '/api/public/tables/1/rows?filters={"createdAt":{"operator":"between","value":["2024-01-01","2024-12-31"]}}',
								},
							],
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
									"Invalid filter syntax",
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
						"Use advanced filtering for better performance on large datasets",
						"Combine filtering, sorting, and pagination for optimal results",
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
						"Advanced filtering supports complex queries with multiple operators",
						"Filtering is applied before pagination for accurate results",
					],
				};

				setDocumentation(demoDoc);
				setLoading(false);
			} catch (err) {
				setError("Failed to load API documentation");
				setLoading(false);
			}
		};

		fetchDocumentation();
	}, []);

	if (loading) {
		return (
			<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-6'>
				<div className='animate-pulse space-y-4'>
					<div className='h-8 bg-muted rounded w-1/3'></div>
					<div className='h-4 bg-muted rounded w-2/3'></div>
					<div className='h-4 bg-muted rounded w-1/2'></div>
				</div>
			</div>
		);
	}

	if (error || !documentation) {
		return (
			<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-6'>
				<div className='bg-red-50 border border-red-200 rounded-lg p-4'>
					<div className='flex items-start gap-3'>
						<AlertTriangle className='w-5 h-5 text-red-600 mt-0.5 flex-shrink-0' />
						<div className='text-sm text-red-800'>
							<p className='font-medium mb-1'>Error Loading Documentation</p>
							<p>{error || "Failed to load API documentation"}</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-4 sm:p-6'>
			<div className='mb-6'>
				<div className='flex items-center gap-3 mb-2'>
					<BookOpen className='w-6 h-6 text-primary' />
					<h1 className='text-2xl sm:text-3xl font-bold text-foreground'>
						{documentation.title}
					</h1>
				</div>
				<p className='text-muted-foreground text-lg'>
					{documentation.description}
				</p>
				<div className='flex items-center gap-4 mt-3 text-sm text-muted-foreground'>
					<span>Version {documentation.version}</span>
					<span>•</span>
					<span>Base URL: {documentation.baseUrl}</span>
				</div>
			</div>

			<Tabs defaultValue='overview' className='w-full'>
				<TabsList className='grid w-full grid-cols-5'>
					<TabsTrigger value='overview'>Overview</TabsTrigger>
					<TabsTrigger value='endpoints'>Endpoints</TabsTrigger>
					<TabsTrigger value='examples'>Examples</TabsTrigger>
					<TabsTrigger value='filtering'>Filtering</TabsTrigger>
					<TabsTrigger value='errors'>Error Handling</TabsTrigger>
				</TabsList>

				<TabsContent value='overview' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Lock className='w-5 h-5' />
								Authentication
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
								<p className='text-blue-800 text-sm mb-2'>
									<strong>Note:</strong> {documentation.authentication.note}
								</p>
								<code className='bg-blue-100 text-blue-900 px-3 py-2 rounded text-sm font-mono'>
									{documentation.authentication.header}
								</code>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Shield className='w-5 h-5' />
								Security Features
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								{Object.entries(documentation.security).map(([key, value]) => (
									<div key={key} className='space-y-2'>
										<h4 className='font-medium text-sm text-muted-foreground capitalize'>
											{key.replace(/([A-Z])/g, " $1").trim()}
										</h4>
										<p className='text-sm'>{value as string}</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Zap className='w-5 h-5' />
								Rate Limiting
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
								<p className='text-yellow-800 text-sm'>
									<strong>Limit:</strong>{" "}
									{documentation.rateLimiting.limits.requestsPerMinute} requests
									per {documentation.rateLimiting.limits.windowSize}
								</p>
								<p className='text-yellow-800 text-sm mt-1'>
									<strong>Block Duration:</strong>{" "}
									{documentation.rateLimiting.limits.blockDuration} on limit
									exceeded
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='endpoints' className='space-y-6'>
					<div className='space-y-4'>
						{documentation.endpoints.map((endpoint, index) => (
							<Card key={index}>
								<CardHeader>
									<div className='flex items-center gap-3'>
										<Badge
											variant={
												endpoint.method === "GET"
													? "default"
													: endpoint.method === "POST"
													? "secondary"
													: endpoint.method === "PUT"
													? "outline"
													: "destructive"
											}>
											{endpoint.method}
										</Badge>
										<code className='text-sm font-mono bg-muted px-2 py-1 rounded'>
											{endpoint.path}
										</code>
									</div>
									<CardDescription className='text-base mt-2'>
										{endpoint.description}
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									{endpoint.pathParams && (
										<div>
											<h4 className='font-medium text-sm text-muted-foreground mb-2'>
												Path Parameters
											</h4>
											<div className='space-y-1'>
												{Object.entries(endpoint.pathParams).map(
													([key, value]) => (
														<div
															key={key}
															className='flex justify-between text-sm'>
															<code className='bg-muted px-2 py-1 rounded'>
																{key}
															</code>
															<span className='text-muted-foreground'>
																{value as string}
															</span>
														</div>
													),
												)}
											</div>
										</div>
									)}

									{endpoint.queryParams && (
										<div>
											<h4 className='font-medium text-sm text-muted-foreground mb-2'>
												Query Parameters
											</h4>
											<div className='space-y-1'>
												{Object.entries(endpoint.queryParams).map(
													([key, value]) => (
														<div
															key={key}
															className='flex justify-between text-sm'>
															<code className='bg-muted px-2 py-1 rounded'>
																{key}
															</code>
															<span className='text-muted-foreground'>
																{value as string}
															</span>
														</div>
													),
												)}
											</div>
										</div>
									)}

									<div>
										<h4 className='font-medium text-sm text-muted-foreground mb-2'>
											Status Codes
										</h4>
										<div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
											{Object.entries(endpoint.statusCodes).map(
												([code, message]) => (
													<div
														key={code}
														className='flex items-center gap-2 text-sm'>
														<Badge
															variant='outline'
															className='w-16 justify-center'>
															{code}
														</Badge>
														<span className='text-muted-foreground'>
															{message as string}
														</span>
													</div>
												),
											)}
										</div>
									</div>

									{endpoint.notes && (
										<div>
											<h4 className='font-medium text-sm text-muted-foreground mb-2'>
												Notes
											</h4>
											<ul className='list-disc list-inside space-y-1 text-sm text-muted-foreground'>
												{endpoint.notes.map((note, noteIndex) => (
													<li key={noteIndex}>{note}</li>
												))}
											</ul>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value='examples' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Code className='w-5 h-5' />
								Authentication Example
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
								<div className='text-blue-300'>Headers:</div>
								<div className='ml-4'>
									<div>Authorization: Bearer YOUR_JWT_TOKEN</div>
									<div>Content-Type: application/json</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Database className='w-5 h-5' />
								Create Row Example
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div>
								<h4 className='font-medium text-sm text-muted-foreground mb-2'>
									Request
								</h4>
								<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
									<div className='text-green-300'>
										POST /api/public/tables/1/rows
									</div>
									<div className='text-blue-300 mt-2'>Body:</div>
									<div className='ml-4 text-gray-300'>
										{JSON.stringify(
											documentation.examples.createRow.request.body,
											null,
											2,
										)}
									</div>
								</div>
							</div>
							<div>
								<h4 className='font-medium text-sm text-muted-foreground mb-2'>
									Response
								</h4>
								<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
									<div className='text-green-300'>Status: 201</div>
									<div className='text-blue-300 mt-2'>Body:</div>
									<div className='ml-4 text-gray-300'>
										{JSON.stringify(
											documentation.examples.createRow.response.body,
											null,
											2,
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='filtering' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Filter className='w-5 h-5' />
								Advanced Filtering System
							</CardTitle>
							<CardDescription>
								Powerful filtering capabilities for querying rows with complex
								conditions
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div>
								<h3 className='text-lg font-semibold mb-4'>
									Available Operators
								</h3>
								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
									{[
										{
											operator: "equals",
											description: "Exact match",
											example: "value",
										},
										{
											operator: "not_equals",
											description: "Not equal to",
											example: "value",
										},
										{
											operator: "contains",
											description: "Contains text",
											example: "text",
										},
										{
											operator: "not_contains",
											description: "Does not contain",
											example: "text",
										},
										{
											operator: "starts_with",
											description: "Starts with text",
											example: "text",
										},
										{
											operator: "ends_with",
											description: "Ends with text",
											example: "text",
										},
										{
											operator: "gt",
											description: "Greater than",
											example: "100",
										},
										{
											operator: "gte",
											description: "Greater than or equal",
											example: "100",
										},
										{
											operator: "lt",
											description: "Less than",
											example: "100",
										},
										{
											operator: "lte",
											description: "Less than or equal",
											example: "100",
										},
										{
											operator: "between",
											description: "Between two values",
											example: "[1, 100]",
										},
										{
											operator: "in",
											description: "In list of values",
											example: "['a', 'b', 'c']",
										},
										{
											operator: "not_in",
											description: "Not in list",
											example: "['a', 'b', 'c']",
										},
										{
											operator: "is_null",
											description: "Is null/empty",
											example: "true",
										},
										{
											operator: "is_not_null",
											description: "Is not null/empty",
											example: "true",
										},
									].map((op) => (
										<div key={op.operator} className='border rounded-lg p-3'>
											<div className='font-mono text-sm font-medium text-primary mb-1'>
												{op.operator}
											</div>
											<div className='text-sm text-muted-foreground mb-2'>
												{op.description}
											</div>
											<div className='text-xs bg-muted px-2 py-1 rounded font-mono'>
												{op.example}
											</div>
										</div>
									))}
								</div>
							</div>

							<Separator />

							<div>
								<h3 className='text-lg font-semibold mb-4'>Filter Examples</h3>
								<div className='space-y-4'>
									{documentation.examples.advancedFiltering.examples.map(
										(example: any, index: any) => (
											<div key={index} className='border rounded-lg p-4'>
												<h4 className='font-medium mb-2'>{example.title}</h4>
												<p className='text-sm text-muted-foreground mb-3'>
													{example.description}
												</p>
												<div className='space-y-2'>
													<div>
														<span className='text-sm font-medium text-muted-foreground'>
															Filter:
														</span>
														<pre className='bg-muted p-2 rounded text-xs mt-1 overflow-x-auto'>
															{JSON.stringify(example.filter, null, 2)}
														</pre>
													</div>
													<div>
														<span className='text-sm font-medium text-muted-foreground'>
															URL:
														</span>
														<code className='block bg-muted p-2 rounded text-xs mt-1 break-all'>
															{example.url}
														</code>
													</div>
												</div>
											</div>
										),
									)}
								</div>
							</div>

							<Separator />

							<div>
								<h3 className='text-lg font-semibold mb-4'>
									Combining Filters
								</h3>
								<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
									<p className='text-blue-800 text-sm mb-3'>
										<strong>Multiple Conditions:</strong> You can combine
										multiple filters for complex queries
									</p>
									<div className='bg-blue-100 p-3 rounded'>
										<pre className='text-blue-900 text-xs overflow-x-auto'>
											{`{
  "name": { "operator": "contains", "value": "john" },
  "age": { "operator": "gte", "value": 25 },
  "department": { "operator": "in", "value": ["Engineering", "Sales"] },
  "createdAt": { "operator": "between", "value": ["2024-01-01", "2024-12-31"] }
}`}
										</pre>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='errors' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<AlertTriangle className='w-5 h-5' />
								Error Handling
							</CardTitle>
							<CardDescription>
								Common error scenarios and how to handle them properly
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='space-y-4'>
								{documentation.errorHandling.commonErrors.map(
									(error: any, index: any) => (
										<div key={index} className='border rounded-lg p-4'>
											<div className='flex items-center gap-3 mb-3'>
												<Badge
													variant='outline'
													className='w-16 justify-center'>
													{error.code}
												</Badge>
												<h4 className='font-medium'>{error.message}</h4>
											</div>
											<div className='space-y-2'>
												<div>
													<span className='text-sm font-medium text-muted-foreground'>
														Common Causes:
													</span>
													<ul className='list-disc list-inside ml-4 mt-1 text-sm text-muted-foreground'>
														{error.causes.map((cause: any, causeIndex: any) => (
															<li key={causeIndex}>{cause}</li>
														))}
													</ul>
												</div>
												<div>
													<span className='text-sm font-medium text-muted-foreground'>
														Example Response:
													</span>
													<pre className='bg-muted p-2 rounded text-xs mt-1 overflow-x-auto'>
														{JSON.stringify(error.example, null, 2)}
													</pre>
												</div>
											</div>
										</div>
									),
								)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<FileText className='w-5 h-5' />
								Best Practices
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className='list-disc list-inside space-y-2 text-sm'>
								{documentation.bestPractices.map((practice, index) => (
									<li key={index} className='text-muted-foreground'>
										{practice}
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};
