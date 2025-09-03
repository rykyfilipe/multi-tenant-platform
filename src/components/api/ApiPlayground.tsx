/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
	Play, 
	Copy, 
	Check, 
	Download, 
	Code, 
	Globe, 
	Key, 
	Settings,
	AlertCircle,
	CheckCircle,
	Clock,
	ExternalLink,
	BookOpen,
	Lightbulb
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApp } from "@/contexts/AppContext";
import { logger } from "@/lib/error-logger";

interface ApiEndpoint {
	method: string;
	path: string;
	title: string;
	description: string;
	parameters?: ApiParameter[];
	requestBody?: any;
	responses: Record<string, ApiResponse>;
	examples?: ApiExample[];
}

interface ApiParameter {
	name: string;
	type: string;
	required: boolean;
	description: string;
	example?: any;
}

interface ApiResponse {
	status: number;
	description: string;
	schema: any;
	example?: any;
}

interface ApiExample {
	title: string;
	description: string;
	request: {
		headers?: Record<string, string>;
		body?: any;
		query?: Record<string, string>;
	};
	response: {
		status: number;
		body: any;
	};
}

interface ApiPlaygroundProps {
	endpoint: ApiEndpoint;
	onExecute?: (request: any) => void;
}

/**
 * Interactive API Playground Component
 * Allows users to test API endpoints with real requests
 */
