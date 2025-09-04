/** @format */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	Database,
	Users,
	Package,
	CreditCard,
	FileText,
	Calendar,
	Settings,
	ShoppingCart,
	BarChart3,
	Plus,
	Eye,
	CheckCircle,
	Info,
	AlertCircle,
	ChevronLeft,
	X,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TemplateTable {
	id: string;
	name: string;
	description: string;
	icon: any;
	category: string;
	dependencies: string[]; // Array of table IDs this table depends on
	columns: Array<{
		name: string;
		type: string;
		required?: boolean;
		primary?: boolean;
		semanticType?: string;
		customOptions?: string[];
		referenceTableName?: string; // Name of the referenced table (will be resolved to ID)
	}>;
}

// Template-uri predefinite pentru tabele
export const TABLE_TEMPLATES = [
	{
		id: "customers",
		name: "Customers",
		description: "Manage customer information and contact details",
		icon: Users,
		category: "CRM",
		dependencies: [], // No dependencies - can be created first
		columns: [
			{
				name: "email",
				type: "string",
				required: true,
				primary: true,
				semanticType: "customer_email",
			},
			{
				name: "first_name",
				type: "string",
				required: true,
				semanticType: "customer_first_name",
			},
			{
				name: "last_name",
				type: "string",
				required: true,
				semanticType: "customer_last_name",
			},
			{ name: "phone", type: "string", semanticType: "customer_phone" },
			{ name: "company", type: "string", semanticType: "customer_company" },
			{ name: "address", type: "text", semanticType: "customer_address" },
			{ name: "city", type: "string", semanticType: "customer_city" },
			{ name: "country", type: "string", semanticType: "customer_country" },
			{
				name: "postal_code",
				type: "string",
				semanticType: "customer_postal_code",
			},
			{
				name: "created_at",
				type: "date",
				required: true,
				semanticType: "customer_created_at",
			},
			{
				name: "status",
				type: "customArray",
				customOptions: ["active", "inactive", "lead"],
				semanticType: "customer_status",
			},
		],
	},
	{
		id: "products",
		name: "Products",
		description: "Product catalog with inventory management",
		icon: Package,
		category: "Inventory",
		dependencies: [], // No dependencies - can be created first
		columns: [
			{
				name: "sku",
				type: "string",
				required: true,
				primary: true,
				semanticType: "product_sku",
			},
			{
				name: "name",
				type: "string",
				required: true,
				semanticType: "product_name",
			},
			{
				name: "description",
				type: "text",
				semanticType: "product_description",
			},
			{ name: "category", type: "string", semanticType: "product_category" },
			{ name: "brand", type: "string", semanticType: "product_brand" },
			{
				name: "price",
				type: "number",
				required: true,
				semanticType: "product_price",
			},
			{ name: "cost", type: "number", semanticType: "product_cost" },
			{
				name: "stock_quantity",
				type: "number",
				required: true,
				semanticType: "product_stock_quantity",
			},
			{
				name: "min_stock_level",
				type: "number",
				semanticType: "product_min_stock_level",
			},
			{ name: "weight", type: "number", semanticType: "product_weight" },
			{
				name: "dimensions",
				type: "string",
				semanticType: "product_dimensions",
			},
			{
				name: "is_active",
				type: "boolean",
				required: true,
				semanticType: "product_is_active",
			},
			{
				name: "created_at",
				type: "date",
				required: true,
				semanticType: "product_created_at",
			},
		],
	},
	{
		id: "employees",
		name: "Employees",
		description: "Employee management and HR data",
		icon: Users,
		category: "HR",
		dependencies: [], // No dependencies - can be created first
		columns: [
			{
				name: "employee_id",
				type: "string",
				required: true,
				primary: true,
				semanticType: "employee_employee_id",
			},
			{
				name: "first_name",
				type: "string",
				required: true,
				semanticType: "employee_first_name",
			},
			{
				name: "last_name",
				type: "string",
				required: true,
				semanticType: "employee_last_name",
			},
			{
				name: "email",
				type: "string",
				required: true,
				semanticType: "employee_email",
			},
			{ name: "phone", type: "string", semanticType: "employee_phone" },
			{
				name: "department",
				type: "string",
				semanticType: "employee_department",
			},
			{ name: "position", type: "string", semanticType: "employee_position" },
			{
				name: "hire_date",
				type: "date",
				required: true,
				semanticType: "employee_hire_date",
			},
			{ name: "salary", type: "number", semanticType: "employee_salary" },
			{
				name: "is_active",
				type: "boolean",
				required: true,
				semanticType: "employee_is_active",
			},
		],
	},
	{
		id: "orders",
		name: "Orders",
		description: "Customer orders and order management",
		icon: ShoppingCart,
		category: "Sales",
		dependencies: ["customers", "products"], // Depends on customers and products
		columns: [
			{
				name: "order_number",
				type: "string",
				required: true,
				primary: true,
				semanticType: "order_number",
			},
			{
				name: "customer_id",
				type: "reference",
				required: true,
				semanticType: "order_customer_id",
				referenceTableName: "customers", // Will be resolved to actual table ID
			},
			{
				name: "order_date",
				type: "date",
				required: true,
				semanticType: "order_date",
			},
			{
				name: "status",
				type: "customArray",
				customOptions: [
					"pending",
					"processing",
					"shipped",
					"delivered",
					"cancelled",
				],
				semanticType: "order_status",
			},
			{
				name: "total_amount",
				type: "number",
				required: true,
				semanticType: "order_total_amount",
			},
			{ name: "tax_amount", type: "number", semanticType: "order_tax_amount" },
			{
				name: "shipping_amount",
				type: "number",
				semanticType: "order_shipping_amount",
			},
			{
				name: "payment_method",
				type: "string",
				semanticType: "order_payment_method",
			},
			{
				name: "shipping_address",
				type: "text",
				semanticType: "order_shipping_address",
			},
			{
				name: "billing_address",
				type: "text",
				semanticType: "order_billing_address",
			},
			{ name: "notes", type: "text", semanticType: "order_notes" },
		],
	},
	{
		id: "invoices",
		name: "Invoices",
		description: "Invoice management and billing",
		icon: FileText,
		category: "Billing",
		dependencies: ["customers", "orders"], // Depends on customers and orders
		columns: [
			{
				name: "invoice_number",
				type: "string",
				required: true,
				primary: true,
				semanticType: "invoice_number",
			},
			{
				name: "customer_id",
				type: "reference",
				required: true,
				semanticType: "invoice_customer_id",
				referenceTableName: "customers",
			},
			{
				name: "order_id",
				type: "reference",
				semanticType: "invoice_order_id",
				referenceTableName: "orders",
			},
			{
				name: "invoice_date",
				type: "date",
				required: true,
				semanticType: "invoice_date",
			},
			{
				name: "due_date",
				type: "date",
				required: true,
				semanticType: "invoice_due_date",
			},
			{
				name: "amount",
				type: "number",
				required: true,
				semanticType: "invoice_amount",
			},
			{
				name: "tax_amount",
				type: "number",
				semanticType: "invoice_tax_amount",
			},
			{
				name: "total_amount",
				type: "number",
				required: true,
				semanticType: "invoice_total_amount",
			},
			{
				name: "status",
				type: "customArray",
				customOptions: ["draft", "sent", "paid", "overdue", "cancelled"],
				semanticType: "invoice_status",
			},
			{
				name: "payment_terms",
				type: "string",
				semanticType: "invoice_payment_terms",
			},
		],
	},
	{
		id: "projects",
		name: "Projects",
		description: "Project management and tracking",
		icon: BarChart3,
		category: "Project Management",
		dependencies: ["customers", "employees"], // Depends on customers and employees
		columns: [
			{
				name: "name",
				type: "string",
				required: true,
				primary: true,
				semanticType: "project_name",
			},
			{
				name: "description",
				type: "text",
				semanticType: "project_description",
			},
			{
				name: "client_id",
				type: "reference",
				semanticType: "project_client_id",
				referenceTableName: "customers",
			},
			{
				name: "start_date",
				type: "date",
				required: true,
				semanticType: "project_start_date",
			},
			{
				name: "end_date",
				type: "date",
				semanticType: "project_end_date",
			},
			{
				name: "manager_id",
				type: "reference",
				semanticType: "project_manager_id",
				referenceTableName: "employees",
			},
			{
				name: "status",
				type: "customArray",
				customOptions: [
					"planning",
					"active",
					"on-hold",
					"completed",
					"cancelled",
				],
				semanticType: "project_status",
			},
			{
				name: "budget",
				type: "number",
				semanticType: "project_budget",
			},
			{
				name: "created_at",
				type: "date",
				required: true,
				semanticType: "project_created_at",
			},
		],
	},
	{
		id: "tasks",
		name: "Tasks",
		description: "Task management and tracking",
		icon: CheckCircle,
		category: "Task Management",
		dependencies: ["projects", "employees"], // Depends on projects and employees
		columns: [
			{
				name: "title",
				type: "string",
				required: true,
				primary: true,
				semanticType: "task_title",
			},
			{
				name: "description",
				type: "text",
				semanticType: "task_description",
			},
			{
				name: "project_id",
				type: "reference",
				required: true,
				semanticType: "task_project_id",
				referenceTableName: "projects",
			},
			{
				name: "assigned_to",
				type: "reference",
				semanticType: "task_assigned_to",
				referenceTableName: "employees",
			},
			{
				name: "priority",
				type: "customArray",
				customOptions: ["low", "medium", "high", "urgent"],
				semanticType: "task_priority",
			},
			{
				name: "status",
				type: "customArray",
				customOptions: ["todo", "in-progress", "review", "completed"],
				semanticType: "task_status",
			},
			{
				name: "due_date",
				type: "date",
				semanticType: "task_due_date",
			},
			{
				name: "created_at",
				type: "date",
				required: true,
				semanticType: "task_created_at",
			},
		],
	},
	{
		id: "categories",
		name: "Categories",
		description: "Product and service categories",
		icon: Settings,
		category: "Organization",
		dependencies: [], // No dependencies - can be created first
		columns: [
			{
				name: "name",
				type: "string",
				required: true,
				primary: true,
				semanticType: "category_name",
			},
			{
				name: "description",
				type: "text",
				semanticType: "category_description",
			},
			{
				name: "parent_id",
				type: "reference",
				semanticType: "category_parent_id",
				referenceTableName: "categories", // Self-referencing for hierarchical categories
			},
			{
				name: "is_active",
				type: "boolean",
				required: true,
				semanticType: "category_is_active",
			},
			{
				name: "created_at",
				type: "date",
				required: true,
				semanticType: "category_created_at",
			},
		],
	},
	{
		id: "settings",
		name: "Settings",
		description: "Application configuration and settings",
		icon: Settings,
		category: "Configuration",
		dependencies: [], // No dependencies - can be created first
		columns: [
			{
				name: "key",
				type: "string",
				required: true,
				primary: true,
				semanticType: "setting_key",
			},
			{
				name: "value",
				type: "text",
				required: true,
				semanticType: "setting_value",
			},
			{
				name: "description",
				type: "text",
				semanticType: "setting_description",
			},
			{
				name: "category",
				type: "string",
				semanticType: "setting_category",
			},
			{
				name: "is_editable",
				type: "boolean",
				required: true,
				semanticType: "setting_is_editable",
			},
			{
				name: "updated_at",
				type: "date",
				required: true,
				semanticType: "setting_updated_at",
			},
		],
	},
	{
		id: "analytics",
		name: "Analytics",
		description: "Data analytics and reporting",
		icon: BarChart3,
		category: "Reporting",
		dependencies: ["customers", "orders", "products"], // Depends on multiple tables
		columns: [
			{
				name: "metric_name",
				type: "string",
				required: true,
				primary: true,
				semanticType: "analytics_metric_name",
			},
			{
				name: "metric_value",
				type: "number",
				required: true,
				semanticType: "analytics_metric_value",
			},
			{
				name: "date",
				type: "date",
				required: true,
				semanticType: "analytics_date",
			},
			{
				name: "category",
				type: "string",
				semanticType: "analytics_category",
			},
			{
				name: "created_at",
				type: "date",
				required: true,
				semanticType: "analytics_created_at",
			},
		],
	},
];

