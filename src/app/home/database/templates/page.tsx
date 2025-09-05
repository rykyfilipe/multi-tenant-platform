/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Table,
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
	Search,
	ArrowLeft,
	Filter,
	X,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useTableTemplates } from "@/hooks/useTableTemplates";
import { TemplateCreationProgress } from "@/components/database/TemplateCreationProgress";
import { TABLE_TEMPLATES } from "@/lib/templates";

interface TemplateTable {
	id: string;
	name: string;
	description: string;
	icon: any;
	category: string;
	dependencies: string[];
	columns: Array<{
		name: string;
		type: string;
		required?: boolean;
		primary?: boolean;
		semanticType?: string;
		customOptions?: string[];
		referenceTableName?: string;
	}>;
}

export default function TemplatesPage() {
	const router = useRouter();
	const { t } = useLanguage();
	const { selectedDatabase, fetchTables } = useDatabase();
	const { createTablesFromTemplates, isCreating, progress } = useTableTemplates();
	
	// Debug logging
	console.log("TemplatesPage - selectedDatabase:", selectedDatabase);
	console.log("TemplatesPage - fetchTables:", typeof fetchTables);
	console.log("TemplatesPage - createTablesFromTemplates:", typeof createTablesFromTemplates);

	const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [previewTemplate, setPreviewTemplate] = useState<TemplateTable | null>(null);

	// Get unique categories
	const categories = Array.from(new Set(TABLE_TEMPLATES.map((t) => t.category)));

	// Filter templates based on search and category
	const filteredTemplates = TABLE_TEMPLATES.filter((template) => {
		const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			template.description.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory = !selectedCategory || template.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

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

	const handleCreateTables = async () => {
		if (!selectedDatabase) {
			console.error("No database selected");
			return;
		}
		
		if (!router) {
			console.error("Router not available");
			return;
		}
		
		const templatesToCreate = TABLE_TEMPLATES.filter((t) =>
			selectedTemplates.has(t.id),
		);
		
		if (templatesToCreate.length === 0) {
			console.error("No templates selected");
			return;
		}
		
		console.log("Creating tables from templates:", templatesToCreate.map(t => t.name));
		
		try {
			const success = await createTablesFromTemplates(templatesToCreate, selectedDatabase.id);
			
			if (success) {
				console.log("Tables created successfully, refreshing and redirecting...");
				// Refresh tables and navigate back
				await fetchTables();
				
				// Add a small delay to ensure the refresh completes
				setTimeout(() => {
					console.log("Redirecting to /home/database");
					try {
						router.push("/home/database");
						console.log("Redirect successful");
					} catch (redirectError) {
						console.error("Redirect failed:", redirectError);
						// Fallback: try window.location
						window.location.href = "/home/database";
					}
				}, 500);
			} else {
				console.error("Failed to create tables");
			}
		} catch (error) {
			console.error("Error in handleCreateTables:", error);
		}
	};

	const selectedCount = selectedTemplates.size;
	const hasDependencies = TABLE_TEMPLATES.some((t) => t.dependencies.length > 0);

	if (!selectedDatabase) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardContent className="p-6 text-center">
						<AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
						<h2 className="text-lg font-semibold mb-2">No Database Selected</h2>
						<p className="text-muted-foreground mb-4">
							Please select a database to add templates to.
						</p>
						<Button onClick={() => router.push("/home/database")}>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Database
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="sticky top-0 z-40 border-b border-border/20 bg-background/80 backdrop-blur-sm">
				<div className="container mx-auto px-4 py-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex items-center gap-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => router.push("/home/database")}
								className="p-2">
								<ArrowLeft className="w-4 h-4" />
							</Button>
							<div>
								<h1 className="text-2xl font-bold">Table Templates</h1>
								<p className="text-muted-foreground">
									Choose from professionally designed table templates for{" "}
									<strong>{selectedDatabase.name}</strong>
								</p>
							</div>
						</div>

						{selectedCount > 0 && (
							<div className="flex items-center gap-3">
								<Badge variant="default" className="px-3 py-1">
									{selectedCount} selected
								</Badge>
								<Button
									onClick={handleCreateTables}
									disabled={isCreating || selectedCount === 0}
									className="px-6 gap-2">
									{isCreating ? (
										<>
											<div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
											Creating Tables...
										</>
									) : (
										<>
											<CheckCircle className="w-4 h-4" />
											Create {selectedCount} Table{selectedCount !== 1 ? 's' : ''}
										</>
									)}
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Progress Indicator */}
			{(isCreating || progress) && (
				<div className="container mx-auto px-4 py-4">
					<TemplateCreationProgress 
						progress={progress} 
						isCreating={isCreating} 
					/>
				</div>
			)}

			{/* Main Content */}
			<div className="container mx-auto px-4 py-6">
				{/* Search and Filters */}
				<div className="mb-8">
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
							<Input
								placeholder="Search templates..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="flex gap-2 flex-wrap">
							<Button
								variant={selectedCategory === null ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedCategory(null)}>
								All Categories
							</Button>
							{categories.map((category) => (
								<Button
									key={category}
									variant={selectedCategory === category ? "default" : "outline"}
									size="sm"
									onClick={() => setSelectedCategory(category)}>
									{category}
								</Button>
							))}
						</div>
					</div>

					{/* Dependency Info */}
					{hasDependencies && (
						<div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
							<div className="flex gap-3">
								<Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
								<div className="text-sm text-blue-800 dark:text-blue-200">
									<div className="font-semibold mb-1">Dependency Management</div>
									<p className="leading-relaxed">
										Tables with dependencies will be created in the correct order. 
										Make sure to select all required dependent tables.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Templates Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredTemplates.map((template) => {
						const isSelected = selectedTemplates.has(template.id);
						const canSelect = canSelectTemplate(template);
						const depStatus = getDependencyStatus(template);

						return (
							<Card
								key={template.id}
								className={`group cursor-pointer transition-all duration-300 border-2 hover:shadow-lg ${
									isSelected
										? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
										: canSelect
										? "border-border/50 hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent"
										: "border-border/30 opacity-60 cursor-not-allowed bg-muted/30"
								}`}
								onClick={() => {
									if (canSelect) {
										handleTemplateToggle(template.id);
									}
								}}>
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3 min-w-0 flex-1">
											<div
												className={`w-12 h-12 rounded-xl flex items-center justify-center ${
													isSelected
														? "bg-primary text-primary-foreground"
														: "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
												} transition-colors`}>
												<template.icon className="w-6 h-6" />
											</div>
											<div className="min-w-0 flex-1">
												<CardTitle className="text-lg leading-tight truncate">
													{template.name}
												</CardTitle>
												<div className="flex items-center gap-2 mt-1">
													<Badge variant="outline" className="text-xs">
														{template.category}
													</Badge>
													{template.dependencies.length > 0 && (
														<Badge variant="secondary" className="text-xs">
															{template.dependencies.length} deps
														</Badge>
													)}
												</div>
											</div>
										</div>
										<Checkbox
											checked={isSelected}
											disabled={!canSelect}
											className="flex-shrink-0"
										/>
									</div>
								</CardHeader>

								<CardContent className="pt-0">
									<p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
										{template.description}
									</p>

									<div className="flex items-center justify-between">
										<span className="text-xs text-muted-foreground font-medium">
											{template.columns.length} columns
										</span>

										{canSelect && (
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													setPreviewTemplate(template);
												}}
												className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200">
												<Eye className="w-3 h-3 mr-1" />
												Preview
											</Button>
										)}

										{!canSelect && (
											<span className="text-amber-600 dark:text-amber-400 font-medium text-xs text-right max-w-[120px] truncate">
												{depStatus.message}
											</span>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{/* Empty State */}
				{filteredTemplates.length === 0 && (
					<div className="text-center py-12">
						<Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">No templates found</h3>
						<p className="text-muted-foreground mb-4">
							Try adjusting your search or filter criteria.
						</p>
						<Button
							variant="outline"
							onClick={() => {
								setSearchQuery("");
								setSelectedCategory(null);
							}}>
							Clear Filters
						</Button>
					</div>
				)}
			</div>

			{/* Preview Modal */}
			{previewTemplate && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div 
						className="fixed inset-0 bg-black/50 backdrop-blur-sm"
						onClick={() => setPreviewTemplate(null)}
					/>
					
					<div className="relative w-full max-w-4xl max-h-[90vh] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
						<div className="p-6 border-b border-border/10">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
										<previewTemplate.icon className="w-8 h-8 text-primary" />
									</div>
									<div>
										<h2 className="text-2xl font-bold">{previewTemplate.name}</h2>
										<Badge variant="outline" className="mt-1">
											{previewTemplate.category}
										</Badge>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setPreviewTemplate(null)}
									className="p-2">
									<X className="w-4 h-4" />
								</Button>
							</div>
							<p className="text-muted-foreground mt-4 leading-relaxed">
								{previewTemplate.description}
							</p>
						</div>

						<div className="p-6 max-h-[60vh] overflow-y-auto">
							<div className="space-y-6">
								{/* Table Structure */}
								<div>
									<h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
										<Table className="w-5 h-5" />
										Table Structure
									</h3>
									<div className="space-y-3">
										{previewTemplate.columns.map((column, index) => (
											<div
												key={index}
												className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/10">
												<div className="flex items-center gap-3 min-w-0 flex-1">
													<div className="w-8 h-8 rounded-lg bg-background border border-border/10 flex items-center justify-center text-xs font-mono text-muted-foreground flex-shrink-0">
														{index + 1}
													</div>
													<div className="min-w-0 flex-1">
														<span className="font-semibold text-foreground text-sm block mb-1">
															{column.name}
														</span>
														<div className="flex gap-2 flex-wrap">
															{column.primary && (
																<Badge variant="default" className="text-xs px-2 py-0.5">
																	Primary Key
																</Badge>
															)}
															{column.required && (
																<Badge variant="secondary" className="text-xs px-2 py-0.5">
																	Required
																</Badge>
															)}
															<Badge variant="outline" className="text-xs px-2 py-0.5">
																{column.type}
															</Badge>
															{column.semanticType && (
																<Badge variant="outline" className="text-xs px-2 py-0.5">
																	{column.semanticType}
																</Badge>
															)}
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Dependencies */}
								{previewTemplate.dependencies.length > 0 && (
									<div>
										<h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
											<AlertCircle className="w-5 h-5" />
											Dependencies
										</h3>
										<div className="space-y-2">
											{previewTemplate.dependencies.map((depId) => {
												const depTemplate = TABLE_TEMPLATES.find((t) => t.id === depId);
												const isSelected = selectedTemplates.has(depId);
												return (
													<div
														key={depId}
														className={`flex items-center gap-3 p-3 rounded-lg border ${
															isSelected
																? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
																: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
														}`}>
														{isSelected ? (
															<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
														) : (
															<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
														)}
														<div className="flex-1 min-w-0">
															<span
																className={`font-medium text-sm ${
																	isSelected
																		? "text-green-800 dark:text-green-200"
																		: "text-red-800 dark:text-red-200"
																}`}>
																{depTemplate?.name || depId}
															</span>
															<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
						</div>

						<div className="p-6 border-t border-border/10 bg-muted/20">
							<div className="flex items-center justify-between">
								<div className="text-sm text-muted-foreground">
									{selectedTemplates.has(previewTemplate.id) ? (
										<div className="flex items-center gap-2">
											<CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
											<span>Template selected</span>
										</div>
									) : (
										<span>Click to select this template</span>
									)}
								</div>
								<div className="flex gap-3">
									<Button
										variant="outline"
										onClick={() => setPreviewTemplate(null)}>
										Close
									</Button>
									<Button
										onClick={() => {
											handleTemplateToggle(previewTemplate.id);
											setPreviewTemplate(null);
										}}
										disabled={!canSelectTemplate(previewTemplate)}>
										{selectedTemplates.has(previewTemplate.id)
											? "Deselect Template"
											: "Select Template"}
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
