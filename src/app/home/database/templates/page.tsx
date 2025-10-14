/** @format */

"use client";

import React, { useState } from "react";
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
	Sparkles,
	Zap,
	TrendingUp,
	Clock,
	Star,
	Layers,
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
			<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
				<div className="w-full max-w-lg text-center">
					<div className='relative mb-8'>
						<div className='w-32 h-32 bg-gradient-to-br from-muted/30 to-muted/20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl'>
							<AlertCircle className='w-16 h-16 text-muted-foreground' />
						</div>
						<div className='absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg animate-bounce'>
							<Layers className='w-6 h-6 text-white' />
						</div>
					</div>
					
					<h2 className="text-3xl font-bold text-foreground mb-4">
						Select a Database First
					</h2>
					<p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
						Choose a database from the main page to start adding professional table templates
					</p>
					
					<Button 
						onClick={() => router.push("/home/database")}
						className="shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary px-8 py-4 text-lg"
						size="lg">
						<ArrowLeft className="w-5 h-5 mr-3" />
						<span className="font-semibold">Back to Database</span>
						</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			{/* Modern Header */}
			<div className="relative">
				<div className='absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5' />
				<div className="relative sticky top-0 z-[60] border-b border-border/20 bg-background/80 backdrop-blur-xl shadow-sm">
					<div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
						<div className="max-w-7xl mx-auto">
							{/* Hero Section */}
							<div className="text-center mb-4 sm:mb-6">
								<div className='inline-flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3'>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => router.push("/home/database")}
										className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-primary/10 transition-colors">
										<ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
							</Button>
									<div className='p-2 sm:p-3 rounded-lg sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg'>
										<Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary" />
									</div>
									<h1 className='text-lg sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight'>
										Table Templates
									</h1>
								</div>
								<p className='text-xs sm:text-sm lg:text-base text-muted-foreground max-w-2xl mx-auto mb-3 sm:mb-4 px-2'>
									Choose from professionally designed table templates for{" "}
									<span className="font-semibold text-foreground bg-primary/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg">
										{selectedDatabase.name}
									</span>
								</p>
								<div className='flex items-center justify-center gap-1.5 sm:gap-2'>
									<Badge 
										variant="outline" 
										className="bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/30 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold"
									>
										<div className='w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 mr-1 sm:mr-1.5 animate-pulse' />
										{selectedCount} Selected
									</Badge>
									<Badge 
										variant="outline" 
										className="bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-500/30 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold"
									>
										<Zap className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5' />
										Instant Setup
									</Badge>
								</div>
						</div>

							{/* Action Bar */}
						{selectedCount > 0 && (
								<div className='flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-card/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border/50 shadow-sm'>
								<Button
									onClick={handleCreateTables}
									disabled={isCreating || selectedCount === 0}
										size="sm"
										className="shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary px-4 sm:px-6 lg:px-8">
									{isCreating ? (
										<>
												<div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
												<span className="font-semibold text-xs sm:text-sm">Creating Tables...</span>
										</>
									) : (
										<>
												<CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
												<span className="font-semibold text-xs sm:text-sm">Create {selectedCount} Table{selectedCount !== 1 ? 's' : ''}</span>
										</>
									)}
								</Button>
							</div>
						)}
						</div>
					</div>
				</div>
			</div>

			{/* Progress Indicator */}
			{(isCreating || progress) && (
				<div className="px-4 sm:px-6 lg:px-8 py-4">
					<div className="max-w-7xl mx-auto">
					<TemplateCreationProgress 
						progress={progress} 
						isCreating={isCreating} 
					/>
					</div>
				</div>
			)}

			{/* Main Content */}
			<div className="px-4 sm:px-6 lg:px-8 py-8">
				<div className="max-w-7xl mx-auto space-y-8">
					{/* Enhanced Search and Filters */}
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
								Discover Templates
							</h2>
							<p className="text-muted-foreground">
								Browse our collection of professionally designed table templates
							</p>
						</div>

						{/* Search Bar */}
						<div className="max-w-2xl mx-auto">
							<div className="relative">
								<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
							<Input
									placeholder="Search templates by name or description..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-12 pr-4 py-4 text-base rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm focus:shadow-md transition-all duration-200"
							/>
							</div>
						</div>

						{/* Category Filters */}
						<div className="flex justify-center">
							<div className="flex gap-2 flex-wrap justify-center max-w-4xl">
							<Button
								variant={selectedCategory === null ? "default" : "outline"}
									size="lg"
								onClick={() => setSelectedCategory(null)}
									className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
										selectedCategory === null 
											? 'shadow-lg bg-primary hover:bg-primary/90' 
											: 'hover:shadow-md'
									}`}>
									<Star className="w-4 h-4 mr-2" />
									All Templates
							</Button>
							{categories.map((category) => (
								<Button
									key={category}
									variant={selectedCategory === category ? "default" : "outline"}
										size="lg"
									onClick={() => setSelectedCategory(category)}
										className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
											selectedCategory === category 
												? 'shadow-lg bg-primary hover:bg-primary/90' 
												: 'hover:shadow-md'
										}`}>
									{category}
								</Button>
							))}
						</div>
					</div>

						{/* Enhanced Dependency Info */}
					{hasDependencies && (
							<div className="max-w-4xl mx-auto">
								<div className="p-6 bg-gradient-to-r from-blue-500/5 to-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
									<div className="flex gap-4">
										<div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
											<Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
										</div>
										<div className="flex-1">
											<h3 className="font-bold text-foreground mb-2 text-lg">Smart Dependency Management</h3>
											<p className="text-muted-foreground leading-relaxed">
												Templates with dependencies are automatically created in the correct order. 
												Select all required dependent templates to ensure proper setup.
											</p>
										</div>
								</div>
							</div>
						</div>
					)}
				</div>

					{/* Enhanced Templates Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
					{filteredTemplates.map((template) => {
						const isSelected = selectedTemplates.has(template.id);
						const canSelect = canSelectTemplate(template);
						const depStatus = getDependencyStatus(template);

						return (
							<Card
								key={template.id}
									className={`group cursor-pointer transition-all duration-300 border-2 hover:shadow-xl hover:scale-[1.02] ${
									isSelected
											? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-xl scale-[1.02]"
										: canSelect
											? "border-border/50 hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent shadow-md"
										: "border-border/30 opacity-60 cursor-not-allowed bg-muted/30"
								}`}
								onClick={() => {
									if (canSelect) {
										handleTemplateToggle(template.id);
									}
								}}>
									<CardHeader className="pb-4">
									<div className="flex items-start justify-between">
											<div className="flex items-center gap-4 min-w-0 flex-1">
											<div
													className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
													isSelected
															? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
															: "bg-gradient-to-br from-muted/60 to-muted/40 text-muted-foreground group-hover:from-primary/20 group-hover:to-primary/10 group-hover:text-primary"
													}`}>
													<template.icon className="w-8 h-8" />
											</div>
											<div className="min-w-0 flex-1">
													<CardTitle className="text-xl leading-tight truncate font-bold">
													{template.name}
												</CardTitle>
													<div className="flex items-center gap-2 mt-2">
														<Badge variant="outline" className="text-xs px-3 py-1">
														{template.category}
													</Badge>
													{template.dependencies.length > 0 && (
															<Badge variant="secondary" className="text-xs px-3 py-1">
																<Layers className="w-3 h-3 mr-1" />
															{template.dependencies.length} deps
														</Badge>
													)}
												</div>
											</div>
										</div>
											<div className="flex-shrink-0">
										<Checkbox
											checked={isSelected}
											disabled={!canSelect}
													className="w-5 h-5"
										/>
											</div>
									</div>
								</CardHeader>

									<CardContent className="pt-0 space-y-4">
										<p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
										{template.description}
									</p>

										<div className="flex items-center justify-between pt-2 border-t border-border/30">
											<div className="flex items-center gap-4">
												<div className="flex items-center gap-2">
													<Table className="w-4 h-4 text-muted-foreground" />
													<span className="text-sm text-muted-foreground font-medium">
											{template.columns.length} columns
										</span>
												</div>
												{isSelected && (
													<Badge variant="default" className="text-xs px-2 py-1 bg-green-500 hover:bg-green-600">
														<CheckCircle className="w-3 h-3 mr-1" />
														Selected
													</Badge>
												)}
											</div>

										{canSelect && (
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													setPreviewTemplate(template);
												}}
													className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10">
												<Eye className="w-3 h-3 mr-1" />
												Preview
											</Button>
										)}

										{!canSelect && (
												<div className="text-right max-w-[140px]">
													<span className="text-amber-600 dark:text-amber-400 font-medium text-xs leading-tight">
												{depStatus.message}
											</span>
												</div>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
					</div>
				</div>
				</div>

					{/* Enhanced Empty State */}
				{filteredTemplates.length === 0 && (
						<div className="text-center py-16">
							<div className='relative mb-8'>
								<div className='w-32 h-32 bg-gradient-to-br from-muted/30 to-muted/20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl'>
									<Search className='w-16 h-16 text-muted-foreground' />
								</div>
								<div className='absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg'>
									<X className='w-4 h-4 text-white' />
								</div>
							</div>
							
							<h3 className="text-3xl font-bold text-foreground mb-4">
								No Templates Found
							</h3>
							<p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
								Try adjusting your search terms or filter criteria to find the perfect templates for your project
							</p>
							
						<Button
							variant="outline"
							onClick={() => {
								setSearchQuery("");
								setSelectedCategory(null);
								}}
								className="shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg">
								<X className="w-5 h-5 mr-3" />
								<span className="font-semibold">Clear All Filters</span>
						</Button>
					</div>
				)}

			{previewTemplate && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
					<div 
						className="fixed inset-0 bg-black/60 backdrop-blur-md"
						onClick={() => setPreviewTemplate(null)}
					/>
					
					<div className="relative w-full max-w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] bg-background border border-border/50 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
						{/* Modal Header */}
						<div className="p-3 sm:p-6 lg:p-8 border-b border-border/20 bg-gradient-to-r from-background to-muted/10 flex-shrink-0">
							<div className="flex items-start justify-between gap-2 sm:gap-3">
								<div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
									<div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg flex items-center justify-center flex-shrink-0">
										{previewTemplate?.icon && React.createElement(previewTemplate.icon, { className: "w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" })}
									</div>
									<div className="flex-1 min-w-0">
										<h2 className="text-base sm:text-xl lg:text-2xl font-bold text-foreground mb-1 sm:mb-2 truncate">{previewTemplate?.name}</h2>
										<div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
											<Badge variant="outline" className="px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
												{previewTemplate?.category}
											</Badge>
											{previewTemplate && previewTemplate.dependencies.length > 0 && (
												<Badge variant="secondary" className="px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
													<Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
													{previewTemplate?.dependencies.length} Dep{previewTemplate?.dependencies.length !== 1 ? 's' : ''}
												</Badge>
											)}
										</div>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setPreviewTemplate(null)}
									className="p-1.5 sm:p-2 rounded-lg hover:bg-muted/50 transition-colors flex-shrink-0">
									<X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
								</Button>
							</div>
							<p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-2 sm:mt-3 lg:mt-4 leading-relaxed">
								{previewTemplate?.description}
							</p>
						</div>

						{/* Modal Content */}
						<div className="p-3 sm:p-6 lg:p-8 overflow-y-auto flex-1">
							<div className="space-y-4 sm:space-y-6">
								{/* Enhanced Table Structure */}
								<div>
									<h3 className="text-sm sm:text-base lg:text-lg font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
										<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
											<Table className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
										</div>
										Table Structure
									</h3>
									<div className="grid gap-2 sm:gap-3">
										{previewTemplate?.columns.map((column, index) => (
											<div
												key={index}
												className="p-2.5 sm:p-3 lg:p-4 bg-gradient-to-r from-card/50 to-card/30 rounded-lg sm:rounded-xl border border-border/30 hover:border-primary/30 transition-all duration-200">
												<div className="flex items-start sm:items-center gap-2 sm:gap-3">
													<div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-[10px] sm:text-xs font-bold text-primary flex-shrink-0">
														{index + 1}
													</div>
													<div className="flex-1 min-w-0">
														<h4 className="font-bold text-foreground text-xs sm:text-sm lg:text-base mb-1 truncate">
															{column.name}
														</h4>
														<div className="flex gap-1 sm:gap-1.5 flex-wrap">
															{column.primary && (
																<Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-primary">
																	Primary
																</Badge>
															)}
															{column.required && (
																<Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
																	Required
																</Badge>
															)}
															<Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
																{column.type}
															</Badge>
															{column.semanticType && (
																<Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
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

								{/* Enhanced Dependencies */}
								{previewTemplate && previewTemplate?.dependencies.length > 0 && (
									<div>
										<h3 className="text-sm sm:text-base lg:text-lg font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
											<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center flex-shrink-0">
												<AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
											</div>
											Dependencies
										</h3>
										<div className="grid gap-2 sm:gap-3">
											{previewTemplate?.dependencies.map((depId) => {
												const depTemplate = TABLE_TEMPLATES.find((t) => t.id === depId);
												const isSelected = selectedTemplates.has(depId);
												return (
													<div
														key={depId}
														className={`p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border transition-all duration-200 ${
															isSelected
																? "bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/30"
																: "bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/30"
														}`}>
														<div className="flex items-start sm:items-center gap-2 sm:gap-3">
														{isSelected ? (
																<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
														) : (
																<AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
														)}
														<div className="flex-1 min-w-0">
																<h4
																	className={`font-bold text-xs sm:text-sm lg:text-base mb-1 ${
																	isSelected
																		? "text-green-800 dark:text-green-200"
																		: "text-red-800 dark:text-red-200"
																}`}>
																{depTemplate?.name || depId}
																</h4>
																<p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
																{depTemplate?.description}
															</p>
															</div>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Enhanced Modal Footer */}
						<div className="p-3 sm:p-4 lg:p-6 border-t border-border/20 bg-gradient-to-r from-muted/20 to-muted/10 flex-shrink-0">
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
								<div className="flex items-center gap-1.5 sm:gap-2 justify-center sm:justify-start">
									{previewTemplate && selectedTemplates.has(previewTemplate?.id) ? (
										<>
											<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
											<span className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200">Template Selected</span>
										</>
									) : (
										<>
											<div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
											<span className="text-xs sm:text-sm text-muted-foreground">Click to select this template</span>
										</>
									)}
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() => setPreviewTemplate(null)}
										size="sm"
										className="flex-1 sm:flex-none px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm">
										Close
									</Button>
									<Button
										onClick={() => {
											if (previewTemplate) {
											handleTemplateToggle(previewTemplate.id);
											setPreviewTemplate(null);
											}
										}}
										disabled={!previewTemplate || (previewTemplate && !canSelectTemplate(previewTemplate))}
										size="sm"
										className="flex-1 sm:flex-none px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300">
										{previewTemplate && selectedTemplates.has(previewTemplate?.id)
											? "Deselect"
											: "Select"}
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
