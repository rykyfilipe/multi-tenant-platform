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
	Zap,
	Database,
	Filter,
	Search,
	BarChart3,
	Clock,
	ArrowRight,
	CheckCircle,
	AlertTriangle,
	Info,
	TrendingUp,
	Target,
	Gauge,
} from "lucide-react";

const QueryOptimizationPage = () => {
	const { t } = useLanguage();

	const optimizationTechniques = [
		{
			technique: "Proper Filtering",
			icon: <Filter className='w-6 h-6' />,
			description:
				"Use efficient filters to reduce the amount of data processed",
			impact: "High",
			difficulty: "Easy",
			tips: [
				"Filter at the API level, not client-side",
				"Use specific column filters instead of searching all fields",
				"Combine multiple filters for more precise results",
				"Use indexed columns for filtering when possible",
			],
			example: {
				bad: "Fetch all customers, then filter in JavaScript",
				good: "Use API filters: ?filter[status]=active&filter[created_at]=2024-01-01",
			},
		},
		{
			technique: "Smart Pagination",
			icon: <BarChart3 className='w-6 h-6' />,
			description: "Load data in smaller, manageable chunks",
			impact: "High",
			difficulty: "Easy",
			tips: [
				"Use reasonable page sizes (10-50 records)",
				"Implement cursor-based pagination for large datasets",
				"Show loading indicators during data fetching",
				"Cache previously loaded pages when appropriate",
			],
			example: {
				bad: "Load all 10,000 records at once",
				good: "Load 25 records per page with pagination",
			},
		},
		{
			technique: "Column Selection",
			icon: <Target className='w-6 h-6' />,
			description: "Only fetch the columns you actually need",
			impact: "Medium",
			difficulty: "Easy",
			tips: [
				"Specify only required fields in API calls",
				"Avoid fetching large text fields unless needed",
				"Use separate calls for detailed views",
				"Consider creating summary endpoints for lists",
			],
			example: {
				bad: "Fetch all columns including large description fields",
				good: "Only fetch id, name, status for list views",
			},
		},
		{
			technique: "Batch Operations",
			icon: <Database className='w-6 h-6' />,
			description: "Group multiple operations into single API calls",
			impact: "High",
			difficulty: "Medium",
			tips: [
				"Use bulk create/update endpoints",
				"Batch multiple related queries",
				"Reduce API roundtrips",
				"Handle partial failures gracefully",
			],
			example: {
				bad: "100 separate API calls to create 100 records",
				good: "Single bulk create call with 100 records",
			},
		},
		{
			technique: "Efficient Sorting",
			icon: <TrendingUp className='w-6 h-6' />,
			description: "Use database-level sorting instead of client-side sorting",
			impact: "Medium",
			difficulty: "Easy",
			tips: [
				"Sort at the API level using indexed columns",
				"Avoid sorting by computed or unindexed fields",
				"Use multiple sort criteria wisely",
				"Consider default sorting for better UX",
			],
			example: {
				bad: "Fetch all data and sort in JavaScript",
				good: "Use API sorting: ?sort=created_at:desc",
			},
		},
		{
			technique: "Query Caching",
			icon: <Gauge className='w-6 h-6' />,
			description: "Cache frequently accessed data to reduce load times",
			impact: "High",
			difficulty: "Medium",
			tips: [
				"Cache static or slowly-changing data",
				"Use appropriate cache TTL values",
				"Implement cache invalidation strategies",
				"Consider browser and server-side caching",
			],
			example: {
				bad: "Fetch dropdown options on every page load",
				good: "Cache dropdown data for 1 hour",
			},
		},
	];

	const performanceMetrics = [
		{
			metric: "Response Time",
			description: "How long API calls take to complete",
			target: "< 200ms for simple queries",
			measurement: "Time from request to response",
			tools: ["Browser DevTools", "API monitoring", "Performance profiler"],
		},
		{
			metric: "Throughput",
			description: "Number of requests handled per second",
			target: "> 100 requests/second",
			measurement: "Requests per second (RPS)",
			tools: ["Load testing tools", "API analytics", "Server monitoring"],
		},
		{
			metric: "Data Transfer",
			description: "Amount of data transferred per request",
			target: "< 100KB for list views",
			measurement: "Bytes transferred",
			tools: ["Browser DevTools", "Network analysis", "API response size"],
		},
		{
			metric: "Error Rate",
			description: "Percentage of failed requests",
			target: "< 1% error rate",
			measurement: "Failed requests / Total requests",
			tools: ["Error monitoring", "API logs", "User feedback"],
		},
	];

	const commonProblems = [
		{
			problem: "N+1 Query Problem",
			description: "Making multiple API calls when one would suffice",
			solution:
				"Use bulk operations or include related data in single requests",
			impact: "Critical",
			example: "Fetching user details for each item in a list separately",
		},
		{
			problem: "Over-fetching Data",
			description: "Retrieving more data than actually needed",
			solution: "Use field selection and proper filtering",
			impact: "High",
			example: "Loading full customer records when only names are needed",
		},
		{
			problem: "Client-side Processing",
			description: "Doing heavy processing on the client instead of server",
			solution: "Move filtering, sorting, and aggregation to the API",
			impact: "High",
			example: "Downloading all data to filter it in the browser",
		},
		{
			problem: "Lack of Caching",
			description: "Repeatedly fetching the same data",
			solution: "Implement appropriate caching strategies",
			impact: "Medium",
			example: "Loading user profile data on every page navigation",
		},
		{
			problem: "Synchronous Operations",
			description: "Blocking the UI while waiting for data",
			solution: "Use asynchronous operations and loading states",
			impact: "Medium",
			example: "Freezing the interface during large data imports",
		},
	];

	const monitoringTools = [
		{
			tool: "YDV Analytics Dashboard",
			description: "Built-in performance monitoring for your API usage",
			features: [
				"Request timing",
				"Error tracking",
				"Usage patterns",
				"Performance alerts",
			],
			access: "Available in your dashboard under Analytics",
		},
		{
			tool: "Browser DevTools",
			description: "Client-side performance analysis and debugging",
			features: [
				"Network timing",
				"Resource usage",
				"JavaScript profiling",
				"Memory analysis",
			],
			access: "F12 in most browsers",
		},
		{
			tool: "API Response Headers",
			description: "Server-provided performance information",
			features: [
				"Execution time",
				"Query count",
				"Cache status",
				"Rate limit info",
			],
			access: "Check HTTP response headers",
		},
		{
			tool: "Third-party APM",
			description: "Application Performance Monitoring tools",
			features: [
				"End-to-end tracing",
				"Real user monitoring",
				"Error tracking",
				"Performance insights",
			],
			access: "Tools like New Relic, DataDog, or Sentry",
		},
	];

	return (
		<div className='max-w-6xl mx-auto p-6 space-y-8'>
			{/* Header */}
			<div className='space-y-4'>
				<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
					<Link href='/docs' className='hover:text-foreground'>
						Documentation
					</Link>
					<span>/</span>
					<Link href='/docs/performance' className='hover:text-foreground'>
						Performance
					</Link>
					<span>/</span>
					<span className='text-foreground'>Query Optimization</span>
				</div>

				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-foreground'>
						Query Optimization Guide
					</h1>
					<p className='text-lg text-muted-foreground'>
						Learn how to optimize your database queries and API usage for better
						performance and faster response times.
					</p>
				</div>

				<div className='flex items-center space-x-4'>
					<Badge variant='secondary'>
						<Clock className='w-3 h-3 mr-1' />
						15 min read
					</Badge>
					<Badge variant='outline'>Performance</Badge>
					<Badge variant='outline'>Optimization</Badge>
					<Badge variant='outline'>Queries</Badge>
				</div>
			</div>

			<Separator />

			{/* Why Query Optimization Matters */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Why Query Optimization Matters
					</h2>
					<p className='text-muted-foreground'>
						Optimized queries lead to faster applications, better user
						experience, and lower infrastructure costs.
					</p>
				</div>

				<Card>
					<CardContent className='p-6'>
						<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-blue-500/10 text-blue-600 rounded-lg w-fit mx-auto'>
									<Zap className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>
										Faster Response
									</h3>
									<p className='text-sm text-muted-foreground'>
										Reduce query execution time by up to 90%
									</p>
								</div>
							</div>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-green-500/10 text-green-600 rounded-lg w-fit mx-auto'>
									<TrendingUp className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>Better UX</h3>
									<p className='text-sm text-muted-foreground'>
										Improve user satisfaction with snappy interfaces
									</p>
								</div>
							</div>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-purple-500/10 text-purple-600 rounded-lg w-fit mx-auto'>
									<Database className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>Lower Costs</h3>
									<p className='text-sm text-muted-foreground'>
										Reduce server load and infrastructure expenses
									</p>
								</div>
							</div>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-orange-500/10 text-orange-600 rounded-lg w-fit mx-auto'>
									<Gauge className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>Scalability</h3>
									<p className='text-sm text-muted-foreground'>
										Handle more users with the same resources
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Separator />

			{/* Optimization Techniques */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Key Optimization Techniques
					</h2>
					<p className='text-muted-foreground'>
						Practical strategies to improve query performance and reduce load
						times.
					</p>
				</div>

				<div className='space-y-6'>
					{optimizationTechniques.map((technique, index) => (
						<Card key={index} className='hover:shadow-md transition-shadow'>
							<CardHeader>
								<div className='flex items-start space-x-3'>
									<div className='p-2 bg-blue-500/10 text-blue-600 rounded-lg'>
										{technique.icon}
									</div>
									<div className='space-y-1 flex-1'>
										<div className='flex items-center justify-between'>
											<CardTitle className='text-lg'>
												{technique.technique}
											</CardTitle>
											<div className='flex space-x-2'>
												<Badge
													variant={
														technique.impact === "High"
															? "default"
															: "secondary"
													}
													className='text-xs'>
													{technique.impact} Impact
												</Badge>
												<Badge
													variant={
														technique.difficulty === "Easy"
															? "outline"
															: "secondary"
													}
													className='text-xs'>
													{technique.difficulty}
												</Badge>
											</div>
										</div>
										<CardDescription>{technique.description}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Implementation Tips:
										</h4>
										<ul className='text-sm text-muted-foreground space-y-1'>
											{technique.tips.map((tip, idx) => (
												<li key={idx} className='flex items-start'>
													<CheckCircle className='w-3 h-3 mr-2 text-green-600 mt-0.5 flex-shrink-0' />
													{tip}
												</li>
											))}
										</ul>
									</div>
									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Example:
										</h4>
										<div className='space-y-2'>
											<div className='p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs'>
												<span className='text-red-600 font-medium'>
													❌ Avoid:{" "}
												</span>
												<span className='text-red-700 dark:text-red-300'>
													{technique.example.bad}
												</span>
											</div>
											<div className='p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-xs'>
												<span className='text-green-600 font-medium'>
													✅ Better:{" "}
												</span>
												<span className='text-green-700 dark:text-green-300'>
													{technique.example.good}
												</span>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Performance Metrics */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Key Performance Metrics
					</h2>
					<p className='text-muted-foreground'>
						Important metrics to monitor and their recommended targets.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{performanceMetrics.map((metric, index) => (
						<Card key={index}>
							<CardContent className='p-6'>
								<div className='space-y-4'>
									<div>
										<h3 className='font-semibold text-foreground'>
											{metric.metric}
										</h3>
										<p className='text-sm text-muted-foreground'>
											{metric.description}
										</p>
									</div>

									<div className='grid grid-cols-1 gap-3'>
										<div>
											<h4 className='font-medium text-sm text-foreground'>
												Target:
											</h4>
											<Badge variant='outline'>{metric.target}</Badge>
										</div>
										<div>
											<h4 className='font-medium text-sm text-foreground'>
												Measurement:
											</h4>
											<p className='text-sm text-muted-foreground'>
												{metric.measurement}
											</p>
										</div>
										<div>
											<h4 className='font-medium text-sm text-foreground'>
												Tools:
											</h4>
											<div className='flex flex-wrap gap-1'>
												{metric.tools.map((tool, idx) => (
													<Badge
														key={idx}
														variant='secondary'
														className='text-xs'>
														{tool}
													</Badge>
												))}
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Common Problems */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Common Performance Problems
					</h2>
					<p className='text-muted-foreground'>
						Identify and fix the most common performance issues in data queries.
					</p>
				</div>

				<div className='space-y-4'>
					{commonProblems.map((problem, index) => (
						<Card key={index}>
							<CardContent className='p-4'>
								<div className='flex items-start space-x-3'>
									<AlertTriangle className='w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0' />
									<div className='space-y-2 flex-1'>
										<div className='flex items-center justify-between'>
											<h3 className='font-semibold text-foreground'>
												{problem.problem}
											</h3>
											<Badge
												variant={
													problem.impact === "Critical"
														? "destructive"
														: problem.impact === "High"
														? "default"
														: "secondary"
												}
												className='text-xs'>
												{problem.impact} Impact
											</Badge>
										</div>
										<p className='text-sm text-muted-foreground'>
											{problem.description}
										</p>
										<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
											<div>
												<span className='font-medium text-foreground'>
													Solution:{" "}
												</span>
												<span className='text-muted-foreground'>
													{problem.solution}
												</span>
											</div>
											<div>
												<span className='font-medium text-foreground'>
													Example:{" "}
												</span>
												<span className='text-muted-foreground'>
													{problem.example}
												</span>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Monitoring Tools */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Performance Monitoring Tools
					</h2>
					<p className='text-muted-foreground'>
						Tools and techniques to monitor and analyze query performance.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{monitoringTools.map((tool, index) => (
						<Card key={index}>
							<CardContent className='p-6'>
								<div className='space-y-4'>
									<div>
										<h3 className='font-semibold text-foreground'>
											{tool.tool}
										</h3>
										<p className='text-sm text-muted-foreground'>
											{tool.description}
										</p>
									</div>

									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Features:
										</h4>
										<div className='flex flex-wrap gap-1'>
											{tool.features.map((feature, idx) => (
												<Badge
													key={idx}
													variant='secondary'
													className='text-xs'>
													{feature}
												</Badge>
											))}
										</div>
									</div>

									<div>
										<h4 className='font-medium text-sm text-foreground mb-1'>
											Access:
										</h4>
										<p className='text-sm text-muted-foreground'>
											{tool.access}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Next Steps */}
			<div className='space-y-4'>
				<h2 className='text-2xl font-semibold text-foreground'>Next Steps</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Link href='/docs/performance/caching'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											Caching Strategies
										</h3>
										<p className='text-sm text-muted-foreground'>
											Learn how to implement effective caching
										</p>
									</div>
									<ArrowRight className='w-5 h-5 text-muted-foreground' />
								</div>
							</CardContent>
						</Card>
					</Link>

					<Link href='/docs/performance/monitoring'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											Performance Monitoring
										</h3>
										<p className='text-sm text-muted-foreground'>
											Track and analyze performance metrics
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

export default QueryOptimizationPage;
