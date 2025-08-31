/** @format */

"use client";

import React, { useState } from "react";
import {
	LayoutDashboard,
	BarChart3,
	TrendingUp,
	Users,
	Database,
	Activity,
	Monitor,
	Settings,
	Plus,
	Eye,
	Download,
	Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CreateDashboardRequest, WidgetType } from "@/types/dashboard";

interface DashboardTemplate {
	id: string;
	name: string;
	description: string;
	category: string;
	icon: React.ReactNode;
	preview: string;
	widgets: Array<{
		type: WidgetType;
		config: any;
		position: { x: number; y: number; width: number; height: number };
	}>;
	tags: string[];
	popularity: number;
}

interface DashboardTemplatesProps {
	isOpen: boolean;
	onClose: () => void;
	onCreateFromTemplate: (
		template: DashboardTemplate,
		customizations: any,
	) => void;
}

const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
	{
		id: "analytics-overview",
		name: "Analytics Overview",
		description: "Complete analytics dashboard with charts, metrics, and KPIs",
		category: "analytics",
		icon: <BarChart3 className='w-6 h-6' />,
		preview: "📊📈📉",
		widgets: [
			{
				type: "chart",
				config: { title: "Revenue Trend", chartType: "line" },
				position: { x: 0, y: 0, width: 8, height: 4 },
			},
			{
				type: "progress",
				config: { title: "Monthly Goal", progressValue: 75 },
				position: { x: 8, y: 0, width: 4, height: 2 },
			},
			{
				type: "table",
				config: {
					title: "Top Products",
					tableColumns: ["Product", "Sales", "Revenue"],
				},
				position: { x: 0, y: 4, width: 6, height: 4 },
			},
			{
				type: "paragraph",
				config: {
					title: "Key Insights",
					text: "Revenue increased by 15% this month",
				},
				position: { x: 6, y: 4, width: 6, height: 4 },
			},
		],
		tags: ["analytics", "revenue", "kpi"],
		popularity: 95,
	},
	{
		id: "user-dashboard",
		name: "User Dashboard",
		description: "User management and activity monitoring dashboard",
		category: "users",
		icon: <Users className='w-6 h-6' />,
		preview: "👥📊📈",
		widgets: [
			{
				type: "chart",
				config: { title: "User Growth", chartType: "bar" },
				position: { x: 0, y: 0, width: 6, height: 4 },
			},
			{
				type: "progress",
				config: { title: "Active Users", progressValue: 68 },
				position: { x: 6, y: 0, width: 6, height: 2 },
			},
			{
				type: "table",
				config: {
					title: "Recent Users",
					tableColumns: ["Name", "Email", "Status"],
				},
				position: { x: 0, y: 4, width: 12, height: 4 },
			},
		],
		tags: ["users", "management", "activity"],
		popularity: 87,
	},
	{
		id: "database-monitoring",
		name: "Database Monitoring",
		description: "Database performance and health monitoring dashboard",
		category: "monitoring",
		icon: <Database className='w-6 h-6' />,
		preview: "🗄️📊⚡",
		widgets: [
			{
				type: "chart",
				config: { title: "Query Performance", chartType: "line" },
				position: { x: 0, y: 0, width: 8, height: 4 },
			},
			{
				type: "progress",
				config: { title: "Database Health", progressValue: 92 },
				position: { x: 8, y: 0, width: 4, height: 2 },
			},
			{
				type: "paragraph",
				config: { title: "System Status", text: "All systems operational" },
				position: { x: 0, y: 4, width: 6, height: 4 },
			},
			{
				type: "table",
				config: {
					title: "Slow Queries",
					tableColumns: ["Query", "Duration", "Count"],
				},
				position: { x: 6, y: 4, width: 6, height: 4 },
			},
		],
		tags: ["database", "monitoring", "performance"],
		popularity: 78,
	},
	{
		id: "executive-summary",
		name: "Executive Summary",
		description: "High-level business metrics for executives and stakeholders",
		category: "business",
		icon: <TrendingUp className='w-6 h-6' />,
		preview: "📈💰🎯",
		widgets: [
			{
				type: "chart",
				config: { title: "Business Metrics", chartType: "doughnut" },
				position: { x: 0, y: 0, width: 6, height: 4 },
			},
			{
				type: "progress",
				config: { title: "Annual Target", progressValue: 82 },
				position: { x: 6, y: 0, width: 6, height: 2 },
			},
			{
				type: "paragraph",
				config: {
					title: "Executive Summary",
					text: "Q4 performance exceeds expectations",
				},
				position: { x: 0, y: 4, width: 12, height: 4 },
			},
		],
		tags: ["executive", "business", "summary"],
		popularity: 91,
	},
	{
		id: "development-metrics",
		name: "Development Metrics",
		description: "Software development team performance and metrics",
		category: "development",
		icon: <Activity className='w-6 h-6' />,
		preview: "💻🚀📊",
		widgets: [
			{
				type: "chart",
				config: { title: "Sprint Velocity", chartType: "bar" },
				position: { x: 0, y: 0, width: 8, height: 4 },
			},
			{
				type: "progress",
				config: { title: "Code Coverage", progressValue: 89 },
				position: { x: 8, y: 0, width: 4, height: 2 },
			},
			{
				type: "table",
				config: {
					title: "Recent Deployments",
					tableColumns: ["Version", "Date", "Status"],
				},
				position: { x: 0, y: 4, width: 12, height: 4 },
			},
		],
		tags: ["development", "agile", "metrics"],
		popularity: 73,
	},
];

