/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
	Code, 
	Globe, 
	Key, 
	BookOpen, 
	Download, 
	ExternalLink,
	Search,
	Filter,
	Play,
	Copy,
	Check,
	Star,
	Clock,
	Users,
	Zap,
	Shield,
	BarChart3
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApp } from "@/contexts/AppContext";
import { ApiPlayground } from "@/components/api/ApiPlayground";
import { logger } from "@/lib/error-logger";

interface ApiEndpoint {
	method: string;
	path: string;
	title: string;
	description: string;
	category: string;
	parameters?: any[];
	requestBody?: any;
	responses: Record<string, any>;
	examples?: any[];
	rateLimit?: string;
	authentication?: string;
}

export default function ApiPortalPage() {
	const { t } = useLanguage();
	const { user, tenant } = useApp();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
	const [apiKey, setApiKey] = useState("");
	const [favoriteEndpoints, setFavoriteEndpoints] = useState<Set<string>>(new Set());
	const [recentRequests, setRecentRequests] = useState<any[]>([]);

	// Sample API endpoints (in production, this would come from an API)
	const apiEndpoints: ApiEndpoint[] = [
		{
			method: "GET",
			path: "/api/tenants/{tenantId}/databases",
			title: "List Databases",
			description: "Retrieve all databases for a tenant",
			category: "databases",
			parameters: [
				{
					name: "tenantId",
					type: "path",
					required: true,
					description: "The tenant ID",
				},
			],
			responses: {
				"200": {
					description: "List of databases",
					schema: {
						type: "array",
						items: { $ref: "#/components/schemas/Database" },
					},
				},
			},
			examples: [
				{
					title: "Basic Request",
					description: "Get all databases for a tenant",
					request: {
						headers: {
							"Authorization": "Bearer YOUR_TOKEN",
						},
					},
					response: {
						status: 200,
						body: {
							success: true,
							data: [
								{
									id: 1,
									name: "My Database",
									description: "A sample database",
									createdAt: "2024-01-15T10:30:00Z",
								},
							],
						},
					},
				},
			],
			rateLimit: "1000 requests/hour",
			authentication: "Bearer Token",
		},
		{
			method: "POST",
			path: "/api/tenants/{tenantId}/databases",
			title: "Create Database",
			description: "Create a new database",
			category: "databases",
			parameters: [
				{
					name: "tenantId",
					type: "path",
					required: true,
					description: "The tenant ID",
				},
			],
			requestBody: {
				type: "object",
				properties: {
					name: { type: "string" },
					description: { type: "string" },
				},
				required: ["name"],
			},
			responses: {
				"201": {
					description: "Database created successfully",
					schema: { $ref: "#/components/schemas/Database" },
				},
			},
			examples: [
				{
					title: "Create Database",
					description: "Create a new database with name and description",
					request: {
						headers: {
							"Authorization": "Bearer YOUR_TOKEN",
							"Content-Type": "application/json",
						},
						body: {
							name: "My New Database",
							description: "A new database for my project",
						},
					},
					response: {
						status: 201,
						body: {
							success: true,
							data: {
								id: 2,
								name: "My New Database",
								description: "A new database for my project",
								createdAt: "2024-01-15T10:30:00Z",
							},
						},
					},
				},
			],
			rateLimit: "100 requests/hour",
			authentication: "Bearer Token",
		},
		{
			method: "GET",
			path: "/api/tenants/{tenantId}/databases/{databaseId}/tables",
			title: "List Tables",
			description: "Get all tables in a database",
			category: "tables",
			parameters: [
				{
					name: "tenantId",
					type: "path",
					required: true,
					description: "The tenant ID",
				},
				{
					name: "databaseId",
					type: "path",
					required: true,
					description: "The database ID",
				},
			],
			responses: {
				"200": {
					description: "List of tables",
					schema: {
						type: "array",
						items: { $ref: "#/components/schemas/Table" },
					},
				},
			},
			examples: [
				{
					title: "Get Tables",
					description: "Retrieve all tables in a database",
					request: {
						headers: {
							"Authorization": "Bearer YOUR_TOKEN",
						},
					},
					response: {
						status: 200,
						body: {
							success: true,
							data: [
								{
									id: 1,
									name: "Users",
									description: "User information table",
									columns: [
										{ name: "id", type: "NUMBER" },
										{ name: "name", type: "TEXT" },
										{ name: "email", type: "EMAIL" },
									],
								},
							],
						},
					},
				},
			],
			rateLimit: "1000 requests/hour",
			authentication: "Bearer Token",
		},
		{
			method: "GET",
			path: "/api/tenants/{tenantId}/analytics",
			title: "Get Analytics",
			description: "Retrieve analytics data for a tenant",
			category: "analytics",
			parameters: [
				{
					name: "tenantId",
					type: "path",
					required: true,
					description: "The tenant ID",
				},
				{
					name: "period",
					type: "query",
					required: false,
					description: "Analytics period (7d, 30d, 90d, 1y)",
				},
			],
			responses: {
				"200": {
					description: "Analytics data",
					schema: { $ref: "#/components/schemas/Analytics" },
				},
			},
			examples: [
				{
					title: "Get Analytics",
					description: "Retrieve analytics for the last 30 days",
					request: {
						headers: {
							"Authorization": "Bearer YOUR_TOKEN",
						},
						query: {
							period: "30d",
						},
					},
					response: {
						status: 200,
						body: {
							success: true,
							data: {
								databases: 5,
								tables: 12,
								rows: 1500,
								users: 3,
								storage: 45.2,
								activity: [
									{ date: "2024-01-15", actions: 25 },
									{ date: "2024-01-14", actions: 18 },
								],
							},
						},
					},
				},
			],
			rateLimit: "100 requests/hour",
			authentication: "Bearer Token",
		},
	];

	const categories = [
		{ id: "all", name: "All Endpoints", count: apiEndpoints.length },
		{ id: "databases", name: "Databases", count: apiEndpoints.filter(e => e.category === "databases").length },
		{ id: "tables", name: "Tables", count: apiEndpoints.filter(e => e.category === "tables").length },
		{ id: "analytics", name: "Analytics", count: apiEndpoints.filter(e => e.category === "analytics").length },
	];

	// Load user preferences
	useEffect(() => {
		if (user?.id) {
			loadUserPreferences();
		}
	}, [user?.id]);

	const loadUserPreferences = () => {
		if (!user?.id) return;

		try {
			// Load API key
			const savedApiKey = localStorage.getItem(`api_key_${user.id}`);
			if (savedApiKey) {
				setApiKey(savedApiKey);
			}

			// Load favorite endpoints
			const favorites = localStorage.getItem(`favorite_endpoints_${user.id}`);
			if (favorites) {
				setFavoriteEndpoints(new Set(JSON.parse(favorites)));
			}

			// Load recent requests
			const recent = localStorage.getItem(`recent_requests_${user.id}`);
			if (recent) {
				setRecentRequests(JSON.parse(recent));
			}
		} catch (error) {
			logger.error("Failed to load API portal preferences", error as Error, {
				component: "ApiPortalPage",
				userId: user.id,
			});
		}
	};

	const saveUserPreferences = () => {
		if (!user?.id) return;

		try {
			if (apiKey) {
				localStorage.setItem(`api_key_${user.id}`, apiKey);
			}
			localStorage.setItem(`favorite_endpoints_${user.id}`, JSON.stringify(Array.from(favoriteEndpoints)));
			localStorage.setItem(`recent_requests_${user.id}`, JSON.stringify(recentRequests));
		} catch (error) {
			logger.error("Failed to save API portal preferences", error as Error, {
				component: "ApiPortalPage",
				userId: user.id,
			});
		}
	};

	// Save preferences when they change
	useEffect(() => {
		saveUserPreferences();
	}, [apiKey, favoriteEndpoints, recentRequests]);

	const filteredEndpoints = apiEndpoints.filter(endpoint => {
		const matchesSearch = endpoint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			endpoint.path.toLowerCase().includes(searchQuery.toLowerCase());
		
		const matchesCategory = selectedCategory === "all" || endpoint.category === selectedCategory;
		
		return matchesSearch && matchesCategory;
	});

	const toggleFavorite = (endpointPath: string) => {
		const newFavorites = new Set(favoriteEndpoints);
		if (newFavorites.has(endpointPath)) {
			newFavorites.delete(endpointPath);
		} else {
			newFavorites.add(endpointPath);
		}
		setFavoriteEndpoints(newFavorites);
	};

	const handleRequestExecuted = (requestData: any) => {
		// Add to recent requests
		const newRecent = [requestData, ...recentRequests.slice(0, 9)]; // Keep last 10
		setRecentRequests(newRecent);

		// Log request execution
		logger.info("API request executed from portal", {
			component: "ApiPortalPage",
			userId: user?.id,
			endpoint: requestData.endpoint,
			method: requestData.method,
			status: requestData.status,
		});
	};

	const getMethodColor = (method: string) => {
		switch (method) {
			case "GET": return "bg-green-100 text-green-800";
			case "POST": return "bg-blue-100 text-blue-800";
			case "PUT": return "bg-yellow-100 text-yellow-800";
			case "DELETE": return "bg-red-100 text-red-800";
			default: return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-4">
					<Code className="h-8 w-8 text-primary" />
					<h1 className="text-4xl font-bold">API Portal</h1>
				</div>
				<p className="text-lg text-muted-foreground mb-6">
					Interactive API documentation and testing playground
				</p>
				
				{/* Quick Actions */}
				<div className="flex flex-wrap gap-4 mb-8">
					<Button variant="outline" onClick={() => window.open("/api/docs", "_blank")}>
						<Download className="h-4 w-4 mr-2" />
						Download OpenAPI Spec
					</Button>
					<Button variant="outline" onClick={() => window.open("/api/docs/postman", "_blank")}>
						<Download className="h-4 w-4 mr-2" />
						Postman Collection
					</Button>
					<Button variant="outline" onClick={() => window.open("/docs", "_blank")}>
						<BookOpen className="h-4 w-4 mr-2" />
						Documentation
					</Button>
				</div>
			</div>

			{/* API Key Setup */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Key className="h-5 w-5" />
						API Authentication
					</CardTitle>
					<CardDescription>
						Configure your API key for testing endpoints
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						<Input
							placeholder="Enter your API key"
							value={apiKey}
							onChange={(e) => setApiKey(e.target.value)}
							type="password"
							className="flex-1"
						/>
						<Button variant="outline">
							<Key className="h-4 w-4 mr-2" />
							Generate Key
						</Button>
					</div>
					<p className="text-sm text-muted-foreground mt-2">
						Your API key is stored locally and used for testing endpoints in this portal.
					</p>
				</CardContent>
			</Card>

			{/* Search and Filters */}
			<div className="mb-6">
				<div className="flex gap-4 mb-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search endpoints..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>
					<Button variant="outline">
						<Filter className="h-4 w-4 mr-2" />
						Filters
					</Button>
				</div>

				{/* Category Tabs */}
				<Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
					<TabsList className="grid w-full grid-cols-4">
						{categories.map((category) => (
							<TabsTrigger key={category.id} value={category.id}>
								{category.name}
								<Badge variant="secondary" className="ml-2">
									{category.count}
								</Badge>
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>

			{/* Content */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Endpoints List */}
				<div className="lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">API Endpoints</CardTitle>
							<CardDescription>
								{filteredEndpoints.length} endpoint{filteredEndpoints.length !== 1 ? 's' : ''} found
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							{filteredEndpoints.map((endpoint) => (
								<div
									key={endpoint.path}
									className={`p-3 border rounded-lg cursor-pointer transition-colors ${
										selectedEndpoint?.path === endpoint.path
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50"
									}`}
									onClick={() => setSelectedEndpoint(endpoint)}
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<Badge className={getMethodColor(endpoint.method)}>
													{endpoint.method}
												</Badge>
												<code className="text-xs bg-muted px-1 py-0.5 rounded">
													{endpoint.path}
												</code>
											</div>
											<h4 className="font-medium text-sm">{endpoint.title}</h4>
											<p className="text-xs text-muted-foreground">
												{endpoint.description}
											</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												toggleFavorite(endpoint.path);
											}}
											className="h-6 w-6 p-0"
										>
											<Star className={`h-3 w-3 ${
												favoriteEndpoints.has(endpoint.path) 
													? "fill-yellow-400 text-yellow-400" 
													: ""
											}`} />
										</Button>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					{/* Recent Requests */}
					{recentRequests.length > 0 && (
						<Card className="mt-6">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Recent Requests
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{recentRequests.slice(0, 5).map((request, index) => (
									<div key={index} className="flex items-center justify-between p-2 border rounded">
										<div>
											<div className="flex items-center gap-2">
												<Badge className={getMethodColor(request.method)}>
													{request.method}
												</Badge>
												<span className="text-sm font-mono">{request.endpoint}</span>
											</div>
											<div className="text-xs text-muted-foreground">
												Status: {request.status}
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												const endpoint = apiEndpoints.find(e => e.path === request.endpoint);
												if (endpoint) {
													setSelectedEndpoint(endpoint);
												}
											}}
										>
											<Play className="h-3 w-3" />
										</Button>
									</div>
								))}
							</CardContent>
						</Card>
					)}
				</div>

				{/* API Playground */}
				<div className="lg:col-span-2">
					{selectedEndpoint ? (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Play className="h-5 w-5" />
									API Playground
								</CardTitle>
								<CardDescription>
									Test the {selectedEndpoint.title} endpoint
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ApiPlayground
									endpoint={selectedEndpoint}
									onExecute={handleRequestExecuted}
								/>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="p-8 text-center">
								<Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h4 className="text-lg font-medium mb-2">Select an Endpoint</h4>
								<p className="text-muted-foreground">
									Choose an API endpoint from the list to start testing.
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* API Statistics */}
			<div className="grid gap-4 md:grid-cols-4 mt-8">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
						<Globe className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{apiEndpoints.length}</div>
						<p className="text-xs text-muted-foreground">
							Available API endpoints
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
						<Zap className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">1000</div>
						<p className="text-xs text-muted-foreground">
							Requests per hour
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Authentication</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">JWT</div>
						<p className="text-xs text-muted-foreground">
							Bearer token auth
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Response Time</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">&lt;200ms</div>
						<p className="text-xs text-muted-foreground">
							Average response time
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
