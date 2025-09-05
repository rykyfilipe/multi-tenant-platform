/** @format */

"use client";

import { useState, useEffect } from "react";
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

	// Reset state when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setSelectedTemplates(new Set());
			setPreviewTemplate(null);
			setActiveView("list");
			setIsLoading(false);
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

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 h-screen w-max-screnn w-min z-50 flex items-center justify-center p-2 sm:p-4">
			{/* Backdrop */}
			<div 
				className="fixed inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			/>
			
			{/* Modal */}
			<div className="relative w-full max-w-7xl h-[95vh] sm:h-[90vh] bg-background border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col">
				{/* Header */}
				<div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border/10 bg-background/80 backdrop-blur-sm flex-shrink-0">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
							{activeView === "preview" && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleBackToList}
									className="p-2 h-8 w-8 flex-shrink-0">
									<ChevronLeft className="w-4 h-4" />
								</Button>
							)}
							<div className="min-w-0 flex-1">
								<h2 className="text-lg sm:text-xl font-semibold truncate">
									{activeView === "list"
										? t("database.templates.selectTemplates") || "Select Table Templates"
										: previewTemplate?.name || "Template Preview"}
								</h2>
								{activeView === "list" && (
									<p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
										Choose from our professionally designed table templates
									</p>
								)}
							</div>
						</div>
						<div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
							{activeView === "list" && selectedCount > 0 && (
								<Badge variant="default" className="px-2 sm:px-3 py-1 text-xs">
									{selectedCount} selected
								</Badge>
							)}
							<Button
								variant="ghost"
								size="sm"
								onClick={onClose}
								className="p-2 h-8 w-8">
								<X className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="p-3 sm:p-6">
							{activeView === "list" ? (
								<div className="space-y-6">
									{/* Category Tabs */}
									<div>
										<div className="flex flex-wrap gap-2">
											{Array.from(
												new Set(templates.map((t) => t.category)),
											).map((category) => (
												<Badge
													key={category}
													variant="outline"
													className="px-3 py-1 text-sm cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors">
													{category}
												</Badge>
											))}
										</div>
									</div>

									{/* Templates Grid */}
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
										{templates.map((template) => {
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
													<CardContent className="p-3 sm:p-4">
														<div className="flex gap-2 sm:gap-3">
															<div className="flex-shrink-0">
																<div
																	className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
																		isSelected
																			? "bg-primary text-primary-foreground"
																			: "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
																	} transition-colors`}>
																	<template.icon className="w-4 h-4 sm:w-5 sm:h-5" />
																</div>
															</div>

															<div className="flex-1 min-w-0">
																<div className="flex items-start justify-between mb-2">
																	<div className="min-w-0 flex-1">
																		<h4 className="font-semibold text-foreground text-xs sm:text-sm leading-tight truncate mb-1">
																			{template.name}
																		</h4>
																		<div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
																			<Badge
																				variant="outline"
																				className="text-xs font-medium px-1.5 sm:px-2 py-0.5">
																				{template.category}
																			</Badge>
																			{template.dependencies.length > 0 && (
																				<Badge
																					variant="secondary"
																					className="text-xs px-1.5 sm:px-2 py-0.5">
																					{template.dependencies.length} deps
																				</Badge>
																			)}
																		</div>
																	</div>

																	<Checkbox
																		checked={isSelected}
																		disabled={!canSelect}
																		className="ml-1 sm:ml-2 flex-shrink-0"
																	/>
																</div>

																<p className="text-muted-foreground text-sm leading-relaxed mb-2 line-clamp-2">
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
																				handlePreviewTemplate(template);
																			}}
																			className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10">
																			<Eye className="w-3 h-3 mr-1" />
																			Preview
																		</Button>
																	)}

																	{!canSelect && (
																		<span className="text-amber-600 dark:text-amber-400 font-medium text-xs text-right max-w-[100px] truncate">
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
										<div className="mt-8 max-w-2xl mx-auto">
											<div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
												<div className="flex gap-3">
													<Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
													<div className="text-sm text-blue-800 dark:text-blue-200">
														<div className="font-semibold mb-1">
															Dependency Management
														</div>
														<p className="leading-relaxed">
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
				<div className="px-6 py-4 border-t border-border/10 bg-background/80 backdrop-blur-sm">
					<div className="flex items-center justify-between w-full">
						<div className="text-sm text-muted-foreground">
							{activeView === "list" ? (
								selectedCount > 0 && (
									<div className="flex items-center gap-2">
										<CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
										<span>
											Will create{" "}
											<strong className="text-foreground mx-1">
												{selectedCount}
											</strong>
											{selectedCount === 1 ? " table" : " tables"}
										</span>
									</div>
								)
							) : (
								previewTemplate && (
									<span>
										Previewing{" "}
										<strong className="text-foreground">
											{previewTemplate.name}
										</strong>{" "}
										template
									</span>
								)
							)}
						</div>

						<div className="flex flex-wrap items-center justify-end gap-3 ">
							{activeView === "preview" && (
								<Button
									variant="outline"
									onClick={handleBackToList}
									className="px-4">
									Back to Templates
								</Button>
							)}
							<Button
								variant="outline"
								onClick={onClose}
								className="px-4">
								Cancel
							</Button>
							{activeView === "list" ? (
								<Button
									onClick={handleCreateTables}
									disabled={selectedCount === 0 || isLoading}
									className="px-6 gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200">
									{isLoading ? (
										<>
											<div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
											Creating...
										</>
									) : (
										<>
											<CheckCircle className="w-4 h-4" />
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
									className="px-6 gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200">
									<CheckCircle className="w-4 h-4" />
									{selectedTemplates.has(previewTemplate?.id || "")
										? "Already Selected"
										: "Select Template"}
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