export function DashboardTemplates({
	isOpen,
	onClose,
	onCreateFromTemplate,
}: DashboardTemplatesProps) {
	const [selectedTemplate, setSelectedTemplate] =
		useState<DashboardTemplate | null>(null);
	const [customizations, setCustomizations] = useState({
		name: "",
		description: "",
		includeSampleData: true,
		theme: "default",
	});

	const handleTemplateSelect = (template: DashboardTemplate) => {
		setSelectedTemplate(template);
		setCustomizations({
			name: template.name,
			description: template.description,
			includeSampleData: true,
			theme: "default",
		});
	};

	const handleCreate = () => {
		if (selectedTemplate) {
			onCreateFromTemplate(selectedTemplate, customizations);
			onClose();
		}
	};

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "analytics":
				return <BarChart3 className='w-4 h-4' />;
			case "users":
				return <Users className='w-4 h-4' />;
			case "monitoring":
				return <Monitor className='w-4 h-4' />;
			case "business":
				return <TrendingUp className='w-4 h-4' />;
			case "development":
				return <Activity className='w-4 h-4' />;
			default:
				return <LayoutDashboard className='w-4 h-4' />;
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
			<div className='bg-card border rounded-lg shadow-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b'>
					<div className='flex items-center gap-3'>
						<LayoutDashboard className='w-6 h-6' />
						<div>
							<h2 className='text-xl font-semibold'>Dashboard Templates</h2>
							<p className='text-sm text-muted-foreground'>
								Choose from predefined templates to quickly create dashboards
							</p>
						</div>
					</div>
					<Button variant='ghost' size='sm' onClick={onClose}>
						✕
					</Button>
				</div>

				{/* Content */}
				<div className='p-6'>
					<Tabs defaultValue='templates' className='w-full'>
						<TabsList className='grid w-full grid-cols-3'>
							<TabsTrigger value='templates'>Templates</TabsTrigger>
							<TabsTrigger value='customize' disabled={!selectedTemplate}>
								Customize
							</TabsTrigger>
							<TabsTrigger value='preview' disabled={!selectedTemplate}>
								Preview
							</TabsTrigger>
						</TabsList>

						{/* Templates Tab */}
						<TabsContent value='templates' className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{DASHBOARD_TEMPLATES.map((template) => (
									<Card
										key={template.id}
										className={`cursor-pointer transition-all hover:shadow-lg ${
											selectedTemplate?.id === template.id
												? "ring-2 ring-primary"
												: ""
										}`}
										onClick={() => handleTemplateSelect(template)}>
										<CardHeader className='pb-3'>
											<div className='flex items-center justify-between'>
												<div className='flex items-center gap-2'>
													{template.icon}
													<CardTitle className='text-lg'>
														{template.name}
													</CardTitle>
												</div>
												<Badge variant='secondary'>
													{template.popularity}%
												</Badge>
											</div>
											<p className='text-sm text-muted-foreground'>
												{template.description}
											</p>
										</CardHeader>
										<CardContent>
											<div className='text-center text-2xl mb-3'>
												{template.preview}
											</div>
											<div className='flex items-center justify-between text-sm'>
												<div className='flex items-center gap-1'>
													{getCategoryIcon(template.category)}
													<span className='capitalize'>
														{template.category}
													</span>
												</div>
												<div className='flex gap-1'>
													{template.tags.slice(0, 2).map((tag) => (
														<Badge
															key={tag}
															variant='outline'
															className='text-xs'>
															{tag}
														</Badge>
													))}
												</div>
											</div>
											<div className='mt-3 text-xs text-muted-foreground'>
												{template.widgets.length} widgets
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</TabsContent>

						{/* Customize Tab */}
						<TabsContent value='customize' className='space-y-6'>
							{selectedTemplate && (
								<Card>
									<CardHeader>
										<CardTitle>Customize Template</CardTitle>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div>
											<Label htmlFor='templateName'>Dashboard Name</Label>
											<Input
												id='templateName'
												value={customizations.name}
												onChange={(e) =>
													setCustomizations((prev) => ({
														...prev,
														name: e.target.value,
													}))
												}
												placeholder='Enter dashboard name'
											/>
										</div>
										<div>
											<Label htmlFor='templateDescription'>Description</Label>
											<Textarea
												id='templateDescription'
												value={customizations.description}
												onChange={(e) =>
													setCustomizations((prev) => ({
														...prev,
														description: e.target.value,
													}))
												}
												placeholder='Enter dashboard description'
												rows={3}
											/>
										</div>
										<div className='grid grid-cols-2 gap-4'>
											<div>
												<Label htmlFor='templateTheme'>Theme</Label>
												<Select
													value={customizations.theme}
													onValueChange={(value) =>
														setCustomizations((prev) => ({
															...prev,
															theme: value,
														}))
													}>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='default'>Default</SelectItem>
														<SelectItem value='dark'>Dark</SelectItem>
														<SelectItem value='light'>Light</SelectItem>
														<SelectItem value='corporate'>Corporate</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className='flex items-center justify-between'>
												<div>
													<Label htmlFor='includeSampleData'>
														Include Sample Data
													</Label>
													<p className='text-sm text-muted-foreground'>
														Add sample data to widgets
													</p>
												</div>
												<Switch
													id='includeSampleData'
													checked={customizations.includeSampleData}
													onCheckedChange={(checked) =>
														setCustomizations((prev) => ({
															...prev,
															includeSampleData: checked,
														}))
													}
												/>
											</div>
										</div>
									</CardContent>
								</Card>
							)}
						</TabsContent>

						{/* Preview Tab */}
						<TabsContent value='preview' className='space-y-6'>
							{selectedTemplate && (
								<Card>
									<CardHeader>
										<CardTitle>Template Preview</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='bg-muted p-4 rounded-lg'>
											<div className='text-center text-4xl mb-4'>
												{selectedTemplate.preview}
											</div>
											<div className='grid grid-cols-12 gap-2 h-64 bg-background p-4 rounded border'>
												{selectedTemplate.widgets.map((widget, index) => (
													<div
														key={index}
														className='bg-primary/20 border border-primary/30 rounded p-2 text-xs text-center flex items-center justify-center'
														style={{
															gridColumn: `span ${widget.position.width}`,
															gridRow: `span ${widget.position.height}`,
															gridColumnStart: widget.position.x + 1,
															gridRowStart: widget.position.y + 1,
														}}>
														{widget.config.title}
													</div>
												))}
											</div>
											<div className='mt-4 text-center text-sm text-muted-foreground'>
												This template includes {selectedTemplate.widgets.length}{" "}
												widgets
											</div>
										</div>
									</CardContent>
								</Card>
							)}
						</TabsContent>
					</Tabs>
				</div>

				{/* Footer */}
				<div className='flex items-center justify-between p-6 border-t'>
					<div className='text-sm text-muted-foreground'>
						{selectedTemplate
							? `Selected: ${selectedTemplate.name}`
							: "No template selected"}
					</div>
					<div className='flex gap-3'>
						<Button variant='outline' onClick={onClose}>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={!selectedTemplate || !customizations.name.trim()}>
							<Plus className='w-4 h-4 mr-2' />
							Create Dashboard
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
