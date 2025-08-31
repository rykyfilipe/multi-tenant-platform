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
	Database,
	Table,
	Plus,
	Settings,
	Users,
	ArrowRight,
	CheckCircle,
	Info,
	Lightbulb,
	AlertTriangle,
} from "lucide-react";

const FirstDatabasePage = () => {
	const { t } = useLanguage();

	const steps = [
		{
			step: 1,
			title: "Create Your First Database",
			description: "Start by creating a new database to organize your data",
			details: [
				"Click the 'Create Database' button in the dashboard",
				"Enter a descriptive name for your database (e.g., 'Customer Management')",
				"Add an optional description to explain the purpose",
				"Choose your database settings and click 'Create'",
			],
			icon: <Database className='w-6 h-6' />,
			estimatedTime: "2 minutes",
		},
		{
			step: 2,
			title: "Design Your First Table",
			description: "Create a table structure that fits your data needs",
			details: [
				"Click 'Add Table' within your new database",
				"Name your table (e.g., 'Customers')",
				"Add columns for each piece of information you want to store",
				"Set appropriate data types and constraints",
			],
			icon: <Table className='w-6 h-6' />,
			estimatedTime: "5 minutes",
		},
		{
			step: 3,
			title: "Add Sample Data",
			description:
				"Populate your table with initial data to test the structure",
			details: [
				"Use the 'Add Row' button to manually enter data",
				"Import data from CSV/Excel files if you have existing data",
				"Verify that your data displays correctly",
				"Test any relationships or constraints you've set up",
			],
			icon: <Plus className='w-6 h-6' />,
			estimatedTime: "3 minutes",
		},
		{
			step: 4,
			title: "Configure Permissions",
			description: "Set up access controls for your team members",
			details: [
				"Go to the Users section in your dashboard",
				"Invite team members by email address",
				"Assign appropriate roles and permissions",
				"Test access levels to ensure security",
			],
			icon: <Users className='w-6 h-6' />,
			estimatedTime: "5 minutes",
		},
	];

	const columnTypes = [
		{
			type: "Text",
			description: "Store names, descriptions, and other text data",
			example: "Customer name, product description",
			recommended: true,
		},
		{
			type: "Number",
			description: "Store numerical values like prices, quantities, IDs",
			example: "Price, quantity, customer ID",
			recommended: true,
		},
		{
			type: "Date",
			description: "Store dates and timestamps",
			example: "Created date, birth date, order date",
			recommended: true,
		},
		{
			type: "Boolean",
			description: "Store true/false values",
			example: "Is active, is verified, has subscription",
			recommended: false,
		},
		{
			type: "Reference",
			description: "Link to other tables (advanced feature)",
			example: "Customer ID linking to customer table",
			recommended: false,
		},
	];

	const bestPractices = [
		"Use descriptive names for databases, tables, and columns",
		"Plan your table structure before creating it",
		"Start with essential columns and add more as needed",
		"Use appropriate data types for each column",
		"Consider future scalability when designing your schema",
		"Test your structure with sample data before going live",
	];

	const commonMistakes = [
		"Creating too many columns initially",
		"Using generic names like 'field1', 'field2'",
		"Not considering data relationships",
		"Overcomplicating the structure at the beginning",
		"Forgetting to set up proper permissions",
	];

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='space-y-4'>
				<div className='flex items-center gap-3'>
					<Badge variant='secondary' className='text-sm'>
						Getting Started
					</Badge>
					<Badge variant='outline' className='text-sm'>
						5 min read
					</Badge>
				</div>
				<h1 className='text-4xl font-bold text-foreground'>
					{t("docs.firstDatabase.title") || "Create Your First Database"}
				</h1>
				<p className='text-xl text-muted-foreground'>
					{t("docs.firstDatabase.subtitle") ||
						"Learn how to create your first database and table in just a few minutes. This guide will walk you through the essential steps to get started."}
				</p>
			</div>

			{/* Prerequisites */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Info className='w-5 h-5 text-blue-600' />
						{t("docs.firstDatabase.prerequisites.title") || "Prerequisites"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className='space-y-2'>
						<li className='flex items-center gap-2'>
							<CheckCircle className='w-4 h-4 text-green-600' />
							{t("docs.firstDatabase.prerequisites.account") ||
								"A DataHub account (free tier available)"}
						</li>
						<li className='flex items-center gap-2'>
							<CheckCircle className='w-4 h-4 text-green-600' />
							{t("docs.firstDatabase.prerequisites.access") ||
								"Access to the dashboard"}
						</li>
						<li className='flex items-center gap-2'>
							<CheckCircle className='w-4 h-4 text-green-600' />
							{t("docs.firstDatabase.prerequisites.plan") ||
								"Basic understanding of data organization"}
						</li>
					</ul>
				</CardContent>
			</Card>

			{/* Step-by-Step Guide */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.firstDatabase.steps.title") || "Step-by-Step Guide"}
				</h2>

				<div className='space-y-6'>
					{steps.map((step, index) => (
						<Card key={index} className='overflow-hidden'>
							<CardHeader className='bg-muted/30'>
								<div className='flex items-center gap-4'>
									<div className='flex items-center justify-center w-12 h-12 bg-primary rounded-full text-primary-foreground font-bold text-lg'>
										{step.step}
									</div>
									<div className='flex-1'>
										<div className='flex items-center gap-3 mb-2'>
											{step.icon}
											<CardTitle className='text-xl'>{step.title}</CardTitle>
										</div>
										<CardDescription className='text-base'>
											{step.description}
										</CardDescription>
									</div>
									<Badge variant='outline' className='text-xs'>
										{step.estimatedTime}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className='p-6'>
								<ul className='space-y-2'>
									{step.details.map((detail, detailIndex) => (
										<li key={detailIndex} className='flex items-start gap-2'>
											<div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0' />
											<span className='text-sm'>{detail}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Column Types Guide */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.firstDatabase.columnTypes.title") ||
						"Understanding Column Types"}
				</h2>

				<Card>
					<CardContent className='p-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{columnTypes.map((column, index) => (
								<div key={index} className='border rounded-lg p-4'>
									<div className='flex items-center justify-between mb-2'>
										<h4 className='font-medium text-foreground'>
											{column.type}
										</h4>
										{column.recommended && (
											<Badge variant='secondary' className='text-xs'>
												Recommended
											</Badge>
										)}
									</div>
									<p className='text-sm text-muted-foreground mb-2'>
										{column.description}
									</p>
									<p className='text-xs text-muted-foreground'>
										<strong>Example:</strong> {column.example}
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Best Practices */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.firstDatabase.bestPractices.title") || "Best Practices"}
				</h2>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Lightbulb className='w-5 h-5 text-yellow-600' />
							{t("docs.firstDatabase.bestPractices.subtitle") ||
								"Tips for Success"}
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
					{t("docs.firstDatabase.mistakes.title") || "Common Mistakes to Avoid"}
				</h2>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertTriangle className='w-5 h-5 text-orange-600' />
							{t("docs.firstDatabase.mistakes.subtitle") || "Learn from Others"}
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

			{/* Next Steps */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.firstDatabase.nextSteps.title") || "What's Next?"}
				</h2>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Link href='/docs/getting-started/dashboard'>
						<Card className='hover:shadow-lg transition-all duration-200 cursor-pointer group'>
							<CardContent className='p-6'>
								<div className='flex items-center gap-3 mb-3'>
									<Settings className='w-6 h-6 text-primary' />
									<ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
								</div>
								<h3 className='font-semibold text-foreground mb-1'>
									{t("docs.firstDatabase.nextSteps.dashboard") ||
										"Dashboard Overview"}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{t("docs.firstDatabase.nextSteps.dashboardDesc") ||
										"Learn how to navigate and use the main dashboard effectively"}
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link href='/docs/getting-started/user-management'>
						<Card className='hover:shadow-lg transition-all duration-200 cursor-pointer group'>
							<CardContent className='p-6'>
								<div className='flex items-center gap-3 mb-3'>
									<Users className='w-6 h-6 text-primary' />
									<ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
								</div>
								<h3 className='font-semibold text-foreground mb-1'>
									{t("docs.firstDatabase.nextSteps.users") || "User Management"}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{t("docs.firstDatabase.nextSteps.usersDesc") ||
										"Invite team members and set up proper permissions"}
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
						{t("docs.firstDatabase.help.title") || "Need Help?"}
					</h3>
					<p className='text-sm text-muted-foreground mb-4'>
						{t("docs.firstDatabase.help.description") ||
							"Stuck on any of these steps? Our support team is here to help you succeed."}
					</p>
					<div className='flex flex-col sm:flex-row gap-3 justify-center'>
						<Link href='/docs/help'>
							<Button variant='outline' size='sm'>
								{t("docs.firstDatabase.help.helpCenter") || "Help Center"}
							</Button>
						</Link>
						<Link href='/#contact'>
							<Button size='sm'>
								{t("docs.firstDatabase.help.contact") || "Contact Support"}
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default FirstDatabasePage;
