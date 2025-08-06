/** @format */

"use client";

import React from "react";
import { Info } from "lucide-react";

export const ApiDocumentation = () => {
	return (
		<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-4 sm:p-6'>
			<h2 className='text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6'>
				API Documentation
			</h2>

			<div className='space-y-6 sm:space-y-8'>
				{/* Note */}
				<div className='bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-3 sm:p-4 rounded-xl shadow-sm text-sm'>
					<p>
						<strong>Note:</strong> All public API routes operate strictly on the
						tables created within this application. Make sure you have at least
						one database and table defined before sending any requests to these
						endpoints.
					</p>
				</div>

				{/* Important: Public Tables Only */}
				<div className='bg-orange-50 border-l-4 border-orange-500 text-orange-800 p-3 sm:p-4 rounded-xl shadow-sm text-sm'>
					<p>
						<strong>Important:</strong> API tokens can only access{" "}
						<strong>public tables</strong>. Private tables are not accessible
						via the public API. To make a table public, go to your database and
						click the globe icon on any table card.
					</p>
				</div>

				{/* Authentication */}
				<div>
					<h3 className='text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4'>
						Authentication
					</h3>
					<p className='text-sm text-muted-foreground mb-3 sm:mb-4'>
						Include your API token in the{" "}
						<code className='bg-muted px-2 py-1 rounded text-xs sm:text-sm'>
							Authorization
						</code>{" "}
						header with every request:
					</p>
					<div className='bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto'>
						<span className='text-blue-300'>Authorization:</span> Bearer
						YOUR_API_TOKEN
					</div>
				</div>

				{/* Available Endpoints */}
				<div>
					<h3 className='text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4'>
						Available Endpoints
					</h3>

					<div className='space-y-4 sm:space-y-6'>
						{/* Tables List Endpoint */}
						<div className='border border-border/20 rounded-lg p-4 sm:p-6'>
							<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4'>
								<span className='bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm font-semibold self-start'>
									GET
								</span>
								<code className='text-xs sm:text-sm md:text-base font-mono break-all'>
									/api/public/tables
								</code>
							</div>
							<p className='text-sm text-muted-foreground mb-3 sm:mb-4'>
								List all accessible tables.
							</p>

							<div className='space-y-3 sm:space-y-4'>
								<div>
									<h4 className='font-semibold text-foreground mb-2 text-sm sm:text-base'>
										Query Parameters (not available yet)
									</h4>
									<div className='space-y-2'>
										<div className='bg-muted/50 p-2 sm:p-3 rounded-lg'>
											<code className='text-xs sm:text-sm'>page</code>{" "}
											<span className='text-muted-foreground text-xs sm:text-sm'>
												(number, optional) - Page number (default: 1)
											</span>
										</div>
										<div className='bg-muted/50 p-2 sm:p-3 rounded-lg'>
											<code className='text-xs sm:text-sm'>limit</code>{" "}
											<span className='text-muted-foreground text-xs sm:text-sm'>
												(number, optional) - Items per page (default: 10, max:
												100)
											</span>
										</div>
									</div>
								</div>

								<div>
									<h4 className='font-semibold text-foreground mb-2 text-sm sm:text-base'>
										Example Request
									</h4>
									<div className='bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto'>
										<div className='text-yellow-300'>
											curl -X GET
											"ydv.digital/api/public/tables?page=1&limit=20"
										</div>
										<div className='text-gray-300 ml-2 sm:ml-4'>
											-H "Authorization: Bearer YOUR_API_TOKEN"
										</div>
									</div>
								</div>

								{/* Tables Endpoint */}
								<div className='border border-border/20 rounded-lg p-4 sm:p-6 space-y-10'>
									<div>
										<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4'>
											<span className='bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm font-semibold self-start'>
												GET
											</span>
											<code className='max-w-full text-sm md:text-lg font-mono break-all'>
												/api/public/tables/:tableId
											</code>
										</div>
										<p className='text-muted-foreground mb-4'>
											Retrieve data from a specific table.
										</p>

										<div className='space-y-4'>
											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Parameters
												</h4>
												<div className='bg-muted/50 p-3 rounded-lg'>
													<code className='text-sm'>tableId</code>{" "}
													<span className='text-muted-foreground'>
														(string, required) - The ID of the table to retrieve
													</span>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Example Request
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<div className='text-yellow-300'>
														curl -X GET "ydv.digital/api/public/tables/table123"
													</div>
													<div className='text-gray-300 ml-4'>
														-H "Authorization: Bearer YOUR_API_TOKEN"
													</div>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Example Response
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<pre>{`
 {
    "id": 31,
    "name": "projects",
    "description": "Represents custom projects or orders carried out for clients. Contains details like project name, associated client, status, deadline, and creation date.",
    "databaseId": 6,
    "rows": [
        {
            "id": 51,
            "createdAt": "2025-07-18T14:33:00.000Z",
            "name": "Website Redesign",
            "deadline": "2025-09-19T14:33:00.000Z",
            "status": "InProgress",
            "client": 50
        },
        {
            "id": 55,
            "createdAt": "2025-07-03T08:48:00.000Z",
            "name": "Hanana",
            "status": "Done",
            "deadline": "2025-07-10T08:48:00.000Z",
            "client": null
        }
    ]
}`}</pre>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Rows Endpoints */}
								<div className='border border-border/20 rounded-lg p-4 sm:p-6 space-y-10'>
									<div>
										<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4'>
											<span className='bg-yellow-100 text-yellow-600 px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm font-semibold self-start'>
												POST
											</span>
											<code className='max-w-full text-sm md:text-lg font-mono break-all'>
												/api/public/tables/:tableId/rows
											</code>
										</div>
										<p className='text-muted-foreground mb-4'>
											Add rows in a specific table.
										</p>

										<div className='space-y-4'>
											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Parameters
												</h4>
												<div className='bg-muted/50 p-3 rounded-lg'>
													<code className='text-sm'>tableId</code>{" "}
													<span className='text-muted-foreground'>
														(string, required) - The ID of the table to add
													</span>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Example Request
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<div className='text-yellow-300'>
														curl -X POST
														"ydv.digital/api/public/tables/table123/rows"
													</div>
													<div className='text-gray-300 ml-4'>
														-H "Authorization: Bearer YOUR_API_TOKEN"
													</div>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Example Body
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<pre>{`
 { 
    "id": 55,
    "createdAt": "2025-07-03T08:48:00.000Z",
    "name": "Hanana",
    "status": "Done",
    "deadline": "2025-07-10T08:48:00.000Z",
    "client": null
}`}</pre>
												</div>
											</div>
										</div>
									</div>
									<div>
										<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4'>
											<span className='bg-pink-100 text-pink-600 px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm font-semibold self-start'>
												PATCH
											</span>
											<code className='max-w-full text-sm md:text-lg font-mono break-all'>
												/api/public/tables/:tableId/rows/:rowId
											</code>
										</div>
										<p className='text-muted-foreground mb-4'>
											Modify data in a specific row.
										</p>

										<div className='space-y-4'>
											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Parameters
												</h4>
												<div className='flex flex-col bg-muted/50 p-3 rounded-lg space-y-2'>
													<div>
														<code className='text-sm'>tableId</code>{" "}
														<span className='text-muted-foreground'>
															(string, required) - The ID of the table
														</span>
													</div>
													<div>
														<code className='text-sm'>rowId</code>{" "}
														<span className='text-muted-foreground'>
															(string, required) - The ID of the row to modify
														</span>
													</div>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Example Request
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<div className='text-yellow-300'>
														curl -X PATCH
														"ydv.digital/api/public/tables/table123/rows/row12"
													</div>
													<div className='text-gray-300 ml-4'>
														-H "Authorization: Bearer YOUR_API_TOKEN"
													</div>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Example Body
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<pre>{`
 { 
    "name": "Hanana",
    "status": "Done",
    "deadline": "2025-07-10T08:48:00.000Z",
}`}</pre>
												</div>
											</div>
										</div>
									</div>
									<div>
										<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4'>
											<span className='bg-orange-100 text-orange-600 px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm font-semibold self-start'>
												DELETE
											</span>
											<code className='max-w-full text-sm md:text-lg font-mono break-all'>
												/api/public/tables/:tableId/rows/:rowId
											</code>
										</div>
										<p className='text-muted-foreground mb-4'>
											Delete a specific row.
										</p>

										<div className='space-y-4'>
											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Parameters
												</h4>
												<div className='flex flex-col bg-muted/50 p-3 rounded-lg space-y-2'>
													<div>
														<code className='text-sm'>tableId</code>{" "}
														<span className='text-muted-foreground'>
															(string, required) - The ID of the table
														</span>
													</div>
													<div>
														<code className='text-sm'>rowId</code>{" "}
														<span className='text-muted-foreground'>
															(string, required) - The ID of the row to delete
														</span>
													</div>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-foreground mb-2'>
													Example Request
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<div className='text-yellow-300'>
														curl -X DELETE
														"ydv.digital/api/public/tables/table123/rows/row12"
													</div>
													<div className='text-gray-300 ml-4'>
														-H "Authorization: Bearer YOUR_API_TOKEN"
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Error Responses */}
						<div>
							<h3 className='text-lg font-semibold text-foreground mb-4'>
								Error Responses
							</h3>
							<div className='space-y-3'>
								<div className='flex items-center gap-4 p-3 bg-muted/50 rounded-lg'>
									<span className='font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded'>
										401
									</span>
									<span className='text-foreground'>
										Unauthorized - Invalid or missing API token
									</span>
								</div>
								<div className='flex items-center gap-4 p-3 bg-muted/50 rounded-lg'>
									<span className='font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded'>
										403
									</span>
									<span className='text-foreground'>
										Forbidden - Token doesn't have required permissions
									</span>
								</div>
								<div className='flex items-center gap-4 p-3 bg-muted/50 rounded-lg'>
									<span className='font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded'>
										404
									</span>
									<span className='text-foreground'>
										Not Found - Resource doesn't exist
									</span>
								</div>
								<div className='flex items-center gap-4 p-3 bg-muted/50 rounded-lg'>
									<span className='font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded'>
										429
									</span>
									<span className='text-foreground'>
										Too Many Requests - Rate limit exceeded
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
