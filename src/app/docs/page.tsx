/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
	BookOpen, 
	Code, 
	Globe, 
	Key, 
	Shield, 
	Zap,
	Copy,
	Check,
	ExternalLink,
	Download
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ApiEndpoint {
	method: string;
	path: string;
	summary: string;
	description: string;
	parameters?: Array<{
		name: string;
		in: string;
		required: boolean;
		description: string;
		type: string;
	}>;
	requestBody?: {
		required: boolean;
		content: any;
	};
	responses: Record<string, {
		description: string;
		content?: any;
	}>;
}

export default function DocsPage() {
	const { t } = useLanguage();
	const [apiSpec, setApiSpec] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/docs")
			.then(res => res.json())
			.then(data => {
				setApiSpec(data);
				setLoading(false);
			})
			.catch(err => {
				console.error("Failed to load API docs:", err);
				setLoading(false);
			});
	}, []);

	const copyToClipboard = async (text: string, id: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedCode(id);
			setTimeout(() => setCopiedCode(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const generateCodeExample = (endpoint: ApiEndpoint, method: string, path: string) => {
		const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
		const fullUrl = `${baseUrl}${path}`;
		
		const headers = {
			"Content-Type": "application/json",
			"Authorization": "Bearer YOUR_JWT_TOKEN"
		};

		if (method === "GET") {
			return `fetch("${fullUrl}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 2)}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));`;
		} else {
			return `fetch("${fullUrl}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 2)},
  body: JSON.stringify({
    // Your request data here
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));`;
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-1/3"></div>
					<div className="h-4 bg-muted rounded w-2/3"></div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{[...Array(6)].map((_, i) => (
							<div key={i} className="h-32 bg-muted rounded"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	const endpoints = apiSpec?.paths ? Object.entries(apiSpec.paths).map(([path, methods]: [string, any]) => {
		const methodEntries = Object.entries(methods);
		return methodEntries.map(([method, details]: [string, any]) => ({
			method: method.toUpperCase(),
			path,
			...details,
		}));
	}).flat() : [];

	const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
		const tag = endpoint.tags?.[0] || "Other";
		if (!acc[tag]) acc[tag] = [];
		acc[tag].push(endpoint);
		return acc;
	}, {} as Record<string, ApiEndpoint[]>);

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-4">
					<BookOpen className="h-8 w-8 text-primary" />
					<h1 className="text-4xl font-bold">API Documentation</h1>
				</div>
				<p className="text-lg text-muted-foreground mb-6">
					Comprehensive API reference for the Multi-Tenant Platform
				</p>
				
				{/* Quick Actions */}
				<div className="flex flex-wrap gap-4 mb-8">
					<Button variant="outline" onClick={() => window.open("/api/docs", "_blank")}>
						<Download className="h-4 w-4 mr-2" />
						Download OpenAPI Spec
					</Button>
					<Button variant="outline" onClick={() => window.open("https://swagger.io/tools/swagger-ui/", "_blank")}>
						<ExternalLink className="h-4 w-4 mr-2" />
						View in Swagger UI
					</Button>
				</div>
			</div>

			{/* Overview Cards */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
						<Globe className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{endpoints.length}</div>
						<p className="text-xs text-muted-foreground">
							RESTful API endpoints
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Authentication</CardTitle>
						<Key className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">JWT</div>
						<p className="text-xs text-muted-foreground">
							Bearer token authentication
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Rate Limiting</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
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
						<CardTitle className="text-sm font-medium">Response Time</CardTitle>
						<Zap className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">&lt;200ms</div>
						<p className="text-xs text-muted-foreground">
							Average response time
						</p>
					</CardContent>
				</Card>
			</div>

			{/* API Endpoints */}
			<Tabs defaultValue={Object.keys(groupedEndpoints)[0]} className="space-y-6">
				<TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
					{Object.keys(groupedEndpoints).map((tag) => (
						<TabsTrigger key={tag} value={tag}>
							{tag}
						</TabsTrigger>
					))}
				</TabsList>

				{Object.entries(groupedEndpoints).map(([tag, tagEndpoints]) => (
					<TabsContent key={tag} value={tag} className="space-y-4">
						<div className="space-y-4">
							{tagEndpoints.map((endpoint, index) => {
								const codeId = `${tag}-${index}`;
								const codeExample = generateCodeExample(endpoint, endpoint.method, endpoint.path);
								
								return (
									<Card key={index}>
										<CardHeader>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<Badge 
														variant={
															endpoint.method === "GET" ? "default" :
															endpoint.method === "POST" ? "secondary" :
															endpoint.method === "PUT" ? "outline" :
															endpoint.method === "DELETE" ? "destructive" : "default"
														}
													>
														{endpoint.method}
													</Badge>
													<code className="text-sm bg-muted px-2 py-1 rounded">
														{endpoint.path}
													</code>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => copyToClipboard(codeExample, codeId)}
												>
													{copiedCode === codeId ? (
														<Check className="h-4 w-4 text-green-600" />
													) : (
														<Copy className="h-4 w-4" />
													)}
												</Button>
											</div>
											<CardTitle className="text-lg">{endpoint.summary}</CardTitle>
											<CardDescription>{endpoint.description}</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
											{/* Parameters */}
											{endpoint.parameters && endpoint.parameters.length > 0 && (
												<div>
													<h4 className="font-medium mb-2">Parameters</h4>
													<div className="space-y-2">
														{endpoint.parameters.map((param, paramIndex) => (
															<div key={paramIndex} className="flex items-center gap-2 text-sm">
																<code className="bg-muted px-2 py-1 rounded text-xs">
																	{param.name}
																</code>
																<Badge variant="outline" className="text-xs">
																	{param.in}
																</Badge>
																{param.required && (
																	<Badge variant="destructive" className="text-xs">
																		Required
																	</Badge>
																)}
																<span className="text-muted-foreground">
																	{param.description}
																</span>
															</div>
														))}
													</div>
												</div>
											)}

											{/* Code Example */}
											<div>
												<h4 className="font-medium mb-2">Example Request</h4>
												<pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
													<code>{codeExample}</code>
												</pre>
											</div>

											{/* Responses */}
											<div>
												<h4 className="font-medium mb-2">Responses</h4>
												<div className="space-y-2">
													{Object.entries(endpoint.responses).map(([status, response]) => (
														<div key={status} className="flex items-center gap-2 text-sm">
															<Badge 
																variant={
																	status.startsWith("2") ? "default" :
																	status.startsWith("4") ? "destructive" :
																	status.startsWith("5") ? "destructive" : "outline"
																}
															>
																{status}
															</Badge>
															<span>{response.description}</span>
														</div>
													))}
												</div>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					</TabsContent>
				))}
			</Tabs>

			{/* Authentication Section */}
			<Card className="mt-8">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Key className="h-5 w-5" />
						Authentication
					</CardTitle>
					<CardDescription>
						Learn how to authenticate with the API
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h4 className="font-medium mb-2">Getting Started</h4>
						<ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
							<li>Sign up for an account or sign in to get your API credentials</li>
							<li>Use your email and password to authenticate via the sign-in endpoint</li>
							<li>Include the returned JWT token in the Authorization header for all subsequent requests</li>
							<li>Token expires after 24 hours - refresh by signing in again</li>
						</ol>
					</div>
					
					<div>
						<h4 className="font-medium mb-2">Example Authentication Flow</h4>
						<pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
							<code>{`// 1. Sign in to get token
const response = await fetch("/api/auth/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "your-email@example.com",
    password: "your-password"
  })
});

const { data } = await response.json();
const token = data.token;

// 2. Use token in subsequent requests
const apiResponse = await fetch("/api/tenants/123/databases", {
  headers: {
    "Authorization": \`Bearer \${token}\`,
    "Content-Type": "application/json"
  }
});`}</code>
						</pre>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}