/** @format */

"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Code,
	Copy,
	Download,
	ExternalLink,
	Clock,
	ArrowRight,
	FileText,
	Github,
	Book,
	Zap,
} from "lucide-react";

const SDKExamplesPage = () => {
	const { t } = useLanguage();

	const sdks = [
		{
			language: "JavaScript/TypeScript",
			icon: "🟨",
			description: "Full-featured SDK for browser and Node.js applications",
			features: [
				"TypeScript support",
				"Promise-based API",
				"Built-in authentication",
				"Error handling",
			],
			installation: "npm install @ydv/sdk",
			github: "https://github.com/ydv-digital/sdk-javascript",
			docs: "/docs/sdks/javascript",
			status: "Stable",
		},
		{
			language: "Python",
			icon: "🐍",
			description:
				"Pythonic SDK with async support and data science integrations",
			features: [
				"Async/await support",
				"Pandas integration",
				"Type hints",
				"Context managers",
			],
			installation: "pip install ydv-sdk",
			github: "https://github.com/ydv-digital/sdk-python",
			docs: "/docs/sdks/python",
			status: "Stable",
		},
		{
			language: "PHP",
			icon: "🐘",
			description:
				"Modern PHP SDK with PSR-4 autoloading and Laravel integration",
			features: [
				"PSR-4 autoloading",
				"Laravel service provider",
				"Eloquent-like syntax",
				"Validation",
			],
			installation: "composer require ydv/sdk",
			github: "https://github.com/ydv-digital/sdk-php",
			docs: "/docs/sdks/php",
			status: "Stable",
		},
		{
			language: "Go",
			icon: "🐹",
			description:
				"High-performance Go SDK with context support and structured logging",
			features: [
				"Context support",
				"Structured logging",
				"Connection pooling",
				"Graceful errors",
			],
			installation: "go get github.com/ydv-digital/sdk-go",
			github: "https://github.com/ydv-digital/sdk-go",
			docs: "/docs/sdks/go",
			status: "Beta",
		},
		{
			language: "Java",
			icon: "☕",
			description: "Enterprise-ready Java SDK with Spring Boot integration",
			features: [
				"Spring Boot starter",
				"Connection pooling",
				"Retry policies",
				"Metrics",
			],
			installation: "Maven/Gradle dependency",
			github: "https://github.com/ydv-digital/sdk-java",
			docs: "/docs/sdks/java",
			status: "Beta",
		},
		{
			language: "C#/.NET",
			icon: "💜",
			description:
				".NET SDK with async patterns and Entity Framework integration",
			features: [
				"Async/await patterns",
				"EF Core integration",
				"Dependency injection",
				"Configuration",
			],
			installation: "dotnet add package YDV.SDK",
			github: "https://github.com/ydv-digital/sdk-dotnet",
			docs: "/docs/sdks/dotnet",
			status: "Beta",
		},
	];

	const quickExamples = {
		javascript: `import { YDVClient } from '@ydv/sdk';

const client = new YDVClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.ydv.digital'
});

// Get all tables
const tables = await client.tables.list();

// Create a new row
const newRow = await client.tables.rows.create('customers', {
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active'
});

// Query rows with filters
const customers = await client.tables.rows.list('customers', {
  filter: { status: 'active' },
  limit: 10,
  sort: 'created_at:desc'
});

// Update a row
const updatedRow = await client.tables.rows.update('customers', newRow.id, {
  status: 'premium'
});

// Delete a row
await client.tables.rows.delete('customers', newRow.id);`,

		python: `from ydv_sdk import YDVClient

client = YDVClient(
    api_key='your-api-key',
    base_url='https://api.ydv.digital'
)

# Get all tables
tables = client.tables.list()

# Create a new row
new_row = client.tables.rows.create('customers', {
    'name': 'John Doe',
    'email': 'john@example.com',
    'status': 'active'
})

# Query rows with filters
customers = client.tables.rows.list('customers', 
    filter={'status': 'active'},
    limit=10,
    sort='created_at:desc'
)

# Update a row
updated_row = client.tables.rows.update('customers', new_row.id, {
    'status': 'premium'
})

# Delete a row
client.tables.rows.delete('customers', new_row.id)

# Async example
import asyncio
from ydv_sdk import AsyncYDVClient

async def main():
    async with AsyncYDVClient(api_key='your-api-key') as client:
        tables = await client.tables.list()
        print(f"Found {len(tables)} tables")

asyncio.run(main())`,

		php: `<?php
require_once 'vendor/autoload.php';

use YDV\\SDK\\YDVClient;

$client = new YDVClient([
    'api_key' => 'your-api-key',
    'base_url' => 'https://api.ydv.digital'
]);

// Get all tables
$tables = $client->tables->list();

// Create a new row
$newRow = $client->tables->rows->create('customers', [
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'status' => 'active'
]);

// Query rows with filters
$customers = $client->tables->rows->list('customers', [
    'filter' => ['status' => 'active'],
    'limit' => 10,
    'sort' => 'created_at:desc'
]);

// Update a row
$updatedRow = $client->tables->rows->update('customers', $newRow->id, [
    'status' => 'premium'
]);

// Delete a row
$client->tables->rows->delete('customers', $newRow->id);

// Laravel integration
// In your service provider:
// $this->app->singleton(YDVClient::class, function ($app) {
//     return new YDVClient(config('ydv'));
// });`,

		go: `package main

import (
    "context"
    "fmt"
    "log"

    "github.com/ydv-digital/sdk-go"
)

func main() {
    client := ydv.NewClient(&ydv.Config{
        APIKey:  "your-api-key",
        BaseURL: "https://api.ydv.digital",
    })

    ctx := context.Background()

    // Get all tables
    tables, err := client.Tables.List(ctx)
    if err != nil {
        log.Fatal(err)
    }

    // Create a new row
    newRow, err := client.Tables.Rows.Create(ctx, "customers", map[string]interface{}{
        "name":   "John Doe",
        "email":  "john@example.com",
        "status": "active",
    })
    if err != nil {
        log.Fatal(err)
    }

    // Query rows with filters
    customers, err := client.Tables.Rows.List(ctx, "customers", &ydv.ListOptions{
        Filter: map[string]interface{}{"status": "active"},
        Limit:  10,
        Sort:   "created_at:desc",
    })
    if err != nil {
        log.Fatal(err)
    }

    // Update a row
    updatedRow, err := client.Tables.Rows.Update(ctx, "customers", newRow.ID, map[string]interface{}{
        "status": "premium",
    })
    if err != nil {
        log.Fatal(err)
    }

    // Delete a row
    err = client.Tables.Rows.Delete(ctx, "customers", newRow.ID)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Processed %d customers\\n", len(customers))
}`,
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	return (
		<div className='max-w-6xl mx-auto p-6 space-y-8'>
			{/* Header */}
			<div className='space-y-4'>
				<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
					<Link href='/docs' className='hover:text-foreground'>
						Documentation
					</Link>
					<span>/</span>
					<Link href='/docs/api' className='hover:text-foreground'>
						API Reference
					</Link>
					<span>/</span>
					<span className='text-foreground'>SDK Examples</span>
				</div>

				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-foreground'>
						SDK Examples & Code Libraries
					</h1>
					<p className='text-lg text-muted-foreground'>
						Official SDKs and code examples to help you integrate with the YDV
						API in your favorite programming language.
					</p>
				</div>

				<div className='flex items-center space-x-4'>
					<Badge variant='secondary'>
						<Clock className='w-3 h-3 mr-1' />
						10 min read
					</Badge>
					<Badge variant='outline'>SDK</Badge>
					<Badge variant='outline'>Code Examples</Badge>
					<Badge variant='outline'>Integration</Badge>
				</div>
			</div>

			<Separator />

			{/* Available SDKs */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Official SDKs
					</h2>
					<p className='text-muted-foreground'>
						Choose from our officially supported SDKs for popular programming
						languages and frameworks.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{sdks.map((sdk, index) => (
						<Card key={index} className='hover:shadow-md transition-shadow'>
							<CardHeader>
								<div className='flex items-start justify-between'>
									<div className='flex items-center space-x-3'>
										<span className='text-2xl'>{sdk.icon}</span>
										<div>
											<CardTitle className='text-lg'>{sdk.language}</CardTitle>
											<CardDescription>{sdk.description}</CardDescription>
										</div>
									</div>
									<Badge
										variant={sdk.status === "Stable" ? "default" : "secondary"}
										className='ml-2'>
										{sdk.status}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div>
									<h4 className='font-medium text-sm text-foreground mb-2'>
										Key Features:
									</h4>
									<div className='flex flex-wrap gap-1'>
										{sdk.features.map((feature, idx) => (
											<Badge key={idx} variant='secondary' className='text-xs'>
												{feature}
											</Badge>
										))}
									</div>
								</div>

								<div>
									<h4 className='font-medium text-sm text-foreground mb-2'>
										Installation:
									</h4>
									<code className='text-xs bg-muted px-2 py-1 rounded font-mono'>
										{sdk.installation}
									</code>
								</div>

								<div className='flex items-center space-x-2 pt-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={() => window.open(sdk.github, "_blank")}
										className='flex items-center space-x-1'>
										<Github className='w-3 h-3' />
										<span>GitHub</span>
									</Button>
									<Button
										variant='outline'
										size='sm'
										onClick={() => window.open(sdk.docs, "_blank")}
										className='flex items-center space-x-1'>
										<Book className='w-3 h-3' />
										<span>Docs</span>
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Quick Start Examples */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Quick Start Examples
					</h2>
					<p className='text-muted-foreground'>
						Get started quickly with these basic examples showing common
						operations.
					</p>
				</div>

				<div className='space-y-6'>
					{Object.entries(quickExamples).map(([language, code]) => (
						<Card key={language}>
							<CardHeader className='pb-3'>
								<div className='flex items-center justify-between'>
									<CardTitle className='text-lg capitalize flex items-center space-x-2'>
										<Code className='w-5 h-5' />
										<span>
											{language === "javascript"
												? "JavaScript/TypeScript"
												: language.charAt(0).toUpperCase() + language.slice(1)}
										</span>
									</CardTitle>
									<Button
										variant='outline'
										size='sm'
										onClick={() => copyToClipboard(code)}
										className='flex items-center space-x-1'>
										<Copy className='w-4 h-4' />
										<span>Copy</span>
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
									<code>{code}</code>
								</pre>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Common Patterns */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Common Integration Patterns
					</h2>
					<p className='text-muted-foreground'>
						Learn about common patterns and best practices for integrating with
						the YDV API.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					<Card>
						<CardContent className='p-6'>
							<div className='space-y-3'>
								<div className='flex items-center space-x-2'>
									<Zap className='w-5 h-5 text-blue-600' />
									<h3 className='font-semibold text-foreground'>
										Batch Operations
									</h3>
								</div>
								<p className='text-sm text-muted-foreground'>
									Process multiple records efficiently using batch create,
									update, and delete operations.
								</p>
								<ul className='text-sm text-muted-foreground space-y-1'>
									<li>• Reduce API calls by up to 90%</li>
									<li>• Automatic chunking for large datasets</li>
									<li>• Transaction-like behavior</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='space-y-3'>
								<div className='flex items-center space-x-2'>
									<FileText className='w-5 h-5 text-green-600' />
									<h3 className='font-semibold text-foreground'>
										Error Handling
									</h3>
								</div>
								<p className='text-sm text-muted-foreground'>
									Implement robust error handling with retries, rate limiting,
									and structured error responses.
								</p>
								<ul className='text-sm text-muted-foreground space-y-1'>
									<li>• Automatic retry with exponential backoff</li>
									<li>• Rate limit handling</li>
									<li>• Structured error messages</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='space-y-3'>
								<div className='flex items-center space-x-2'>
									<Download className='w-5 h-5 text-purple-600' />
									<h3 className='font-semibold text-foreground'>
										Data Synchronization
									</h3>
								</div>
								<p className='text-sm text-muted-foreground'>
									Keep your local data in sync with YDV using webhooks and
									incremental updates.
								</p>
								<ul className='text-sm text-muted-foreground space-y-1'>
									<li>• Real-time webhook integration</li>
									<li>• Incremental sync strategies</li>
									<li>• Conflict resolution</li>
								</ul>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='space-y-3'>
								<div className='flex items-center space-x-2'>
									<ExternalLink className='w-5 h-5 text-orange-600' />
									<h3 className='font-semibold text-foreground'>
										Authentication
									</h3>
								</div>
								<p className='text-sm text-muted-foreground'>
									Securely authenticate API requests using API keys or JWT
									tokens with proper rotation.
								</p>
								<ul className='text-sm text-muted-foreground space-y-1'>
									<li>• API key management</li>
									<li>• JWT token refresh</li>
									<li>• Environment-based configuration</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<Separator />

			{/* Community SDKs */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Community SDKs & Examples
					</h2>
					<p className='text-muted-foreground'>
						Third-party SDKs and examples contributed by the community.
					</p>
				</div>

				<Card>
					<CardContent className='p-6'>
						<div className='text-center space-y-4'>
							<div className='p-4 bg-muted/50 rounded-lg'>
								<Github className='w-12 h-12 mx-auto text-muted-foreground mb-2' />
								<h3 className='font-semibold text-foreground'>
									Community Contributions
								</h3>
								<p className='text-sm text-muted-foreground'>
									Find community-maintained SDKs and examples on GitHub
								</p>
							</div>
							<div className='flex justify-center space-x-4'>
								<Button
									variant='outline'
									onClick={() =>
										window.open(
											"https://github.com/ydv-digital/community-sdks",
											"_blank",
										)
									}>
									<Github className='w-4 h-4 mr-2' />
									Browse on GitHub
								</Button>
								<Button
									variant='outline'
									onClick={() =>
										window.open(
											"https://github.com/ydv-digital/examples",
											"_blank",
										)
									}>
									<Code className='w-4 h-4 mr-2' />
									View Examples
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Separator />

			{/* Next Steps */}
			<div className='space-y-4'>
				<h2 className='text-2xl font-semibold text-foreground'>Next Steps</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Link href='/docs/api/authentication'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											API Authentication
										</h3>
										<p className='text-sm text-muted-foreground'>
											Set up secure authentication for your API requests
										</p>
									</div>
									<ArrowRight className='w-5 h-5 text-muted-foreground' />
								</div>
							</CardContent>
						</Card>
					</Link>

					<Link href='/docs/api/webhooks'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											Webhook Integration
										</h3>
										<p className='text-sm text-muted-foreground'>
											Receive real-time notifications about data changes
										</p>
									</div>
									<ArrowRight className='w-5 h-5 text-muted-foreground' />
								</div>
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default SDKExamplesPage;
