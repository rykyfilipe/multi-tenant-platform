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
	Upload,
	Download,
	FileText,
	Table,
	CheckCircle,
	AlertTriangle,
	Info,
	Lightbulb,
	Clock,
	ArrowRight,
	FileSpreadsheet,
	Database,
} from "lucide-react";

const ImportExportPage = () => {
	const { t } = useLanguage();

	const importMethods = [
		{
			method: "CSV Upload",
			icon: <FileText className='w-6 h-6' />,
			description: "Import data from CSV files with column mapping",
			features: [
				"Automatic column detection",
				"Custom delimiter support",
				"Data validation",
				"Preview before import",
			],
			bestFor: "Small to medium datasets (up to 10,000 rows)",
			steps: [
				"Click 'Import Data' in your table",
				"Select your CSV file",
				"Map columns to table fields",
				"Preview and validate data",
				"Complete the import",
			],
		},
		{
			method: "Excel Import",
			icon: <FileSpreadsheet className='w-6 h-6' />,
			description: "Import data directly from Excel files (.xlsx, .xls)",
			features: [
				"Multiple sheet support",
				"Cell formatting preservation",
				"Formula evaluation",
				"Date format detection",
			],
			bestFor: "Structured data with formatting and multiple sheets",
			steps: [
				"Prepare your Excel file",
				"Select the sheet to import",
				"Choose the data range",
				"Map columns to fields",
				"Import your data",
			],
		},
		{
			method: "API Import",
			icon: <Database className='w-6 h-6' />,
			description: "Programmatically import data using our REST API",
			features: [
				"Bulk operations",
				"Real-time sync",
				"Custom validation",
				"Error handling",
			],
			bestFor: "Large datasets and automated data synchronization",
			steps: [
				"Set up automated data synchronization",
				"Configure data validation rules",
				"Use POST /api/tables/{id}/rows",
				"Handle response and errors",
				"Verify imported data",
			],
		},
	];

	const exportOptions = [
		{
			format: "CSV Export",
			icon: <FileText className='w-6 h-6' />,
			description:
				"Export your data to CSV format for use in other applications",
			features: [
				"Custom column selection",
				"Filter support",
				"UTF-8 encoding",
				"Large file handling",
			],
			useCase: "Data analysis, reporting, and sharing with other systems",
		},
		{
			format: "Excel Export",
			icon: <FileSpreadsheet className='w-6 h-6' />,
			description: "Export to Excel with formatting and multiple sheets",
			features: [
				"Cell formatting",
				"Multiple sheets",
				"Charts and graphs",
				"Password protection",
			],
			useCase: "Professional reports and presentations",
		},
		{
			format: "JSON Export",
			icon: <Database className='w-6 h-6' />,
			description: "Export structured data in JSON format for developers",
			features: [
				"Nested relationships",
				"Custom field selection",
				"API-ready format",
				"Compression support",
			],
			useCase: "API integration and data migration",
		},
	];

	const tips = [
		{
			title: "Prepare Your Data",
			description:
				"Clean your data before importing to avoid errors and ensure consistency",
			icon: <CheckCircle className='w-5 h-5' />,
			details: [
				"Remove empty rows and columns",
				"Standardize date formats",
				"Validate email addresses",
				"Check for duplicates",
			],
		},
		{
			title: "Test with Small Batches",
			description:
				"Import a small sample first to verify column mapping and data format",
			icon: <Lightbulb className='w-5 h-5' />,
			details: [
				"Start with 10-50 rows",
				"Verify all columns map correctly",
				"Check data validation rules",
				"Test relationships",
			],
		},
		{
			title: "Handle Large Datasets",
			description:
				"For large imports, use chunked uploads or API methods for better performance",
			icon: <Upload className='w-5 h-5' />,
			details: [
				"Split large files into chunks",
				"Use API for >10,000 rows",
				"Monitor import progress",
				"Handle timeouts gracefully",
			],
		},
		{
			title: "Backup Before Import",
			description:
				"Always backup your existing data before performing large imports",
			icon: <AlertTriangle className='w-5 h-5' />,
			details: [
				"Export current data",
				"Test import process",
				"Have rollback plan",
				"Verify data integrity",
			],
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
					<span className='text-foreground'>Import & Export</span>
				</div>

				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-foreground'>
						Data Import & Export
					</h1>
					<p className='text-lg text-muted-foreground'>
						Learn how to import existing data into your tables and export data
						for use in other applications.
					</p>
				</div>

				<div className='flex items-center space-x-4'>
					<Badge variant='secondary'>
						<Clock className='w-3 h-3 mr-1' />
						12 min read
					</Badge>
					<Badge variant='outline'>Data Management</Badge>
					<Badge variant='outline'>Import</Badge>
					<Badge variant='outline'>Export</Badge>
				</div>
			</div>

			<Separator />

			{/* Import Methods */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground flex items-center'>
						<Upload className='w-6 h-6 mr-2' />
						Import Methods
					</h2>
					<p className='text-muted-foreground'>
						Choose the best import method for your data size and source format.
					</p>
				</div>

				<div className='space-y-6'>
					{importMethods.map((method, index) => (
						<Card key={index}>
							<CardHeader>
								<div className='flex items-start space-x-3'>
									<div className='p-2 bg-blue-500/10 text-blue-600 rounded-lg'>
										{method.icon}
									</div>
									<div className='space-y-1'>
										<CardTitle className='text-lg'>{method.method}</CardTitle>
										<CardDescription>{method.description}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Key Features:
										</h4>
										<ul className='text-sm text-muted-foreground space-y-1'>
											{method.features.map((feature, idx) => (
												<li key={idx} className='flex items-center'>
													<CheckCircle className='w-3 h-3 mr-2 text-green-600' />
													{feature}
												</li>
											))}
										</ul>
									</div>
									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Step-by-Step Process:
										</h4>
										<ol className='text-sm text-muted-foreground space-y-1'>
											{method.steps.map((step, idx) => (
												<li key={idx} className='flex items-start'>
													<span className='inline-flex items-center justify-center w-4 h-4 bg-primary/10 text-primary rounded-full text-xs mr-2 mt-0.5'>
														{idx + 1}
													</span>
													{step}
												</li>
											))}
										</ol>
									</div>
								</div>
								<div className='pt-2 border-t border-border'>
									<p className='text-sm text-muted-foreground'>
										<Info className='w-4 h-4 inline mr-1' />
										<strong>Best for:</strong> {method.bestFor}
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Export Options */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground flex items-center'>
						<Download className='w-6 h-6 mr-2' />
						Export Options
					</h2>
					<p className='text-muted-foreground'>
						Export your data in various formats for analysis, reporting, or
						migration.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-1 gap-6'>
					{exportOptions.map((option, index) => (
						<Card key={index}>
							<CardContent className='p-6'>
								<div className='flex items-start space-x-4'>
									<div className='p-3 bg-green-500/10 text-green-600 rounded-lg'>
										{option.icon}
									</div>
									<div className='flex-1 space-y-3'>
										<div>
											<h3 className='text-lg font-semibold text-foreground'>
												{option.format}
											</h3>
											<p className='text-muted-foreground'>
												{option.description}
											</p>
										</div>
										<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
											<div>
												<h4 className='font-medium text-sm text-foreground mb-2'>
													Features:
												</h4>
												<div className='flex flex-wrap gap-1'>
													{option.features.map((feature, idx) => (
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
												<h4 className='font-medium text-sm text-foreground mb-2'>
													Use Case:
												</h4>
												<p className='text-sm text-muted-foreground'>
													{option.useCase}
												</p>
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

			{/* Tips & Best Practices */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Tips & Best Practices
					</h2>
					<p className='text-muted-foreground'>
						Follow these guidelines for successful data import and export
						operations.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{tips.map((tip, index) => (
						<Card key={index}>
							<CardContent className='p-4'>
								<div className='space-y-3'>
									<div className='flex items-start space-x-3'>
										<div className='p-2 bg-primary/10 text-primary rounded-lg'>
											{tip.icon}
										</div>
										<div>
											<h3 className='font-medium text-foreground'>
												{tip.title}
											</h3>
											<p className='text-sm text-muted-foreground'>
												{tip.description}
											</p>
										</div>
									</div>
									<ul className='text-sm text-muted-foreground space-y-1 ml-11'>
										{tip.details.map((detail, idx) => (
											<li key={idx} className='flex items-center'>
												<span className='w-1 h-1 bg-muted-foreground rounded-full mr-2' />
												{detail}
											</li>
										))}
									</ul>
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
					<Link href='/docs/database/schema-design'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
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
					</Link>

					<Link href='/docs/api'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											API Documentation
										</h3>
										<p className='text-sm text-muted-foreground'>
											Learn about programmatic data import via API
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

export default ImportExportPage;
