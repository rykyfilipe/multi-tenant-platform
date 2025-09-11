/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	FileText,
	DollarSign,
	TrendingUp,
	TrendingDown,
	Calendar,
	Users,
	RefreshCw,
	Download,
	Eye,
	AlertCircle,
	CheckCircle,
	Clock,
	XCircle,
} from "lucide-react";
import { BusinessMetricsCard } from "./BusinessMetricsCard";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface InvoiceData {
	totalInvoices: number;
	totalRevenue: number;
	paidInvoices: number;
	pendingInvoices: number;
	overdueInvoices: number;
	averageInvoiceValue: number;
	monthlyRevenue: number;
	revenueGrowth: number;
	topCustomers: Array<{
		name: string;
		totalSpent: number;
		invoiceCount: number;
	}>;
	recentInvoices: Array<{
		id: number;
		number: string;
		customer: string;
		amount: number;
		status: string;
		date: string;
	}>;
	monthlyData: Array<{
		month: string;
		revenue: number;
		invoices: number;
	}>;
}

export const InvoiceAnalytics: React.FC = () => {
	const { tenant } = useApp();
	const { t } = useLanguage();
	const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
	const [loading, setLoading] = useState(true);
	const [timeRange, setTimeRange] = useState("30d");
	const [error, setError] = useState<string | null>(null);

	const fetchInvoiceData = async () => {
		if (!tenant?.id) return;

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/tenants/${tenant.id}/analytics/invoices?timeRange=${timeRange}`
			);

			if (!response.ok) {
				throw new Error("Failed to fetch invoice data");
			}

			const data = await response.json();
			setInvoiceData(data);
		} catch (err) {
			console.error("Error fetching invoice data:", err);
			setError("Failed to load invoice analytics");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchInvoiceData();
	}, [tenant?.id, timeRange]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	const getStatusIcon = (status: string) => {
		switch (status.toLowerCase()) {
			case "paid":
				return <CheckCircle className="w-4 h-4 text-green-600" />;
			case "pending":
				return <Clock className="w-4 h-4 text-yellow-600" />;
			case "overdue":
				return <AlertCircle className="w-4 h-4 text-red-600" />;
			case "cancelled":
				return <XCircle className="w-4 h-4 text-gray-600" />;
			default:
				return <Clock className="w-4 h-4 text-gray-600" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "paid":
				return "bg-green-100 text-green-800 border-green-200";
			case "pending":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "overdue":
				return "bg-red-100 text-red-800 border-red-200";
			case "cancelled":
				return "bg-gray-100 text-gray-800 border-gray-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold text-foreground">Invoice Analytics</h2>
					<div className="flex items-center gap-2">
						<Select value={timeRange} onValueChange={setTimeRange}>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="7d">Last 7 days</SelectItem>
								<SelectItem value="30d">Last 30 days</SelectItem>
								<SelectItem value="90d">Last 90 days</SelectItem>
								<SelectItem value="1y">Last year</SelectItem>
							</SelectContent>
						</Select>
						<Button
							variant="outline"
							size="sm"
							onClick={fetchInvoiceData}
							disabled={loading}>
							<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold text-foreground">Invoice Analytics</h2>
				</div>
				<Card>
					<CardContent className="flex items-center justify-center h-32">
						<div className="text-center">
							<AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
							<p className="text-red-600">{error}</p>
							<Button
								variant="outline"
								size="sm"
								onClick={fetchInvoiceData}
								className="mt-2">
								Try Again
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!invoiceData) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold text-foreground">Invoice Analytics</h2>
				</div>
				<Card>
					<CardContent className="flex items-center justify-center h-32">
						<p className="text-muted-foreground">No invoice data available</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-foreground">Invoice Analytics</h2>
				<div className="flex items-center gap-2">
					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">Last 7 days</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="90d">Last 90 days</SelectItem>
							<SelectItem value="1y">Last year</SelectItem>
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						size="sm"
						onClick={fetchInvoiceData}
						disabled={loading}>
						<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
					</Button>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<BusinessMetricsCard
					title="Total Revenue"
					value={invoiceData.totalRevenue}
					icon={DollarSign}
					change={invoiceData.revenueGrowth}
					changeType={invoiceData.revenueGrowth >= 0 ? "increase" : "decrease"}
					color="green"
					unit=""
					description="Total revenue from all invoices"
				/>
				<BusinessMetricsCard
					title="Total Invoices"
					value={invoiceData.totalInvoices}
					icon={FileText}
					change={12}
					changeType="increase"
					color="blue"
					unit="invoices"
					description="Total number of invoices"
				/>
				<BusinessMetricsCard
					title="Average Value"
					value={invoiceData.averageInvoiceValue}
					icon={TrendingUp}
					change={8}
					changeType="increase"
					color="purple"
					unit=""
					description="Average invoice value"
				/>
				<BusinessMetricsCard
					title="Paid Invoices"
					value={invoiceData.paidInvoices}
					icon={CheckCircle}
					change={15}
					changeType="increase"
					color="green"
					unit="invoices"
					description="Successfully paid invoices"
				/>
			</div>

			{/* Status Overview */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="w-5 h-5 text-yellow-600" />
							Pending Invoices
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-yellow-600">
							{invoiceData.pendingInvoices}
						</div>
						<p className="text-sm text-muted-foreground">
							Awaiting payment
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-red-600" />
							Overdue Invoices
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-red-600">
							{invoiceData.overdueInvoices}
						</div>
						<p className="text-sm text-muted-foreground">
							Past due date
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="w-5 h-5 text-blue-600" />
							Monthly Revenue
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-blue-600">
							{formatCurrency(invoiceData.monthlyRevenue)}
						</div>
						<p className="text-sm text-muted-foreground">
							This month
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Top Customers and Recent Invoices */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Top Customers */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="w-5 h-5" />
							Top Customers
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{invoiceData.topCustomers.map((customer, index) => (
								<div
									key={customer.name}
									className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
											<span className="text-sm font-semibold text-blue-600">
												{index + 1}
											</span>
										</div>
										<div>
											<p className="font-medium">{customer.name}</p>
											<p className="text-sm text-muted-foreground">
												{customer.invoiceCount} invoices
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="font-semibold">
											{formatCurrency(customer.totalSpent)}
										</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Recent Invoices */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="w-5 h-5" />
							Recent Invoices
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{invoiceData.recentInvoices.map((invoice) => (
								<div
									key={invoice.id}
									className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div className="flex items-center gap-3">
										{getStatusIcon(invoice.status)}
										<div>
											<p className="font-medium">#{invoice.number}</p>
											<p className="text-sm text-muted-foreground">
												{invoice.customer}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="font-semibold">
											{formatCurrency(invoice.amount)}
										</p>
										<Badge
											variant="outline"
											className={`text-xs ${getStatusColor(invoice.status)}`}>
											{invoice.status}
										</Badge>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
