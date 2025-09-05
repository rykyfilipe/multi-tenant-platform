/** @format */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
	BarChart3, 
	Download, 
	Clock, 
	FileText, 
	TrendingUp, 
	Users, 
	Calendar,
	Zap,
	QrCode,
	Barcode,
	Water,
	Signature
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PDFAnalyticsData {
	totalGenerated: number;
	totalDownloads: number;
	averageGenerationTime: number;
	mostUsedTemplate: string;
	templateUsage: Array<{
		templateId: string;
		count: number;
		percentage: number;
	}>;
	featureUsage: Array<{
		feature: string;
		count: number;
		percentage: number;
	}>;
	generationTrend: Array<{
		date: string;
		count: number;
	}>;
	fileSizeStats: {
		average: number;
		min: number;
		max: number;
	};
	performanceMetrics: {
		fastestGeneration: number;
		slowestGeneration: number;
		errorRate: number;
	};
}

interface PDFAnalyticsProps {
	tenantId: string;
	timeRange?: '7d' | '30d' | '90d' | '1y';
}

export function PDFAnalytics({ tenantId, timeRange = '30d' }: PDFAnalyticsProps) {
	const { t } = useLanguage();
	const [analytics, setAnalytics] = useState<PDFAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchAnalytics();
	}, [tenantId, timeRange]);

	const fetchAnalytics = async () => {
		try {
			setLoading(true);
			// Mock data for now - replace with actual API call
			const mockData: PDFAnalyticsData = {
				totalGenerated: 1247,
				totalDownloads: 1156,
				averageGenerationTime: 1250,
				mostUsedTemplate: 'modern',
				templateUsage: [
					{ templateId: 'modern', count: 456, percentage: 36.6 },
					{ templateId: 'classic', count: 321, percentage: 25.7 },
					{ templateId: 'luxury', count: 234, percentage: 18.8 },
					{ templateId: 'compact', count: 156, percentage: 12.5 },
					{ templateId: 'detailed', count: 80, percentage: 6.4 },
				],
				featureUsage: [
					{ feature: 'QR Code', count: 892, percentage: 71.5 },
					{ feature: 'Page Numbers', count: 756, percentage: 60.6 },
					{ feature: 'Watermark', count: 234, percentage: 18.8 },
					{ feature: 'Barcode', count: 156, percentage: 12.5 },
					{ feature: 'Digital Signature', count: 89, percentage: 7.1 },
				],
				generationTrend: [
					{ date: '2025-01-01', count: 45 },
					{ date: '2025-01-02', count: 52 },
					{ date: '2025-01-03', count: 38 },
					{ date: '2025-01-04', count: 61 },
					{ date: '2025-01-05', count: 47 },
					{ date: '2025-01-06', count: 55 },
					{ date: '2025-01-07', count: 42 },
				],
				fileSizeStats: {
					average: 245000,
					min: 120000,
					max: 450000,
				},
				performanceMetrics: {
					fastestGeneration: 450,
					slowestGeneration: 3200,
					errorRate: 2.3,
				},
			};
			setAnalytics(mockData);
		} catch (error) {
			console.error('Error fetching PDF analytics:', error);
		} finally {
			setLoading(false);
		}
	};

	const getFeatureIcon = (feature: string) => {
		const icons = {
			'QR Code': <QrCode className="w-4 h-4" />,
			'Barcode': <Barcode className="w-4 h-4" />,
			'Watermark': <Water className="w-4 h-4" />,
			'Digital Signature': <Signature className="w-4 h-4" />,
			'Page Numbers': <FileText className="w-4 h-4" />,
		};
		return icons[feature as keyof typeof icons] || <FileText className="w-4 h-4" />;
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const formatTime = (ms: number) => {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="text-muted-foreground mt-2">Loading analytics...</p>
				</div>
			</div>
		);
	}

	if (!analytics) {
		return (
			<div className="text-center py-8">
				<BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
				<p className="text-muted-foreground">No analytics data available</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-foreground">
						{t("pdf.analytics.title")}
					</h2>
					<p className="text-muted-foreground">
						{t("pdf.analytics.description")}
					</p>
				</div>
				<Button variant="outline" onClick={fetchAnalytics}>
					<Download className="w-4 h-4 mr-2" />
					{t("common.refresh")}
				</Button>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("pdf.analytics.totalGenerated")}
						</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalGenerated.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">
							+12% from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("pdf.analytics.totalDownloads")}
						</CardTitle>
						<Download className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalDownloads.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">
							{Math.round((analytics.totalDownloads / analytics.totalGenerated) * 100)}% download rate
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("pdf.analytics.averageGenerationTime")}
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatTime(analytics.averageGenerationTime)}</div>
						<p className="text-xs text-muted-foreground">
							-8% faster than last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t("pdf.analytics.mostUsedTemplate")}
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold capitalize">{analytics.mostUsedTemplate}</div>
						<p className="text-xs text-muted-foreground">
							Most popular template
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Template Usage */}
			<Card>
				<CardHeader>
					<CardTitle>{t("pdf.analytics.templateUsage")}</CardTitle>
					<CardDescription>
						{t("pdf.analytics.templateUsageDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{analytics.templateUsage.map((template) => (
							<div key={template.templateId} className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="capitalize">
											{template.templateId}
										</Badge>
										<span className="text-sm text-muted-foreground">
											{template.count} PDFs
										</span>
									</div>
									<span className="text-sm font-medium">
										{template.percentage}%
									</span>
								</div>
								<div className="w-full bg-muted rounded-full h-2">
									<div
										className="bg-primary h-2 rounded-full transition-all duration-300"
										style={{ width: `${template.percentage}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Feature Usage */}
			<Card>
				<CardHeader>
					<CardTitle>{t("pdf.analytics.featureUsage")}</CardTitle>
					<CardDescription>
						{t("pdf.analytics.featureUsageDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{analytics.featureUsage.map((feature) => (
							<div key={feature.feature} className="flex items-center justify-between p-3 border rounded-lg">
								<div className="flex items-center gap-3">
									{getFeatureIcon(feature.feature)}
									<div>
										<p className="font-medium">{feature.feature}</p>
										<p className="text-sm text-muted-foreground">
											{feature.count} uses
										</p>
									</div>
								</div>
								<Badge variant="secondary">
									{feature.percentage}%
								</Badge>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Performance Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Zap className="w-5 h-5" />
							{t("pdf.analytics.performance")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">Fastest Generation</span>
							<span className="font-medium">{formatTime(analytics.performanceMetrics.fastestGeneration)}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">Slowest Generation</span>
							<span className="font-medium">{formatTime(analytics.performanceMetrics.slowestGeneration)}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">Error Rate</span>
							<span className="font-medium">{analytics.performanceMetrics.errorRate}%</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="w-5 h-5" />
							{t("pdf.analytics.fileSize")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">Average Size</span>
							<span className="font-medium">{formatFileSize(analytics.fileSizeStats.average)}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">Smallest File</span>
							<span className="font-medium">{formatFileSize(analytics.fileSizeStats.min)}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">Largest File</span>
							<span className="font-medium">{formatFileSize(analytics.fileSizeStats.max)}</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
