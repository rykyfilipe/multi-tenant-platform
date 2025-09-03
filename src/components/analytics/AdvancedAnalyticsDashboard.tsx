/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
	Plus, 
	BarChart3, 
	LineChart, 
	PieChart, 
	Activity,
	TrendingUp,
	Users,
	Database,
	Zap,
	Settings,
	Eye,
	Download,
	Share2,
	Edit,
	Trash2,
	RefreshCw,
	Filter,
	Calendar,
	Target,
	Brain
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApp } from "@/contexts/AppContext";
import { logger } from "@/lib/error-logger";
import { 
	AnalyticsMetricType, 
	DashboardType, 
	ChartType,
	CustomDashboard,
	DashboardWidget 
} from "@/lib/advanced-analytics";

interface AdvancedAnalyticsDashboardProps {
	tenantId: string;
}

/**
 * Advanced Analytics Dashboard Component
 * Provides comprehensive analytics with custom dashboards
 */
export function AdvancedAnalyticsDashboard({ tenantId }: AdvancedAnalyticsDashboardProps) {
	const { t } = useLanguage();
	const { user } = useApp();
	const [dashboards, setDashboards] = useState<CustomDashboard[]>([]);
	const [selectedDashboard, setSelectedDashboard] = useState<CustomDashboard | null>(null);
	const [loading, setLoading] = useState(true);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showWidgetForm, setShowWidgetForm] = useState(false);
	const [insights, setInsights] = useState<any>(null);

	// Form state
	const [dashboardForm, setDashboardForm] = useState({
		name: "",
		description: "",
		type: DashboardType.CUSTOM,
		isPublic: false,
		theme: {
			primaryColor: "#3b82f6",
			backgroundColor: "#ffffff",
			textColor: "#1f2937",
			accentColor: "#10b981",
		},
	});

	const [widgetForm, setWidgetForm] = useState({
		title: "",
		chartType: ChartType.LINE,
		metricType: AnalyticsMetricType.USER_ACTIVITY,
		timeRange: "30d",
		aggregation: "avg" as const,
	});

	// Load dashboards and insights
	useEffect(() => {
		loadData();
	}, [tenantId]);

	const loadData = async () => {
		try {
			const [dashboardsResponse, insightsResponse] = await Promise.all([
				fetch(`/api/tenants/${tenantId}/analytics/dashboards`),
				fetch(`/api/tenants/${tenantId}/analytics/insights`),
			]);

			if (dashboardsResponse.ok) {
				const data = await dashboardsResponse.json();
				setDashboards(data.data || []);
				if (data.data && data.data.length > 0) {
					setSelectedDashboard(data.data[0]);
				}
			}

			if (insightsResponse.ok) {
				const data = await insightsResponse.json();
				setInsights(data.data);
			}
		} catch (error) {
			logger.error("Failed to load analytics data", error as Error, {
				component: "AdvancedAnalyticsDashboard",
			});
		} finally {
			setLoading(false);
		}
	};

	const createDashboard = async () => {
		try {
			const response = await fetch(`/api/tenants/${tenantId}/analytics/dashboards`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dashboardForm),
			});

			if (response.ok) {
				const data = await response.json();
				setDashboards(prev => [data.data, ...prev]);
				setSelectedDashboard(data.data);
				setShowCreateForm(false);
				resetDashboardForm();
				
				logger.info("Dashboard created successfully", {
					component: "AdvancedAnalyticsDashboard",
					dashboardId: data.data.id,
				});
			} else {
				const errorData = await response.json();
				logger.error("Failed to create dashboard", new Error(errorData.error), {
					component: "AdvancedAnalyticsDashboard",
				});
			}
		} catch (error) {
			logger.error("Failed to create dashboard", error as Error, {
				component: "AdvancedAnalyticsDashboard",
			});
		}
	};

	const addWidget = async () => {
		if (!selectedDashboard) return;

		try {
			const response = await fetch(`/api/tenants/${tenantId}/analytics/dashboards/${selectedDashboard.id}/widgets`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...widgetForm,
					position: {
						x: 0,
						y: 0,
						width: 6,
						height: 4,
					},
					config: {
						timeRange: widgetForm.timeRange,
						aggregation: widgetForm.aggregation,
						showLegend: true,
						showDataLabels: false,
					},
				}),
			});

			if (response.ok) {
				const data = await response.json();
				// Refresh the selected dashboard
				await loadData();
				setShowWidgetForm(false);
				resetWidgetForm();
				
				logger.info("Widget added successfully", {
					component: "AdvancedAnalyticsDashboard",
					widgetId: data.data.id,
				});
			} else {
				const errorData = await response.json();
				logger.error("Failed to add widget", new Error(errorData.error), {
					component: "AdvancedAnalyticsDashboard",
				});
			}
		} catch (error) {
			logger.error("Failed to add widget", error as Error, {
				component: "AdvancedAnalyticsDashboard",
			});
		}
	};

	const resetDashboardForm = () => {
		setDashboardForm({
			name: "",
			description: "",
			type: DashboardType.CUSTOM,
			isPublic: false,
			theme: {
				primaryColor: "#3b82f6",
				backgroundColor: "#ffffff",
				textColor: "#1f2937",
				accentColor: "#10b981",
			},
		});
	};

	const resetWidgetForm = () => {
		setWidgetForm({
			title: "",
			chartType: ChartType.LINE,
			metricType: AnalyticsMetricType.USER_ACTIVITY,
			timeRange: "30d",
			aggregation: "avg",
		});
	};

	const getChartIcon = (chartType: ChartType) => {
		switch (chartType) {
			case ChartType.LINE: return <LineChart className="h-4 w-4" />;
			case ChartType.BAR: return <BarChart3 className="h-4 w-4" />;
			case ChartType.PIE: return <PieChart className="h-4 w-4" />;
			case ChartType.AREA: return <Activity className="h-4 w-4" />;
			case ChartType.KPI: return <Target className="h-4 w-4" />;
			default: return <BarChart3 className="h-4 w-4" />;
		}
	};

	const getMetricIcon = (metricType: AnalyticsMetricType) => {
		switch (metricType) {
			case AnalyticsMetricType.USER_ACTIVITY: return <Users className="h-4 w-4" />;
			case AnalyticsMetricType.DATABASE_USAGE: return <Database className="h-4 w-4" />;
			case AnalyticsMetricType.API_PERFORMANCE: return <Zap className="h-4 w-4" />;
			case AnalyticsMetricType.REVENUE_ANALYTICS: return <TrendingUp className="h-4 w-4" />;
			default: return <Activity className="h-4 w-4" />;
		}
	};

	if (loading) {
		return (
			<div className="space-y-4">
				{[...Array(3)].map((_, i) => (
					<Card key={i}>
						<CardContent className="p-6">
							<div className="animate-pulse space-y-4">
								<div className="h-4 bg-muted rounded w-1/4"></div>
								<div className="h-3 bg-muted rounded w-1/2"></div>
								<div className="h-3 bg-muted rounded w-1/3"></div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Advanced Analytics</h2>
					<p className="text-muted-foreground">
						Comprehensive analytics with custom dashboards and insights
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => setShowWidgetForm(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Add Widget
					</Button>
					<Button onClick={() => setShowCreateForm(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Create Dashboard
					</Button>
				</div>
			</div>

			{/* Insights Summary */}
			{insights && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Brain className="h-5 w-5" />
							AI Insights
						</CardTitle>
						<CardDescription>
							{insights.summary}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<h4 className="font-medium mb-2">Trends</h4>
								<div className="space-y-2">
									{insights.trends?.map((trend: any, index: number) => (
										<div key={index} className="flex items-center gap-2 text-sm">
											<TrendingUp className="h-4 w-4 text-green-600" />
											<span>{trend.metric}: {trend.percentage}%</span>
											<Badge variant="outline">{trend.trend}</Badge>
										</div>
									))}
								</div>
							</div>
							<div>
								<h4 className="font-medium mb-2">Recommendations</h4>
								<div className="space-y-2">
									{insights.recommendations?.map((rec: any, index: number) => (
										<div key={index} className="text-sm">
											<div className="flex items-center gap-2">
												<span className="font-medium">{rec.title}</span>
												<Badge variant={rec.priority === "high" ? "destructive" : "secondary"}>
													{rec.priority}
												</Badge>
											</div>
											<p className="text-muted-foreground">{rec.description}</p>
										</div>
									))}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Dashboard Tabs */}
			<Tabs value={selectedDashboard?.id || ""} onValueChange={(value) => {
				const dashboard = dashboards.find(d => d.id === value);
				setSelectedDashboard(dashboard || null);
			}}>
				<TabsList className="grid w-full grid-cols-4">
					{dashboards.map((dashboard) => (
						<TabsTrigger key={dashboard.id} value={dashboard.id}>
							{dashboard.name}
						</TabsTrigger>
					))}
					<TabsTrigger value="create" onClick={() => setShowCreateForm(true)}>
						<Plus className="h-4 w-4 mr-1" />
						New
					</TabsTrigger>
				</TabsList>

				{dashboards.map((dashboard) => (
					<TabsContent key={dashboard.id} value={dashboard.id} className="space-y-4">
						{/* Dashboard Header */}
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-semibold">{dashboard.name}</h3>
								<p className="text-sm text-muted-foreground">{dashboard.description}</p>
							</div>
							<div className="flex gap-2">
								<Button variant="outline" size="sm">
									<Share2 className="h-4 w-4" />
								</Button>
								<Button variant="outline" size="sm">
									<Download className="h-4 w-4" />
								</Button>
								<Button variant="outline" size="sm">
									<Settings className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Dashboard Widgets */}
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{dashboard.widgets.map((widget) => (
								<Card key={widget.id} className="col-span-1">
									<CardHeader className="pb-3">
										<CardTitle className="text-sm flex items-center gap-2">
											{getChartIcon(widget.chartType)}
											{getMetricIcon(widget.metricType)}
											{widget.title}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="h-32 bg-muted rounded-lg flex items-center justify-center">
											<div className="text-center">
												<BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
												<p className="text-sm text-muted-foreground">
													{widget.chartType} Chart
												</p>
												<p className="text-xs text-muted-foreground">
													{widget.metricType}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
							
							{/* Add Widget Button */}
							<Card className="col-span-1 border-dashed">
								<CardContent className="p-6">
									<Button 
										variant="ghost" 
										className="w-full h-full min-h-[120px]"
										onClick={() => setShowWidgetForm(true)}
									>
										<div className="text-center">
											<Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
											<p className="text-sm text-muted-foreground">
												Add Widget
											</p>
										</div>
									</Button>
								</CardContent>
							</Card>
						</div>
					</TabsContent>
				))}
			</Tabs>

			{/* Create Dashboard Form */}
			{showCreateForm && (
				<Card>
					<CardHeader>
						<CardTitle>Create New Dashboard</CardTitle>
						<CardDescription>
							Create a custom analytics dashboard
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<Label htmlFor="name">Dashboard Name</Label>
								<Input
									id="name"
									value={dashboardForm.name}
									onChange={(e) => setDashboardForm(prev => ({ ...prev, name: e.target.value }))}
									placeholder="My Analytics Dashboard"
								/>
							</div>
							<div>
								<Label htmlFor="type">Dashboard Type</Label>
								<Select
									value={dashboardForm.type}
									onValueChange={(value) => setDashboardForm(prev => ({ ...prev, type: value as DashboardType }))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={DashboardType.EXECUTIVE}>Executive</SelectItem>
										<SelectItem value={DashboardType.OPERATIONAL}>Operational</SelectItem>
										<SelectItem value={DashboardType.MARKETING}>Marketing</SelectItem>
										<SelectItem value={DashboardType.DEVELOPER}>Developer</SelectItem>
										<SelectItem value={DashboardType.CUSTOM}>Custom</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div>
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={dashboardForm.description}
								onChange={(e) => setDashboardForm(prev => ({ ...prev, description: e.target.value }))}
								placeholder="Describe your dashboard purpose"
							/>
						</div>

						<div className="flex gap-4">
							<Button onClick={createDashboard} disabled={!dashboardForm.name}>
								Create Dashboard
							</Button>
							<Button variant="outline" onClick={() => setShowCreateForm(false)}>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Add Widget Form */}
			{showWidgetForm && selectedDashboard && (
				<Card>
					<CardHeader>
						<CardTitle>Add Widget to {selectedDashboard.name}</CardTitle>
						<CardDescription>
							Add a new analytics widget to your dashboard
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<Label htmlFor="widget-title">Widget Title</Label>
								<Input
									id="widget-title"
									value={widgetForm.title}
									onChange={(e) => setWidgetForm(prev => ({ ...prev, title: e.target.value }))}
									placeholder="User Activity Chart"
								/>
							</div>
							<div>
								<Label htmlFor="chart-type">Chart Type</Label>
								<Select
									value={widgetForm.chartType}
									onValueChange={(value) => setWidgetForm(prev => ({ ...prev, chartType: value as ChartType }))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ChartType.LINE}>Line Chart</SelectItem>
										<SelectItem value={ChartType.BAR}>Bar Chart</SelectItem>
										<SelectItem value={ChartType.PIE}>Pie Chart</SelectItem>
										<SelectItem value={ChartType.AREA}>Area Chart</SelectItem>
										<SelectItem value={ChartType.KPI}>KPI Card</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<Label htmlFor="metric-type">Metric Type</Label>
								<Select
									value={widgetForm.metricType}
									onValueChange={(value) => setWidgetForm(prev => ({ ...prev, metricType: value as AnalyticsMetricType }))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={AnalyticsMetricType.USER_ACTIVITY}>User Activity</SelectItem>
										<SelectItem value={AnalyticsMetricType.DATABASE_USAGE}>Database Usage</SelectItem>
										<SelectItem value={AnalyticsMetricType.API_PERFORMANCE}>API Performance</SelectItem>
										<SelectItem value={AnalyticsMetricType.REVENUE_ANALYTICS}>Revenue Analytics</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="time-range">Time Range</Label>
								<Select
									value={widgetForm.timeRange}
									onValueChange={(value) => setWidgetForm(prev => ({ ...prev, timeRange: value }))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="7d">Last 7 days</SelectItem>
										<SelectItem value="30d">Last 30 days</SelectItem>
										<SelectItem value="90d">Last 90 days</SelectItem>
										<SelectItem value="1y">Last year</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="flex gap-4">
							<Button onClick={addWidget} disabled={!widgetForm.title}>
								Add Widget
							</Button>
							<Button variant="outline" onClick={() => setShowWidgetForm(false)}>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