export function TableTemplateSelector({
	onTemplatesSelected,
	selectedDatabaseId,
}: {
	onTemplatesSelected: (templates: TemplateTable[]) => void;
	selectedDatabaseId: number | null;
}) {
	const { t } = useLanguage();
	const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(
		new Set(),
	);
	const [previewTemplate, setPreviewTemplate] = useState<TemplateTable | null>(
		null,
	);
	const [showModal, setShowModal] = useState(false);
	const [activeView, setActiveView] = useState<"list" | "preview">("list");

	const handleTemplateToggle = (templateId: string) => {
		const newSelected = new Set(selectedTemplates);
		if (newSelected.has(templateId)) {
			newSelected.delete(templateId);
		} else {
			newSelected.add(templateId);
		}
		setSelectedTemplates(newSelected);
	};

	const canSelectTemplate = (template: TemplateTable): boolean => {
		// Check if all dependencies are selected
		return template.dependencies.every((depId) => selectedTemplates.has(depId));
	};

	const getDependencyStatus = (template: TemplateTable) => {
		const missingDeps = template.dependencies.filter(
			(depId) => !selectedTemplates.has(depId),
		);
		if (missingDeps.length === 0)
			return { status: "ready", message: "Ready to create" };

		const depNames = missingDeps.map((depId) => {
			const depTemplate = TABLE_TEMPLATES.find((t) => t.id === depId);
			return depTemplate?.name || depId;
		});

		return {
			status: "blocked",
			message: `Requires: ${depNames.join(", ")}`,
		};
	};

	const handleCreateTables = () => {
		const templatesToCreate = TABLE_TEMPLATES.filter((t) =>
			selectedTemplates.has(t.id),
		);
		onTemplatesSelected(templatesToCreate);
		setShowModal(false);
		setSelectedTemplates(new Set());
		setPreviewTemplate(null);
		setActiveView("list");
	};

	const handlePreviewTemplate = (template: TemplateTable) => {
		setPreviewTemplate(template);
		setActiveView("preview");
	};

	const handleBackToList = () => {
		setActiveView("list");
		setPreviewTemplate(null);
	};

	const selectedCount = selectedTemplates.size;
	const hasDependencies = TABLE_TEMPLATES.some(
		(t) => t.dependencies.length > 0,
	);

	return (
		<>
			<Button
				variant='outline'
				className='gap-2 shadow-sm hover:shadow-md transition-all duration-200'
				onClick={() => setShowModal(true)}>
				<Table className='w-4 h-4' />
				{t("database.templates.addFromTemplates") || "Add from Templates"}
			</Button>

			{showModal && (
				<div className='fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col max-h-screen overflow-hidden'>
					{/* Header */}
					<div className='flex-shrink-0 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-border/10 bg-background/80 backdrop-blur-sm'>
						<div className='flex items-start sm:items-center justify-between gap-3'>
							<div className='flex items-center gap-2 sm:gap-3 min-w-0 flex-1'>
								<Button
									variant='ghost'
									size='sm'
									onClick={handleBackToList}
									className={`p-1.5 sm:p-2 h-8 sm:h-9 w-8 sm:w-9 flex-shrink-0 ${
										activeView === "list" ? "hidden" : "flex"
									}`}>
									<ChevronLeft className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
								</Button>
								<div className='min-w-0 flex-1'>
									<h1 className='text-base sm:text-lg lg:text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight'>
										{activeView === "list"
											? t("database.templates.selectTemplates") ||
											  "Select Table Templates"
											: previewTemplate?.name || "Template Preview"}
									</h1>
									{activeView === "list" && (
										<p className='text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2'>
											Choose from our professionally designed table templates
										</p>
									)}
								</div>
							</div>

							{activeView === "list" && (
								<div className='flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0'>
									{selectedCount > 0 && (
										<Badge
											variant='default'
											className='px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium hidden xs:flex'>
											{selectedCount} selected
										</Badge>
									)}
									<Button
										variant='ghost'
										size='sm'
										onClick={() => setShowModal(false)}
										className='p-1.5 sm:p-2 h-8 sm:h-9 w-8 sm:w-9'>
										<X className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
									</Button>
								</div>
							)}
						</div>
					</div>

					{/* Main Content */}
					<div className='flex-1 overflow-hidden min-h-0'>
						{activeView === "list" ? (
							<div className='h-full flex flex-col'>
								{/* Template List */}
								<div className='flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 xl:p-6'>
									<div className='max-w-7xl mx-auto'>
										{/* Category Tabs */}
										<div className='mb-3 sm:mb-4 lg:mb-6'>
											<div className='flex flex-wrap gap-1.5 sm:gap-2'>
												{Array.from(
													new Set(TABLE_TEMPLATES.map((t) => t.category)),
												).map((category) => (
													<Badge
														key={category}
														variant='outline'
														className='px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors'>
														{category}
													</Badge>
												))}
											</div>
										</div>

										{/* Templates Grid */}
										<div className='grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4'>
											{TABLE_TEMPLATES.map((template) => {
												const isSelected = selectedTemplates.has(template.id);
												const canSelect = canSelectTemplate(template);
												const depStatus = getDependencyStatus(template);

												return (
													<Card
														key={template.id}
														className={`group cursor-pointer transition-all duration-300 border-2 hover:shadow-lg touch-manipulation ${
															isSelected
																? "border-primary bg-primary/5 shadow-lg scale-[1.01] sm:scale-[1.02]"
																: canSelect
																? "border-border/50 hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent"
																: "border-border/30 opacity-60 cursor-not-allowed bg-muted/30"
														}`}
														onClick={() => {
															if (canSelect) {
																handleTemplateToggle(template.id);
															}
														}}>
														<CardContent className='p-2.5 sm:p-3 lg:p-4'>
															<div className='flex gap-2 sm:gap-3'>
																<div className='flex-shrink-0'>
																	<div
																		className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center ${
																			isSelected
																				? "bg-primary text-primary-foreground"
																				: "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
																		} transition-colors`}>
																		<template.icon className='w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5' />
																	</div>
																</div>

																<div className='flex-1 min-w-0'>
																	<div className='flex items-start justify-between mb-1.5 sm:mb-2 lg:mb-3'>
																		<div className='min-w-0 flex-1'>
																			<h4 className='font-semibold text-foreground text-xs sm:text-sm lg:text-base leading-tight truncate mb-1'>
																				{template.name}
																			</h4>
																			<div className='flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-wrap'>
																				<Badge
																					variant='outline'
																					className='text-xs font-medium px-1.5 sm:px-2 py-0.5'>
																					{template.category}
																				</Badge>
																				{template.dependencies.length > 0 && (
																					<Badge
																						variant='secondary'
																						className='text-xs px-1.5 sm:px-2 py-0.5'>
																						{template.dependencies.length} deps
																					</Badge>
																				)}
																			</div>
																		</div>

																		<Checkbox
																			checked={isSelected}
																			disabled={!canSelect}
																			className='ml-1.5 sm:ml-2 flex-shrink-0 scale-90 sm:scale-100'
																		/>
																	</div>

																	<p className='text-muted-foreground text-xs sm:text-sm leading-relaxed mb-1.5 sm:mb-2 lg:mb-3 line-clamp-2'>
																		{template.description}
																	</p>

																	<div className='flex items-center justify-between'>
																		<span className='text-xs text-muted-foreground font-medium'>
																			{template.columns.length} columns
																		</span>

																		{canSelect && (
																			<Button
																				variant='ghost'
																				size='sm'
																				onClick={(e) => {
																					e.stopPropagation();
																					handlePreviewTemplate(template);
																				}}
																				className='h-5 sm:h-6 lg:h-7 px-1.5 sm:px-2 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10 touch-manipulation'>
																				<Eye className='w-3 h-3 mr-0.5 sm:mr-1' />
																				<span className='hidden xs:inline'>Preview</span>
																			</Button>
																		)}

																		{!canSelect && (
																			<span className='text-amber-600 dark:text-amber-400 font-medium text-xs text-right max-w-[80px] sm:max-w-[100px] lg:max-w-[120px] truncate'>
																				{depStatus.message}
																			</span>
																		)}
																	</div>
																</div>
															</div>
														</CardContent>
													</Card>
												);
											})}
										</div>

										{/* Dependency Info */}
										{hasDependencies && (
											<div className='mt-6 sm:mt-8 max-w-2xl mx-auto'>
												<div className='p-3 sm:p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50'>
													<div className='flex gap-3'>
														<Info className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
														<div className='text-xs sm:text-sm text-blue-800 dark:text-blue-200'>
															<div className='font-semibold mb-1'>
																Dependency Management
															</div>
															<p className='leading-relaxed'>
																Tables with dependencies will be created in the
																correct order. Make sure to select all required
																dependent tables.
															</p>
														</div>
													</div>
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Footer */}
								<div className='flex-shrink-0 border-t border-border/10 bg-background/80 backdrop-blur-sm p-2.5 sm:p-3 lg:p-4 xl:p-6'>
									<div className='max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 lg:gap-4'>
										<div className='text-xs sm:text-sm text-muted-foreground'>
											{selectedCount > 0 && (
												<div className='flex items-center gap-1.5 sm:gap-2'>
													<CheckCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0' />
													<span>
														Will create{" "}
														<strong className='text-foreground mx-1'>
															{selectedCount}
														</strong>
														{selectedCount === 1 ? " table" : " tables"}
													</span>
												</div>
											)}
										</div>

										<div className='flex items-center gap-2 sm:gap-3 w-full sm:w-auto'>
											<Button
												variant='outline'
												onClick={() => setShowModal(false)}
												className='flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 text-xs sm:text-sm h-9 sm:h-10'>
												Cancel
											</Button>
											<Button
												onClick={handleCreateTables}
												disabled={selectedCount === 0}
												className='flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm h-9 sm:h-10'>
												<CheckCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
												Create Tables
											</Button>
										</div>
									</div>
								</div>
							</div>
						) : (
							/* Preview View */
							<div className='h-full flex flex-col'>
								<div className='flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 xl:p-6'>
									<div className='max-w-5xl mx-auto'>
										{previewTemplate && (
											<div className='space-y-3 sm:space-y-4 lg:space-y-6'>
												{/* Template Header */}
												<div className='text-center pb-3 sm:pb-4 lg:pb-6 border-b border-border/10'>
													<div className='w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-2 sm:mb-3 lg:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center'>
														<previewTemplate.icon className='w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary' />
													</div>
													<h2 className='text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-2 leading-tight'>
														{previewTemplate.name}
													</h2>
													<Badge
														variant='outline'
														className='text-xs sm:text-sm px-2 sm:px-3 py-1 mb-2 sm:mb-3'>
														{previewTemplate.category}
													</Badge>
													<p className='text-muted-foreground max-w-2xl mx-auto leading-relaxed text-xs sm:text-sm lg:text-base'>
														{previewTemplate.description}
													</p>
												</div>

												{/* Table Structure */}
												<div>
													<h3 className='font-semibold text-foreground mb-2 sm:mb-3 lg:mb-4 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base lg:text-lg'>
														<Database className='w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5' />
														Table Structure
													</h3>
													<div className='space-y-1.5 sm:space-y-2 lg:space-y-3'>
														{previewTemplate.columns.map((column, index) => (
															<div
																key={index}
																className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 lg:p-4 bg-muted/40 rounded-lg sm:rounded-xl border border-border/10 gap-2 sm:gap-3'>
																<div className='flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0 flex-1'>
																	<div className='w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-md sm:rounded-lg bg-background border border-border/10 flex items-center justify-center text-xs font-mono text-muted-foreground flex-shrink-0'>
																		{index + 1}
																	</div>
																	<div className='min-w-0 flex-1'>
																		<span className='font-semibold text-foreground text-xs sm:text-sm block mb-1'>
																			{column.name}
																		</span>
																		<div className='flex gap-1 sm:gap-1.5 lg:gap-2 flex-wrap'>
																			{column.primary && (
																				<Badge
																					variant='default'
																					className='text-xs px-1 sm:px-1.5 lg:px-2 py-0.5'>
																					Primary Key
																				</Badge>
																			)}
																			{column.required && (
																				<Badge
																					variant='secondary'
																					className='text-xs px-1 sm:px-1.5 lg:px-2 py-0.5'>
																					Required
																				</Badge>
																			)}
																		</div>
																	</div>
																</div>
																<div className='flex items-center gap-1.5 sm:gap-2 flex-shrink-0'>
																	<Badge
																		variant='outline'
																		className='text-xs font-mono px-1.5 sm:px-2 lg:px-3 py-0.5'>
																		{column.type}
																	</Badge>
																	{column.type === "reference" &&
																		column.referenceTableName && (
																			<Badge
																				variant='outline'
																				className='text-xs px-1.5 sm:px-2 lg:px-3 py-0.5 truncate max-w-[80px] sm:max-w-[100px] lg:max-w-[120px]'>
																				→ {column.referenceTableName}
																			</Badge>
																		)}
																</div>
															</div>
														))}
													</div>
												</div>

												{/* Dependencies */}
												{previewTemplate.dependencies.length > 0 && (
													<div>
														<h3 className='font-semibold text-foreground mb-2 sm:mb-3 lg:mb-4 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base lg:text-lg'>
															<AlertCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5' />
															Dependencies
														</h3>
														<div className='space-y-1.5 sm:space-y-2 lg:space-y-3'>
															{previewTemplate.dependencies.map((depId) => {
																const depTemplate = TABLE_TEMPLATES.find(
																	(t) => t.id === depId,
																);
																const isSelected = selectedTemplates.has(depId);
																return (
																	<div
																		key={depId}
																		className={`flex items-center gap-1.5 sm:gap-2 lg:gap-3 p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 transition-colors ${
																			isSelected
																				? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50"
																				: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50"
																		}`}>
																		{isSelected ? (
																			<CheckCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-600 dark:text-green-400 flex-shrink-0' />
																		) : (
																			<AlertCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-600 dark:text-red-400 flex-shrink-0' />
																		)}
																		<div className='flex-1 min-w-0'>
																			<span
																				className={`font-medium text-xs sm:text-sm ${
																					isSelected
																						? "text-green-800 dark:text-green-200"
																						: "text-red-800 dark:text-red-200"
																				}`}>
																				{depTemplate?.name || depId}
																			</span>
																			<p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
																				{depTemplate?.description}
																			</p>
																		</div>
																	</div>
																);
															})}
														</div>
													</div>
												)}
											</div>
										)}
									</div>
								</div>

								{/* Preview Footer */}
								<div className='flex-shrink-0 border-t border-border/10 bg-background/80 backdrop-blur-sm p-2.5 sm:p-3 lg:p-4 xl:p-6'>
									<div className='max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 lg:gap-4'>
										<div className='text-xs sm:text-sm text-muted-foreground'>
											{previewTemplate && (
												<span>
													Previewing{" "}
													<strong className='text-foreground'>
														{previewTemplate.name}
													</strong>{" "}
													template
												</span>
											)}
										</div>

										<div className='flex items-center gap-2 sm:gap-3 w-full sm:w-auto'>
											<Button
												variant='outline'
												onClick={handleBackToList}
												className='flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 text-xs sm:text-sm h-9 sm:h-10'>
												Back to Templates
											</Button>
											<Button
												onClick={() => {
													if (previewTemplate) {
														handleTemplateToggle(previewTemplate.id);
														handleBackToList();
													}
												}}
												disabled={
													!previewTemplate ||
													selectedTemplates.has(previewTemplate.id)
												}
												className='flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm h-9 sm:h-10'>
												<CheckCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
												{selectedTemplates.has(previewTemplate?.id || "")
													? "Already Selected"
													: "Select Template"}
											</Button>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