export function ApiPlayground({ endpoint, onExecute }: ApiPlaygroundProps) {
	const { t } = useLanguage();
	const { user, tenant } = useApp();
	
	const [selectedExample, setSelectedExample] = useState<number>(0);
	const [requestData, setRequestData] = useState<any>({});
	const [response, setResponse] = useState<any>(null);
	const [isExecuting, setIsExecuting] = useState(false);
	const [executionTime, setExecutionTime] = useState<number>(0);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("request");

	// Initialize with first example
	useEffect(() => {
		if (endpoint.examples && endpoint.examples.length > 0) {
			const example = endpoint.examples[selectedExample];
			setRequestData({
				headers: example.request.headers || {},
				body: example.request.body || {},
				query: example.request.query || {},
			});
		}
	}, [endpoint.examples, selectedExample]);

	const executeRequest = async () => {
		if (!user) {
			logger.warn("API playground request attempted without authentication", {
				component: "ApiPlayground",
			});
			return;
		}

		setIsExecuting(true);
		const startTime = Date.now();

		try {
			// Build the request URL
			let url = endpoint.path;
			
			// Replace path parameters
			if (requestData.query) {
				const queryParams = new URLSearchParams();
				Object.entries(requestData.query).forEach(([key, value]) => {
					if (value) {
						queryParams.append(key, value as string);
					}
				});
				if (queryParams.toString()) {
					url += `?${queryParams.toString()}`;
				}
			}

			// Prepare headers
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${user.id}`, // In real app, use actual JWT
				...requestData.headers,
			};

			// Prepare request options
			const requestOptions: RequestInit = {
				method: endpoint.method,
				headers,
			};

			// Add body for non-GET requests
			if (endpoint.method !== "GET" && requestData.body) {
				requestOptions.body = JSON.stringify(requestData.body);
			}

			// Execute request
			const apiResponse = await fetch(url, requestOptions);
			const responseData = await apiResponse.json();
			const endTime = Date.now();

			setResponse({
				status: apiResponse.status,
				statusText: apiResponse.statusText,
				headers: Object.fromEntries(apiResponse.headers.entries()),
				body: responseData,
			});

			setExecutionTime(endTime - startTime);

			// Log successful execution
			logger.info("API playground request executed", {
				component: "ApiPlayground",
				userId: user.id,
				endpoint: endpoint.path,
				method: endpoint.method,
				status: apiResponse.status,
				executionTime: endTime - startTime,
			});

			// Notify parent component
			onExecute?.({
				endpoint: endpoint.path,
				method: endpoint.method,
				request: requestData,
				response: responseData,
				status: apiResponse.status,
			});

		} catch (error) {
			const endTime = Date.now();
			setExecutionTime(endTime - startTime);

			setResponse({
				status: 0,
				statusText: "Network Error",
				error: error instanceof Error ? error.message : "Unknown error",
			});

			logger.error("API playground request failed", error as Error, {
				component: "ApiPlayground",
				userId: user.id,
				endpoint: endpoint.path,
				method: endpoint.method,
			});
		} finally {
			setIsExecuting(false);
		}
	};

	const copyToClipboard = async (text: string, type: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedCode(type);
			setTimeout(() => setCopiedCode(null), 2000);
		} catch (err) {
			logger.error("Failed to copy to clipboard", err as Error, {
				component: "ApiPlayground",
			});
		}
	};

	const generateCodeExample = (language: string) => {
		const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://api.example.com";
		const fullUrl = `${baseUrl}${endpoint.path}`;

		switch (language) {
			case "javascript":
				return `fetch("${fullUrl}", {
  method: "${endpoint.method}",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
  },
  body: JSON.stringify(${JSON.stringify(requestData.body, null, 2)})
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));`;

			case "python":
				return `import requests

url = "${fullUrl}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
}
data = ${JSON.stringify(requestData.body, null, 2)}

response = requests.${endpoint.method.toLowerCase()}(
    url, 
    headers=headers, 
    json=data
)
print(response.json())`;

			case "curl":
				const curlHeaders = Object.entries({
					"Content-Type": "application/json",
					"Authorization": "Bearer YOUR_TOKEN",
					...requestData.headers,
				}).map(([key, value]) => `-H "${key}: ${value}"`).join(" \\\n  ");

				const curlBody = endpoint.method !== "GET" && requestData.body 
					? `-d '${JSON.stringify(requestData.body)}'`
					: "";

				return `curl -X ${endpoint.method} \\
  ${curlHeaders} \\
  ${curlBody} \\
  "${fullUrl}"`;

			default:
				return "";
		}
	};

	const getStatusColor = (status: number) => {
		if (status >= 200 && status < 300) return "text-green-600";
		if (status >= 400 && status < 500) return "text-yellow-600";
		if (status >= 500) return "text-red-600";
		return "text-gray-600";
	};

	const getStatusIcon = (status: number) => {
		if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4 text-green-600" />;
		if (status >= 400) return <AlertCircle className="h-4 w-4 text-red-600" />;
		return <Clock className="h-4 w-4 text-gray-600" />;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<div className="flex items-center gap-2 mb-2">
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
					<h3 className="text-lg font-semibold">{endpoint.title}</h3>
					<p className="text-muted-foreground">{endpoint.description}</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => copyToClipboard(generateCodeExample("curl"), "curl")}
					>
						{copiedCode === "curl" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
						cURL
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => copyToClipboard(generateCodeExample("javascript"), "js")}
					>
						{copiedCode === "js" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
						JavaScript
					</Button>
				</div>
			</div>

			{/* Examples Selector */}
			{endpoint.examples && endpoint.examples.length > 1 && (
				<div>
					<Label className="text-sm font-medium">Example</Label>
					<Select value={selectedExample.toString()} onValueChange={(value) => setSelectedExample(parseInt(value))}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{endpoint.examples.map((example, index) => (
								<SelectItem key={index} value={index.toString()}>
									{example.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}

			{/* Request/Response Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="request">Request</TabsTrigger>
					<TabsTrigger value="response">
						Response
						{response && (
							<Badge variant="outline" className="ml-2">
								{response.status}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="request" className="space-y-4">
					{/* Headers */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Headers</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{Object.entries(requestData.headers || {}).map(([key, value], index) => (
								<div key={index} className="flex gap-2">
									<Input
										placeholder="Header name"
										value={key}
										onChange={(e) => {
											const newHeaders = { ...requestData.headers };
											delete newHeaders[key];
											newHeaders[e.target.value] = value;
											setRequestData({ ...requestData, headers: newHeaders });
										}}
										className="flex-1"
									/>
									<Input
										placeholder="Header value"
										value={value as string}
										onChange={(e) => {
											setRequestData({
												...requestData,
												headers: { ...requestData.headers, [key]: e.target.value }
											});
										}}
										className="flex-1"
									/>
								</div>
							))}
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setRequestData({
										...requestData,
										headers: { ...requestData.headers, "": "" }
									});
								}}
							>
								Add Header
							</Button>
						</CardContent>
					</Card>

					{/* Query Parameters */}
					{endpoint.method === "GET" && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Query Parameters</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{Object.entries(requestData.query || {}).map(([key, value], index) => (
									<div key={index} className="flex gap-2">
										<Input
											placeholder="Parameter name"
											value={key}
											onChange={(e) => {
												const newQuery = { ...requestData.query };
												delete newQuery[key];
												newQuery[e.target.value] = value;
												setRequestData({ ...requestData, query: newQuery });
											}}
											className="flex-1"
										/>
										<Input
											placeholder="Parameter value"
											value={value as string}
											onChange={(e) => {
												setRequestData({
													...requestData,
													query: { ...requestData.query, [key]: e.target.value }
												});
											}}
											className="flex-1"
										/>
									</div>
								))}
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setRequestData({
											...requestData,
											query: { ...requestData.query, "": "" }
										});
									}}
								>
									Add Parameter
								</Button>
							</CardContent>
						</Card>
					)}

					{/* Request Body */}
					{endpoint.method !== "GET" && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Request Body</CardTitle>
							</CardHeader>
							<CardContent>
								<Textarea
									placeholder="Request body (JSON)"
									value={JSON.stringify(requestData.body || {}, null, 2)}
									onChange={(e) => {
										try {
											const parsed = JSON.parse(e.target.value);
											setRequestData({ ...requestData, body: parsed });
										} catch (err) {
											// Invalid JSON, keep the text for editing
										}
									}}
									className="min-h-[200px] font-mono text-sm"
								/>
							</CardContent>
						</Card>
					)}

					{/* Execute Button */}
					<Button
						onClick={executeRequest}
						disabled={isExecuting}
						className="w-full"
					>
						{isExecuting ? (
							<>
								<Clock className="h-4 w-4 mr-2 animate-spin" />
								Executing...
							</>
						) : (
							<>
								<Play className="h-4 w-4 mr-2" />
								Execute Request
							</>
						)}
					</Button>
				</TabsContent>

				<TabsContent value="response" className="space-y-4">
					{response ? (
						<>
							{/* Response Status */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base flex items-center gap-2">
										{getStatusIcon(response.status)}
										Response Status
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-between">
										<div>
											<div className={`text-lg font-semibold ${getStatusColor(response.status)}`}>
												{response.status} {response.statusText}
											</div>
											<div className="text-sm text-muted-foreground">
												Executed in {executionTime}ms
											</div>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => copyToClipboard(JSON.stringify(response, null, 2), "response")}
										>
											{copiedCode === "response" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
											Copy Response
										</Button>
									</div>
								</CardContent>
							</Card>

							{/* Response Body */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Response Body</CardTitle>
								</CardHeader>
								<CardContent>
									<pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
										{JSON.stringify(response.body, null, 2)}
									</pre>
								</CardContent>
							</Card>
						</>
					) : (
						<Card>
							<CardContent className="p-8 text-center">
								<Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h4 className="text-lg font-medium mb-2">No Response Yet</h4>
								<p className="text-muted-foreground">
									Execute a request to see the response here.
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>

			{/* Code Examples */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<Code className="h-4 w-4" />
						Code Examples
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="javascript" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="javascript">JavaScript</TabsTrigger>
							<TabsTrigger value="python">Python</TabsTrigger>
							<TabsTrigger value="curl">cURL</TabsTrigger>
						</TabsList>
						
						<TabsContent value="javascript">
							<pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
								<code>{generateCodeExample("javascript")}</code>
							</pre>
						</TabsContent>
						
						<TabsContent value="python">
							<pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
								<code>{generateCodeExample("python")}</code>
							</pre>
						</TabsContent>
						
						<TabsContent value="curl">
							<pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
								<code>{generateCodeExample("curl")}</code>
							</pre>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
