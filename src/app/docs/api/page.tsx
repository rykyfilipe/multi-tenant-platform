/** @format */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Code, Zap, Shield, AlertTriangle } from "lucide-react";

export default function ApiDocsPage() {
	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4'>
				<h1 className='text-4xl font-bold text-foreground'>
					API Documentation
				</h1>
				<p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
					Comprehensive guide to integrate with YDV's multi-tenant database
					platform through our RESTful API
				</p>
			</div>

			{/* Quick Navigation */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader className='pb-3'>
						<CardTitle className='flex items-center gap-2 text-lg'>
							<Zap className='w-5 h-5 text-blue-500' />
							Quick Start
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-sm text-muted-foreground'>
							Get up and running with your first API request in minutes
						</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader className='pb-3'>
						<CardTitle className='flex items-center gap-2 text-lg'>
							<Shield className='w-5 h-5 text-green-500' />
							Authentication
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-sm text-muted-foreground'>
							Learn how to securely authenticate your API requests
						</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader className='pb-3'>
						<CardTitle className='flex items-center gap-2 text-lg'>
							<Code className='w-5 h-5 text-purple-500' />
							Endpoints
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-sm text-muted-foreground'>
							Explore all available API endpoints and their usage
						</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-lg transition-shadow'>
					<CardHeader className='pb-3'>
						<CardTitle className='flex items-center gap-2 text-lg'>
							<AlertTriangle className='w-5 h-5 text-orange-500' />
							Error Handling
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-sm text-muted-foreground'>
							Understand error codes and how to handle them properly
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Documentation */}
			<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-4 sm:p-6'>
				<h2 className='text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6'>
					API Documentation
				</h2>

				<div className='space-y-6 sm:space-y-8'>
					{/* Note */}
					<div className='bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-3 sm:p-4 rounded-xl shadow-sm text-sm'>
						<p>
							<strong>Note:</strong> All public API routes operate strictly on
							the tables created within this application. Make sure you have at
							least one database and table defined before sending any requests
							to these endpoints.
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

					{/* API Status */}
					<div>
						<h3 className='text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4'>
							API Status
						</h3>

						<div className='bg-green-50 border border-green-200 rounded-lg p-4'>
							<div className='flex items-start gap-3'>
								<BookOpen className='w-5 h-5 text-green-600 mt-0.5 flex-shrink-0' />
								<div className='text-sm text-green-800'>
									<p className='font-medium mb-1'>
										Public API Available
									</p>
									<p>
										All tables in your tenant are now accessible through the public API by default. 
										No need to make individual tables public anymore - simply use your API token to access any table.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Available Endpoints */}
					<div>
						<h3 className='text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4'>
							Available Endpoints
						</h3>
						<div className='space-y-3'>
							<div className='bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto'>
								<span className='text-green-300'>GET</span> /api/public/tables?tenantId=123
							</div>
							<div className='bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto'>
								<span className='text-green-300'>GET</span> /api/public/tables/1
							</div>
							<div className='bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto'>
								<span className='text-green-300'>GET</span> /api/public/tables/1/rows
							</div>
							<div className='bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto'>
								<span className='text-blue-300'>POST</span> /api/public/tables/1/rows
							</div>
							<div className='bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto'>
								<span className='text-yellow-300'>PUT</span> /api/public/tables/1/rows/1
							</div>
							<div className='bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto'>
								<span className='text-red-300'>DELETE</span> /api/public/tables/1/rows/1
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
