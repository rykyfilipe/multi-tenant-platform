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
import {
	Database,
	Table,
	Columns,
	Link as LinkIcon,
	Key,
	CheckCircle,
	AlertTriangle,
	Info,
	Lightbulb,
	ArrowRight,
	Code,
} from "lucide-react";

const SchemaDesignPage = () => {
	const { t } = useLanguage();

	const designPrinciples = [
		{
			title: "Normalization",
			description:
				"Organize data to reduce redundancy and improve data integrity",
			examples: [
				"Separate customer information from order details",
				"Create lookup tables for common values",
				"Avoid storing the same data in multiple places",
			],
			icon: <Table className='w-5 h-5' />,
			color: "text-blue-600",
		},
		{
			title: "Consistency",
			description: "Use consistent naming conventions and data types",
			examples: [
				"Use snake_case for table and column names",
				"Standardize date formats across all tables",
				"Maintain consistent ID naming patterns",
			],
			icon: <Columns className='w-5 h-5' />,
			color: "text-green-600",
		},
		{
			title: "Scalability",
			description: "Design for future growth and performance",
			examples: [
				"Plan for data volume increases",
				"Consider query performance implications",
				"Design flexible schemas that can evolve",
			],
			icon: <Database className='w-5 h-5' />,
			color: "text-purple-600",
		},
	];

	const commonPatterns = [
		{
			title: "Audit Trail",
			description: "Track changes and maintain history",
			columns: [
				"created_at (timestamp)",
				"updated_at (timestamp)",
				"created_by (user_id)",
				"updated_by (user_id)",
			],
			useCase: "All tables that need change tracking",
			icon: <CheckCircle className='w-5 h-5' />,
		},
		{
			title: "Soft Delete",
			description: "Mark records as deleted without removing them",
			columns: ["deleted_at (timestamp)", "is_deleted (boolean)"],
			useCase: "Tables where data recovery might be needed",
			icon: <AlertTriangle className='w-5 h-5' />,
		},
		{
			title: "Status Management",
			description: "Track the state of records",
			columns: [
				"status (enum/text)",
				"status_changed_at (timestamp)",
				"status_notes (text)",
			],
			useCase: "Workflow-based tables (orders, tasks, etc.)",
			icon: <Info className='w-5 h-5' />,
		},
		{
			title: "Hierarchical Data",
			description: "Store parent-child relationships",
			columns: [
				"parent_id (reference)",
				"level (integer)",
				"path (text/array)",
			],
			useCase: "Categories, organizational structures, comments",
			icon: <LinkIcon className='w-5 h-5' />,
		},
	];

	const bestPractices = [
		"Always include a primary key (ID) for each table",
		"Use descriptive names that clearly indicate the table's purpose",
		"Keep table names singular (e.g., 'user' not 'users')",
		"Use consistent naming conventions across all tables",
		"Consider adding indexes for frequently queried columns",
		"Plan for data relationships and foreign keys early",
		"Document your schema design decisions",
		"Test your design with realistic data volumes",
	];

	const commonMistakes = [
		"Creating tables with too many columns (aim for <20 columns)",
		"Using generic names like 'data' or 'info'",
		"Storing calculated values instead of computing them",
		"Creating unnecessary tables for simple data",
		"Ignoring data type constraints and validation",
		"Not considering query performance during design",
		"Over-normalizing simple data structures",
	];

	const exampleSchemas = [
		{
			title: "E-commerce System",
			description: "Basic structure for online store",
			tables: [
				{
					name: "users",
					columns: ["id", "email", "name", "created_at", "updated_at"],
					purpose: "Store customer information",
				},
				{
					name: "products",
					columns: [
						"id",
						"name",
						"description",
						"price",
						"category_id",
						"created_at",
					],
					purpose: "Product catalog",
				},
				{
					name: "orders",
					columns: ["id", "user_id", "total", "status", "created_at"],
					purpose: "Customer orders",
				},
				{
					name: "order_items",
					columns: ["id", "order_id", "product_id", "quantity", "price"],
					purpose: "Individual items in orders",
				},
			],
		},
		{
			title: "Project Management",
			description: "Structure for managing projects and tasks",
			tables: [
				{
					name: "projects",
					columns: [
						"id",
						"name",
						"description",
						"status",
						"start_date",
						"end_date",
					],
					purpose: "Project information",
				},
				{
					name: "tasks",
					columns: [
						"id",
						"project_id",
						"title",
						"description",
						"assignee_id",
						"status",
					],
					purpose: "Individual tasks",
				},
				{
					name: "users",
					columns: ["id", "name", "email", "role", "created_at"],
					purpose: "Team members",
				},
			],
		},
	];

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='space-y-4'>
				<div className='flex items-center gap-3'>
					<Badge variant='secondary' className='text-sm'>
						Database
					</Badge>
					<Badge variant='outline' className='text-sm'>
						10 min read
					</Badge>
				</div>
				<h1 className='text-4xl font-bold text-foreground'>
					{t("docs.schemaDesign.title") || "Database Schema Design"}
				</h1>
				<p className='text-xl text-muted-foreground'>
					{t("docs.schemaDesign.subtitle") ||
						"Learn the fundamentals of designing efficient and scalable database schemas. Follow best practices to create robust data structures that grow with your needs."}
				</p>
			</div>

			{/* Overview */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Database className='w-5 h-5 text-primary' />
						{t("docs.schemaDesign.overview.title") || "What is Schema Design?"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground mb-4'>
						{t("docs.schemaDesign.overview.description") ||
							"Schema design is the process of planning and organizing your database structure. It involves deciding what tables to create, how to organize data within them, and how tables relate to each other."}
					</p>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='text-center p-4 bg-muted/30 rounded-lg'>
							<Table className='w-8 h-8 text-blue-600 mx-auto mb-2' />
							<h4 className='font-medium text-foreground mb-1'>Structure</h4>
							<p className='text-sm text-muted-foreground'>
								Organize data logically
							</p>
						</div>
						<div className='text-center p-4 bg-muted/30 rounded-lg'>
							<LinkIcon className='w-8 h-8 text-green-600 mx-auto mb-2' />
							<h4 className='font-medium text-foreground mb-1'>
								Relationships
							</h4>
							<p className='text-sm text-muted-foreground'>
								Connect related data
							</p>
						</div>
						<div className='text-center p-4 bg-muted/30 rounded-lg'>
							<h4 className='font-medium text-foreground mb-1'>Performance</h4>
							<p className='text-sm text-muted-foreground'>
								Optimize for speed
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Design Principles */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.schemaDesign.principles.title") || "Core Design Principles"}
				</h2>

				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					{designPrinciples.map((principle, index) => (
						<Card key={index} className='overflow-hidden'>
							<CardHeader className='bg-muted/30'>
								<div className='flex items-center gap-3 mb-2'>
									<div className={principle.color}>{principle.icon}</div>
									<CardTitle className='text-lg'>{principle.title}</CardTitle>
								</div>
								<CardDescription className='text-base'>
									{principle.description}
								</CardDescription>
							</CardHeader>
							<CardContent className='p-4'>
								<ul className='space-y-1'>
									{principle.examples.map((example, exampleIndex) => (
										<li
											key={exampleIndex}
											className='flex items-start gap-2 text-sm'>
											<div className='w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0' />
											<span>{example}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Common Patterns */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.schemaDesign.patterns.title") || "Common Design Patterns"}
				</h2>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{commonPatterns.map((pattern, index) => (
						<Card key={index} className='overflow-hidden'>
							<CardHeader className='bg-muted/30'>
								<div className='flex items-center gap-3 mb-2'>
									{pattern.icon}
									<CardTitle className='text-lg'>{pattern.title}</CardTitle>
								</div>
								<CardDescription className='text-base'>
									{pattern.description}
								</CardDescription>
							</CardHeader>
							<CardContent className='p-4'>
								<div className='space-y-3'>
									<div>
										<h4 className='font-medium text-sm text-muted-foreground mb-1'>
											Recommended Columns:
										</h4>
										<div className='space-y-1'>
											{pattern.columns.map((column, colIndex) => (
												<div
													key={colIndex}
													className='text-sm font-mono bg-muted px-2 py-1 rounded'>
													{column}
												</div>
											))}
										</div>
									</div>
									<div>
										<h4 className='font-medium text-sm text-muted-foreground mb-1'>
											Use Case:
										</h4>
										<p className='text-sm'>{pattern.useCase}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Best Practices */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.schemaDesign.bestPractices.title") || "Best Practices"}
				</h2>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Lightbulb className='w-5 h-5 text-yellow-600' />
							{t("docs.schemaDesign.bestPractices.subtitle") ||
								"Follow These Guidelines"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{bestPractices.map((practice, index) => (
								<div key={index} className='flex items-start gap-2'>
									<CheckCircle className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
									<span className='text-sm'>{practice}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Common Mistakes */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.schemaDesign.mistakes.title") || "Common Mistakes to Avoid"}
				</h2>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertTriangle className='w-5 h-5 text-orange-600' />
							{t("docs.schemaDesign.mistakes.subtitle") || "Learn from Others"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{commonMistakes.map((mistake, index) => (
								<div key={index} className='flex items-start gap-2'>
									<div className='w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0' />
									<span className='text-sm'>{mistake}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Example Schemas */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.schemaDesign.examples.title") || "Example Schemas"}
				</h2>

				<div className='space-y-6'>
					{exampleSchemas.map((schema, index) => (
						<Card key={index} className='overflow-hidden'>
							<CardHeader className='bg-muted/30'>
								<CardTitle className='text-xl'>{schema.title}</CardTitle>
								<CardDescription className='text-base'>
									{schema.description}
								</CardDescription>
							</CardHeader>
							<CardContent className='p-6'>
								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
									{schema.tables.map((table, tableIndex) => (
										<div key={tableIndex} className='border rounded-lg p-4'>
											<h4 className='font-medium text-foreground mb-2'>
												{table.name}
											</h4>
											<p className='text-sm text-muted-foreground mb-3'>
												{table.purpose}
											</p>
											<div className='space-y-1'>
												{table.columns.map((column, colIndex) => (
													<div
														key={colIndex}
														className='text-xs bg-muted px-2 py-1 rounded font-mono'>
														{column}
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Design Process */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.schemaDesign.process.title") || "Design Process"}
				</h2>

				<Card>
					<CardContent className='p-6'>
						<div className='space-y-6'>
							<div className='flex items-start gap-4'>
								<div className='flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold text-sm'>
									1
								</div>
								<div>
									<h4 className='font-medium text-foreground mb-1'>
										Requirements Analysis
									</h4>
									<p className='text-sm text-muted-foreground'>
										Understand what data you need to store and how it will be
										used
									</p>
								</div>
							</div>
							<div className='flex items-start gap-4'>
								<div className='flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold text-sm'>
									2
								</div>
								<div>
									<h4 className='font-medium text-foreground mb-1'>
										Entity Identification
									</h4>
									<p className='text-sm text-muted-foreground'>
										Identify the main entities (tables) and their attributes
									</p>
								</div>
							</div>
							<div className='flex items-start gap-4'>
								<div className='flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold text-sm'>
									3
								</div>
								<div>
									<h4 className='font-medium text-foreground mb-1'>
										Relationship Mapping
									</h4>
									<p className='text-sm text-muted-foreground'>
										Define how tables relate to each other
									</p>
								</div>
							</div>
							<div className='flex items-start gap-4'>
								<div className='flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold text-sm'>
									4
								</div>
								<div>
									<h4 className='font-medium text-foreground mb-1'>
										Normalization
									</h4>
									<p className='text-sm text-muted-foreground'>
										Organize data to eliminate redundancy
									</p>
								</div>
							</div>
							<div className='flex items-start gap-4'>
								<div className='flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold text-sm'>
									5
								</div>
								<div>
									<h4 className='font-medium text-foreground mb-1'>
										Review & Iterate
									</h4>
									<p className='text-sm text-muted-foreground'>
										Test your design and refine as needed
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Next Steps */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.schemaDesign.nextSteps.title") || "What's Next?"}
				</h2>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Link href='/docs/database/column-types'>
						<Card className='hover:shadow-lg transition-all duration-200 cursor-pointer group'>
							<CardContent className='p-6'>
								<div className='flex items-center gap-3 mb-3'>
									<Columns className='w-6 h-6 text-primary' />
									<ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
								</div>
								<h3 className='font-semibold text-foreground mb-1'>
									{t("docs.schemaDesign.nextSteps.columnTypes") ||
										"Column Types"}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{t("docs.schemaDesign.nextSteps.columnTypesDesc") ||
										"Learn about different column types and when to use them"}
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link href='/docs/database/import-export'>
						<Card className='hover:shadow-lg transition-all duration-200 cursor-pointer group'>
							<CardContent className='p-6'>
								<div className='flex items-center gap-3 mb-3'>
									<Database className='w-6 h-6 text-primary' />
									<ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
								</div>
								<h3 className='font-semibold text-foreground mb-1'>
									{t("docs.schemaDesign.nextSteps.importExport") ||
										"Import/Export"}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{t("docs.schemaDesign.nextSteps.importExportDesc") ||
										"Learn how to populate your tables with data"}
								</p>
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>

			{/* Help Section */}
			<Card className='bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20'>
				<CardContent className='p-6 text-center'>
					<h3 className='text-lg font-semibold text-foreground mb-2'>
						{t("docs.schemaDesign.help.title") || "Need Help?"}
					</h3>
					<p className='text-sm text-muted-foreground mb-4'>
						{t("docs.schemaDesign.help.description") ||
							"Struggling with schema design? Our support team can help you plan the right structure for your data."}
					</p>
					<div className='flex flex-col sm:flex-row gap-3 justify-center'>
						<Link href='/docs/help'>
							<Button variant='outline' size='sm'>
								{t("docs.schemaDesign.help.helpCenter") || "Help Center"}
							</Button>
						</Link>
						<Link href='/#contact'>
							<Button size='sm'>
								{t("docs.schemaDesign.help.contact") || "Contact Support"}
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default SchemaDesignPage;
