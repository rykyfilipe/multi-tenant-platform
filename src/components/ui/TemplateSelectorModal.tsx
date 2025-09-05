/** @format */

"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
	Sparkles,
	Zap,
	Star,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

interface TemplateSelectorModalProps {
	isOpen: boolean;
	onClose: () => void;
	onTemplatesSelected: (templates: TemplateTable[]) => void;
	templates: TemplateTable[];
	selectedDatabaseId: number | null;
}

export function TemplateSelectorModal({
	isOpen,
	onClose,
	onTemplatesSelected,
	templates,
	selectedDatabaseId,
}: TemplateSelectorModalProps) {
	const { t } = useLanguage();
	const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
	const [previewTemplate, setPreviewTemplate] = useState<TemplateTable | null>(null);
	const [activeView, setActiveView] = useState<"list" | "preview">("list");
	const [isLoading, setIsLoading] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string>("All");

	// Reset state when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setSelectedTemplates(new Set());
			setPreviewTemplate(null);
			setActiveView("list");
			setIsLoading(false);
			setSelectedCategory("All");
		}
	}, [isOpen]);

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
			const depTemplate = templates.find((t) => t.id === depId);
			return depTemplate?.name || depId;
		});

		return {
			status: "blocked",
			message: `Requires: ${depNames.join(", ")}`,
		};
	};

	const handleCreateTables = async () => {
		setIsLoading(true);
		try {
			const templatesToCreate = templates.filter((t) =>
				selectedTemplates.has(t.id),
			);
			onTemplatesSelected(templatesToCreate);
			onClose();
		} catch (error) {
			console.error("Error creating tables:", error);
		} finally {
			setIsLoading(false);
		}
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
	const hasDependencies = templates.some((t) => t.dependencies.length > 0);
	
	// Filter templates by category
	const filteredTemplates = selectedCategory === "All" 
		? templates 
		: templates.filter(t => t.category === selectedCategory);
	
	// Get unique categories
	const categories = ["All", ...Array.from(new Set(templates.map(t => t.category)))];

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-7xl h-[95vh] p-0 gap-0 overflow-hidden bg-gradient-to-br from-slate-50/50 via-white to-slate-100/50 dark:from-slate-950/50 dark:via-slate-900 dark:to-slate-800/50">
				{/* Header */}
				<DialogHeader className="px-8 py-6 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							{activeView === "preview" && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleBackToList}
									className="p-2 h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
									<ChevronLeft className="w-4 h-4" />
								</Button>
							)}
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
									<Sparkles className="w-5 h-5 text-primary" />
								</div>
								<div>
									<DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
										{activeView === "list"
											? t("database.templates.selectTemplates") || "Select Table Templates"
											: previewTemplate?.name || "Template Preview"}
									</DialogTitle>
									{activeView === "list" && (
										<p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
											Choose from our professionally designed table templates
										</p>
									)}
								</div>
							</div>
						</div>
						<div className="flex items-center gap-3">
							{activeView === "list" && selectedCount > 0 && (
								<Badge className="px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white border-0 shadow-lg">
									<Star className="w-3 h-3 mr-1" />
									{selectedCount} selected
								</Badge>
							)}
							<Button
								variant="ghost"
								size="sm"
								onClick={onClose}
								className="p-2 h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
								<X className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</DialogHeader>

				{/* Body */}
				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="p-8">
							{activeView === "list" ? (
								<div className="space-y-8">
									{/* Category Filters */}
									<div className="space-y-4">
										<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filter by Category</h3>
										<div className="flex flex-wrap gap-3">
											{categories.map((category) => (
												<Button
													key={category}
													variant={selectedCategory === category ? "default" : "outline"}
													onClick={() => setSelectedCategory(category)}
													className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
														selectedCategory === category
															? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg hover:shadow-xl scale-105"
															: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md"
													}`}>
													{category === "All" && <Zap className="w-4 h-4 mr-2" />}
													{category}
													{category !== "All" && (
														<Badge variant="secondary" className="ml-2 px-2 py-0.5 text-xs">
															{templates.filter(t => t.category === category).length}
														</Badge>
													)}
												</Button>
											))}
										</div>
									</div>

									{/* Templates Grid */}
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
												{selectedCategory === "All" ? "All Templates" : `${selectedCategory} Templates`}
											</h3>
											<span className="text-sm text-slate-600 dark:text-slate-400">
												{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
											</span>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
											{filteredTemplates.map((template) => {
												const isSelected = selectedTemplates.has(template.id);
												const canSelect = canSelectTemplate(template);
												const depStatus = getDependencyStatus(template);

												return (
													<Card
														key={template.id}
														className={`group cursor-pointer transition-all duration-500 border-0 hover:shadow-2xl hover:shadow-primary/10 ${
															isSelected
																? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-xl shadow-primary/20 scale-[1.02] ring-2 ring-primary/30"
																: canSelect
																? "bg-white dark:bg-slate-800 hover:bg-gradient-to-br hover:from-slate-50 hover:to-white dark:hover:from-slate-800 dark:hover:to-slate-700 shadow-lg hover:shadow-xl"
																: "bg-slate-50 dark:bg-slate-800/50 opacity-60 cursor-not-allowed"
														} rounded-3xl overflow-hidden`}
														onClick={() => {
															if (canSelect) {
																handleTemplateToggle(template.id);
															}
														}}>
														<CardContent className="p-6">
															<div className="space-y-4">
																{/* Header */}
																<div className="flex items-start justify-between">
																	<div className="flex items-center gap-4">
																		<div
																			className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
																				isSelected
																					? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg"
																					: canSelect
																					? "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 group-hover:from-primary/10 group-hover:to-primary/5 group-hover:text-primary"
																					: "bg-slate-100 dark:bg-slate-700 text-slate-400"
																			}`}>
																			<template.icon className="w-7 h-7" />
																		</div>
																		<div className="min-w-0 flex-1">
																			<h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight mb-1">
																				{template.name}
																			</h4>
																			<div className="flex items-center gap-2 flex-wrap">
																				<Badge
																					variant="outline"
																					className="text-xs font-medium px-3 py-1 rounded-full border-slate-200 dark:border-slate-600">
																					{template.category}
																				</Badge>
																				{template.dependencies.length > 0 && (
																					<Badge
																						variant="secondary"
																						className="text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
																						{template.dependencies.length} deps
																					</Badge>
																				)}
																			</div>
																		</div>
																	</div>

																	<div className="flex items-center gap-2">
																		{canSelect && (
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={(e) => {
																					e.stopPropagation();
																					handlePreviewTemplate(template);
																				}}
																				className="h-8 w-8 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/10">
																				<Eye className="w-4 h-4" />
																			</Button>
																		)}
																		<Checkbox
																			checked={isSelected}
																			disabled={!canSelect}
																			className="w-5 h-5"
																		/>
																	</div>
																</div>

																{/* Description */}
																<p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">
																	{template.description}
																</p>

																{/* Footer */}
																<div className="flex items-center justify-between pt-2">
																	<div className="flex items-center gap-4">
																		<span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
																			{template.columns.length} columns
																		</span>
																		{isSelected && (
																			<div className="flex items-center gap-1 text-primary text-xs font-medium">
																				<CheckCircle className="w-3 h-3" />
																				Selected
																			</div>
																		)}
																	</div>

																	{!canSelect && (
																		<span className="text-amber-600 dark:text-amber-400 font-medium text-xs text-right max-w-[120px] truncate bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
																			{depStatus.message}
																		</span>
																	)}
																</div>
															</div>
														</CardContent>
													</Card>
												);
											})}
										</div>
									</div>

									{/* Dependency Info */}
									{hasDependencies && (
										<div className="mt-12 max-w-4xl mx-auto">
											<div className="p-6 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-3xl border border-blue-200/60 dark:border-blue-800/60 shadow-lg">
												<div className="flex gap-4">
													<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
														<Info className="w-6 h-6 text-white" />
													</div>
													<div className="text-slate-800 dark:text-slate-200">
														<div className="font-bold text-lg mb-2">
															Dependency Management
														</div>
														<p className="leading-relaxed text-sm">
															Tables with dependencies will be created in the
															correct order. Make sure to select all required
															dependent tables for a complete setup.
														</p>
													</div>
												</div>
											</div>
										</div>
									)}
								</div>
							) : (
								/* Preview View */
								<div className="space-y-6">
									{previewTemplate && (
										<div className="space-y-6">
											{/* Template Header */}
											<div className="text-center pb-6 border-b border-border/10">
												<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
													<previewTemplate.icon className="w-8 h-8 text-primary" />
												</div>
												<h2 className="text-2xl font-bold text-foreground mb-2">
													{previewTemplate.name}
												</h2>
												<Badge
													variant="outline"
													className="text-sm px-3 py-1 mb-3">
													{previewTemplate.category}
												</Badge>
												<p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
													{previewTemplate.description}
												</p>
											</div>

											{/* Table Structure */}
											<div>
												<h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-lg">
													<Database className="w-5 h-5" />
													Table Structure
												</h3>
												<div className="space-y-3">
													{previewTemplate.columns.map((column, index) => (
														<div
															key={index}
															className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-muted/40 rounded-xl border border-border/10 gap-3">
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
																			<Badge
																				variant="default"
																				className="text-xs px-2 py-0.5">
																				Primary Key
																			</Badge>
																		)}
																		{column.required && (
																			<Badge
																				variant="secondary"
																				className="text-xs px-2 py-0.5">
																				Required
																			</Badge>
																		)}
																		<Badge
																			variant="outline"
																			className="text-xs px-2 py-0.5">
																			{column.type}
																		</Badge>
																		{column.semanticType && (
																			<Badge
																				variant="outline"
																				className="text-xs px-2 py-0.5">
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
													<h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-lg">
														<AlertCircle className="w-5 h-5" />
														Dependencies
													</h3>
													<div className="space-y-2">
														{previewTemplate.dependencies.map((depId) => {
															const depTemplate = templates.find((t) => t.id === depId);
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
									)}
								</div>
							)}
						</div>
					</ScrollArea>
				</div>

				{/* Footer */}
				<DialogFooter className="px-8 py-6 border-t border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
					<div className="flex items-center justify-between w-full">
						<div className="text-sm text-slate-600 dark:text-slate-400">
							{activeView === "list" ? (
								selectedCount > 0 && (
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
											<CheckCircle className="w-4 h-4 text-white" />
										</div>
										<div>
											<span className="font-semibold text-slate-900 dark:text-slate-100">
												Will create {selectedCount} {selectedCount === 1 ? "table" : "tables"}
											</span>
											<p className="text-xs text-slate-500 dark:text-slate-500">
												Ready to generate your database structure
											</p>
										</div>
									</div>
								)
							) : (
								previewTemplate && (
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
											<Eye className="w-4 h-4 text-white" />
										</div>
										<div>
											<span className="font-semibold text-slate-900 dark:text-slate-100">
												Previewing {previewTemplate.name}
											</span>
											<p className="text-xs text-slate-500 dark:text-slate-500">
												Review template structure and dependencies
											</p>
										</div>
									</div>
								)
							)}
						</div>

						<div className="flex items-center gap-4">
							{activeView === "preview" && (
								<Button
									variant="outline"
									onClick={handleBackToList}
									className="px-6 py-3 rounded-2xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
									<ChevronLeft className="w-4 h-4 mr-2" />
									Back to Templates
								</Button>
							)}
							<Button
								variant="outline"
								onClick={onClose}
								className="px-6 py-3 rounded-2xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
								Cancel
							</Button>
							{activeView === "list" ? (
								<Button
									onClick={handleCreateTables}
									disabled={selectedCount === 0 || isLoading}
									className="px-8 py-3 gap-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl font-semibold">
									{isLoading ? (
										<>
											<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											Creating Tables...
										</>
									) : (
										<>
											<CheckCircle className="w-5 h-5" />
											Create Tables
										</>
									)}
								</Button>
							) : (
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
									className="px-8 py-3 gap-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl font-semibold">
									<CheckCircle className="w-5 h-5" />
									{selectedTemplates.has(previewTemplate?.id || "")
										? "Already Selected"
										: "Select Template"}
								</Button>
							)}
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
