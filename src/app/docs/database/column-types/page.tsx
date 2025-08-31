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
	Type,
	Hash,
	Calendar,
	ToggleLeft,
	Link as LinkIcon,
	Mail,
	Globe,
	FileText,
	Image,
	Clock,
	DollarSign,
	ArrowRight,
	CheckCircle,
	Info,
	Lightbulb,
	AlertTriangle,
} from "lucide-react";

const ColumnTypesPage = () => {
	const { t } = useLanguage();

	const columnTypes = [
		{
			type: "Text",
			icon: <Type className='w-6 h-6' />,
			description: "Store names, descriptions, and other text data",
			examples: ["Customer name", "Product description", "Address"],
			options: ["Max length", "Required field", "Default value"],
			useCase: "Best for storing any text content up to 255 characters",
			color: "bg-blue-500/10 text-blue-600",
		},
		{
			type: "Long Text",
			icon: <FileText className='w-6 h-6' />,
			description: "Store large text content like articles or descriptions",
			examples: ["Blog posts", "Product details", "Comments"],
			options: ["Rich text editor", "Required field", "Default value"],
			useCase: "Perfect for content that exceeds 255 characters",
			color: "bg-indigo-500/10 text-indigo-600",
		},
		{
			type: "Number",
			icon: <Hash className='w-6 h-6' />,
			description: "Store numerical values like prices, quantities, IDs",
			examples: ["Price", "Quantity", "Customer ID", "Rating"],
			options: ["Min/Max values", "Decimal places", "Required field"],
			useCase: "Use for any numerical data and calculations",
			color: "bg-green-500/10 text-green-600",
		},
		{
			type: "Date",
			icon: <Calendar className='w-6 h-6' />,
			description: "Store dates and times",
			examples: ["Created date", "Birthday", "Deadline", "Event date"],
			options: ["Date format", "Include time", "Default to today"],
			useCase: "Perfect for tracking when things happen",
			color: "bg-purple-500/10 text-purple-600",
		},
		{
			type: "Boolean",
			icon: <ToggleLeft className='w-6 h-6' />,
			description: "True/false values for yes/no decisions",
			examples: ["Is active", "Published", "Paid", "Completed"],
			options: ["Default value", "Required field"],
			useCase: "Great for status flags and binary choices",
			color: "bg-orange-500/10 text-orange-600",
		},
		{
			type: "Email",
			icon: <Mail className='w-6 h-6' />,
			description: "Email addresses with automatic validation",
			examples: ["User email", "Contact email", "Support email"],
			options: ["Required field", "Unique values", "Default value"],
			useCase: "Ensures proper email format validation",
			color: "bg-red-500/10 text-red-600",
		},
		{
			type: "URL",
			icon: <Globe className='w-6 h-6' />,
			description: "Website URLs and links",
			examples: ["Company website", "Social media", "Documentation"],
			options: ["Required field", "Open in new tab"],
			useCase: "Store and validate web addresses",
			color: "bg-cyan-500/10 text-cyan-600",
		},
		{
			type: "Currency",
			icon: <DollarSign className='w-6 h-6' />,
			description: "Monetary values with currency formatting",
			examples: ["Product price", "Salary", "Budget", "Revenue"],
			options: ["Currency type", "Decimal places", "Min/Max values"],
			useCase: "Perfect for financial data with proper formatting",
			color: "bg-emerald-500/10 text-emerald-600",
		},
		{
			type: "Reference",
			icon: <LinkIcon className='w-6 h-6' />,
			description: "Link to records in other tables",
			examples: ["Customer ID", "Product category", "Assigned user"],
			options: ["Reference table", "Display field", "Multiple selections"],
			useCase: "Create relationships between different data tables",
			color: "bg-violet-500/10 text-violet-600",
		},
		{
			type: "Image",
			icon: <Image className='w-6 h-6' />,
			description: "Store and display images",
			examples: ["Product photos", "Profile pictures", "Logos"],
			options: ["Image size limits", "Allowed formats", "Thumbnail size"],
			useCase: "Upload and manage image files",
			color: "bg-pink-500/10 text-pink-600",
		},
	];

	const bestPractices = [
		{
			title: "Choose the Right Type",
			description:
				"Select column types that match your data to ensure proper validation and functionality",
			icon: <CheckCircle className='w-5 h-5' />,
		},
		{
			title: "Use References for Relationships",
			description:
				"Link related data using reference columns instead of duplicating information",
			icon: <LinkIcon className='w-5 h-5' />,
		},
		{
			title: "Set Appropriate Constraints",
			description:
				"Use required fields, min/max values, and unique constraints to maintain data quality",
			icon: <AlertTriangle className='w-5 h-5' />,
		},
		{
			title: "Plan for Growth",
			description:
				"Consider future needs when choosing column types - it's easier to start with more flexibility",
			icon: <Lightbulb className='w-5 h-5' />,
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
					<Link href='/docs/database' className='hover:text-foreground'>
						Database
					</Link>
					<span>/</span>
					<span className='text-foreground'>Column Types</span>
				</div>

				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-foreground'>
						Column Types & Options
					</h1>
					<p className='text-lg text-muted-foreground'>
						Understanding different column types and their configurations to
						design effective database schemas.
					</p>
				</div>

				<div className='flex items-center space-x-4'>
					<Badge variant='secondary'>
						<Clock className='w-3 h-3 mr-1' />
						15 min read
					</Badge>
					<Badge variant='outline'>Database Design</Badge>
					<Badge variant='outline'>Schema</Badge>
				</div>
			</div>

			<Separator />

			{/* Column Types Grid */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Available Column Types
					</h2>
					<p className='text-muted-foreground'>
						Choose the right column type for your data to ensure proper
						validation, display, and functionality.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{columnTypes.map((type, index) => (
						<Card key={index} className='hover:shadow-md transition-shadow'>
							<CardHeader>
								<div className='flex items-start space-x-3'>
									<div className={`p-2 rounded-lg ${type.color}`}>
										{type.icon}
									</div>
									<div className='space-y-1'>
										<CardTitle className='text-lg'>{type.type}</CardTitle>
										<CardDescription>{type.description}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div>
									<h4 className='font-medium text-sm text-foreground mb-2'>
										Common Examples:
									</h4>
									<div className='flex flex-wrap gap-1'>
										{type.examples.map((example, idx) => (
											<Badge key={idx} variant='secondary' className='text-xs'>
												{example}
											</Badge>
										))}
									</div>
								</div>

								<div>
									<h4 className='font-medium text-sm text-foreground mb-2'>
										Configuration Options:
									</h4>
									<ul className='text-sm text-muted-foreground space-y-1'>
										{type.options.map((option, idx) => (
											<li key={idx} className='flex items-center'>
												<span className='w-1 h-1 bg-muted-foreground rounded-full mr-2' />
												{option}
											</li>
										))}
									</ul>
								</div>

								<div className='pt-2 border-t border-border'>
									<p className='text-sm text-muted-foreground'>
										<Info className='w-4 h-4 inline mr-1' />
										{type.useCase}
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Best Practices */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Best Practices
					</h2>
					<p className='text-muted-foreground'>
						Follow these guidelines to create robust and maintainable database
						schemas.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{bestPractices.map((practice, index) => (
						<Card key={index}>
							<CardContent className='p-4'>
								<div className='flex items-start space-x-3'>
									<div className='p-2 bg-primary/10 text-primary rounded-lg'>
										{practice.icon}
									</div>
									<div className='space-y-1'>
										<h3 className='font-medium text-foreground'>
											{practice.title}
										</h3>
										<p className='text-sm text-muted-foreground'>
											{practice.description}
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
					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center justify-between'>
								<div>
									<h3 className='font-medium text-foreground'>
										Schema Design Guide
									</h3>
									<p className='text-sm text-muted-foreground'>
										Learn how to design effective table structures
									</p>
								</div>
								<ArrowRight className='w-5 h-5 text-muted-foreground' />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-center justify-between'>
								<div>
									<h3 className='font-medium text-foreground'>
										Import & Export Data
									</h3>
									<p className='text-sm text-muted-foreground'>
										Learn how to import existing data into your tables
									</p>
								</div>
								<ArrowRight className='w-5 h-5 text-muted-foreground' />
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default ColumnTypesPage;
