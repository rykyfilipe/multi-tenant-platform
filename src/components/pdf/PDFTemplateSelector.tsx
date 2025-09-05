/** @format */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Settings, Palette, Type, Layout } from "lucide-react";
import { PDF_TEMPLATES, PDFTemplate, PDFCustomization } from "@/lib/pdf-templates";
import { useLanguage } from "@/contexts/LanguageContext";

interface PDFTemplateSelectorProps {
	selectedTemplate?: string;
	onTemplateSelect: (templateId: string) => void;
	onCustomize: (templateId: string) => void;
	onPreview: (templateId: string) => void;
}

export function PDFTemplateSelector({
	selectedTemplate,
	onTemplateSelect,
	onCustomize,
	onPreview,
}: PDFTemplateSelectorProps) {
	const { t } = useLanguage();
	const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

	const getCategoryColor = (category: string) => {
		const colors = {
			modern: "bg-blue-100 text-blue-800",
			classic: "bg-gray-100 text-gray-800",
			luxury: "bg-purple-100 text-purple-800",
			compact: "bg-green-100 text-green-800",
			detailed: "bg-orange-100 text-orange-800",
		};
		return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
	};

	const getCategoryIcon = (category: string) => {
		const icons = {
			modern: <Layout className="w-4 h-4" />,
			classic: <Type className="w-4 h-4" />,
			luxury: <Palette className="w-4 h-4" />,
			compact: <Settings className="w-4 h-4" />,
			detailed: <Layout className="w-4 h-4" />,
		};
		return icons[category as keyof typeof icons] || <Layout className="w-4 h-4" />;
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-2xl font-bold text-foreground mb-2">
					{t("pdf.templateSelector.title")}
				</h2>
				<p className="text-muted-foreground">
					{t("pdf.templateSelector.description")}
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{PDF_TEMPLATES.map((template) => (
					<Card
						key={template.id}
						className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
							selectedTemplate === template.id
								? "ring-2 ring-primary border-primary"
								: "hover:border-primary/50"
						}`}
						onClick={() => onTemplateSelect(template.id)}
						onMouseEnter={() => setHoveredTemplate(template.id)}
						onMouseLeave={() => setHoveredTemplate(null)}
					>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{getCategoryIcon(template.category)}
									<CardTitle className="text-lg">{template.name}</CardTitle>
								</div>
								<Badge className={getCategoryColor(template.category)}>
									{template.category}
								</Badge>
							</div>
							<CardDescription className="text-sm">
								{template.description}
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							{/* Template Preview */}
							<div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
								<div className="text-center text-muted-foreground">
									<Layout className="w-12 h-12 mx-auto mb-2 opacity-50" />
									<p className="text-sm">Template Preview</p>
								</div>
							</div>

							{/* Features */}
							<div className="space-y-2">
								<h4 className="text-sm font-medium text-foreground">
									{t("pdf.templateSelector.features")}
								</h4>
								<div className="flex flex-wrap gap-1">
									{template.features.slice(0, 3).map((feature, index) => (
										<Badge key={index} variant="secondary" className="text-xs">
											{feature}
										</Badge>
									))}
									{template.features.length > 3 && (
										<Badge variant="outline" className="text-xs">
											+{template.features.length - 3} more
										</Badge>
									)}
								</div>
							</div>

							{/* Color Palette */}
							<div className="space-y-2">
								<h4 className="text-sm font-medium text-foreground">
									{t("pdf.templateSelector.colorPalette")}
								</h4>
								<div className="flex gap-1">
									<div
										className="w-6 h-6 rounded-full border border-border"
										style={{ backgroundColor: template.colors.primary }}
									/>
									<div
										className="w-6 h-6 rounded-full border border-border"
										style={{ backgroundColor: template.colors.secondary }}
									/>
									<div
										className="w-6 h-6 rounded-full border border-border"
										style={{ backgroundColor: template.colors.accent }}
									/>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									className="flex-1"
									onClick={(e) => {
										e.stopPropagation();
										onPreview(template.id);
									}}
								>
									<Eye className="w-4 h-4 mr-1" />
									{t("common.preview")}
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="flex-1"
									onClick={(e) => {
										e.stopPropagation();
										onCustomize(template.id);
									}}
								>
									<Settings className="w-4 h-4 mr-1" />
									{t("common.customize")}
								</Button>
							</div>

							{/* Selection Indicator */}
							{selectedTemplate === template.id && (
								<div className="absolute top-2 right-2">
									<div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
										<svg
											className="w-4 h-4 text-white"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Template Categories */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold text-foreground">
					{t("pdf.templateSelector.categories")}
				</h3>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					{['modern', 'classic', 'luxury', 'compact', 'detailed'].map((category) => {
						const templates = PDF_TEMPLATES.filter(t => t.category === category);
						return (
							<Card key={category} className="p-4 text-center">
								<div className="space-y-2">
									{getCategoryIcon(category)}
									<h4 className="font-medium capitalize">{category}</h4>
									<p className="text-sm text-muted-foreground">
										{templates.length} template{templates.length !== 1 ? 's' : ''}
									</p>
								</div>
							</Card>
						);
					})}
				</div>
			</div>
		</div>
	);
}
