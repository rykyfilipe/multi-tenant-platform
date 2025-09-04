/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	CreditCard,
	Receipt,
	TrendingUp,
	AlertTriangle,
	CheckCircle,
	Clock,
	Download,
	Eye,
	RefreshCw,
	BarChart3,
	DollarSign,
	Calendar,
	Users,
	Database,
	HardDrive,
	Settings,
	ArrowUpRight,
	ArrowDownRight,
	Info,
} from "lucide-react";
import { format } from "date-fns";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useSubscription } from "@/hooks/useSubscription";
import { getPlanFeatures, formatPrice } from "@/lib/planConstants";
import BillingHistory from "../subscription/BillingHistory";
import SubscriptionManager from "../subscription/SubscriptionManager";

interface BillingDashboardProps {
	tenantId: string;
}

interface UsageMetrics {
	databases: number;
	tables: number;
	users: number;
	rows: number;
	storage: number;
}

interface BillingMetrics {
	totalSpent: number;
	monthlyRecurringRevenue: number;
	averageInvoiceValue: number;
	paymentSuccessRate: number;
	churnRate: number;
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({ tenantId }) => {
	const { user, showAlert } = useApp();
	const { t } = useLanguage();
	const { subscription, loading: subscriptionLoading } = useSubscription();
	const { currentCounts, planLimits, getUsagePercentage } = usePlanLimits();
	
	const [billingMetrics, setBillingMetrics] = useState<BillingMetrics | null>(null);
	const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const currentPlan = subscription?.subscriptionPlan || "Free";
	const isActive = subscription?.subscriptionStatus === "active";
	const planFeatures = getPlanFeatures(currentPlan);

	useEffect(() => {
		fetchBillingData();
	}, [tenantId]);

	const fetchBillingData = async () => {
		setLoading(true);
		try {
			// Fetch billing metrics
			const metricsResponse = await fetch(`/api/tenants/${tenantId}/billing/metrics`);
			if (metricsResponse.ok) {
				const metrics = await metricsResponse.json();
				setBillingMetrics(metrics);
			}

			// Fetch usage metrics
			const usageResponse = await fetch(`/api/tenants/${tenantId}/usage/metrics`);
			if (usageResponse.ok) {
				const usage = await usageResponse.json();
				setUsageMetrics(usage);
			}
		} catch (error) {
			console.error("Error fetching billing data:", error);
			showAlert("Failed to load billing data", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await fetchBillingData();
		setRefreshing(false);
	};

	const getStatusColor = (status: string | null) => {
		switch (status) {
			case "active":
				return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800/30";
			case "canceled":
				return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800/30";
			case "past_due":
				return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800/30";
			case "unpaid":
				return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800/30";
			default:
				return "bg-muted text-muted-foreground border-border";
		}
	};

	const getStatusText = (status: string | null) => {
		switch (status) {
			case "active":
				return "Active";
			case "canceled":
				return "Canceled";
			case "past_due":
				return "Past Due";
			case "unpaid":
				return "Unpaid";
			default:
				return "No Subscription";
		}
	};

	const getStatusIcon = (status: string | null) => {
		switch (status) {
			case "active":
				return <CheckCircle className="w-4 h-4" />;
			case "canceled":
				return <AlertTriangle className="w-4 h-4" />;
			case "past_due":
				return <Clock className="w-4 h-4" />;
			case "unpaid":
				return <AlertTriangle className="w-4 h-4" />;
			default:
				return <Info className="w-4 h-4" />;
		}
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Billing Dashboard</h1>
						<p className="text-muted-foreground">Manage your subscription and billing</p>
					</div>
					<Button disabled>
						<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
						Loading...
					</Button>
				</div>
				<div className="grid gap-6">
					<Card>
						<CardContent className="p-6">
							<div className="animate-pulse space-y-4">
								<div className="h-4 bg-muted rounded w-1/4"></div>
								<div className="h-8 bg-muted rounded w-1/2"></div>
								<div className="h-4 bg-muted rounded w-3/4"></div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Billing Dashboard</h1>
					<p className="text-muted-foreground">Manage your subscription and billing</p>
				</div>
				<Button onClick={handleRefresh} disabled={refreshing}>
					<RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
					Refresh
				</Button>
			</div>

			{/* Current Plan Status */}
			<Card className="border-border/20 bg-card/50 backdrop-blur-sm">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<CreditCard className="w-5 h-5" />
								Current Plan
							</CardTitle>
							<CardDescription>
								Your current subscription and billing information
							</CardDescription>
						</div>
						<Badge className={getStatusColor(subscription?.subscriptionStatus)}>
							{getStatusIcon(subscription?.subscriptionStatus)}
							<span className="ml-1">{getStatusText(subscription?.subscriptionStatus)}</span>
						</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="space-y-2">
							<h4 className="font-medium">Plan Details</h4>
							<div className="space-y-1">
								<div className="flex justify-between">
									<span className="text-sm text-muted-foreground">Plan:</span>
									<span className="font-medium">{currentPlan}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-muted-foreground">Price:</span>
									<span className="font-medium">{planFeatures.price}</span>
								</div>
								{subscription?.subscriptionCurrentPeriodEnd && (
									<div className="flex justify-between">
										<span className="text-sm text-muted-foreground">Next billing:</span>
										<span className="font-medium">
											{format(new Date(subscription.subscriptionCurrentPeriodEnd), "MMM dd, yyyy")}
										</span>
									</div>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<h4 className="font-medium">Plan Features</h4>
							<div className="space-y-1 text-sm">
								<div className="flex items-center gap-2">
									<Database className="w-4 h-4 text-primary" />
									<span>{planFeatures.databases} Databases</span>
								</div>
								<div className="flex items-center gap-2">
									<BarChart3 className="w-4 h-4 text-primary" />
									<span>{planFeatures.tables} Tables</span>
								</div>
								<div className="flex items-center gap-2">
									<Users className="w-4 h-4 text-primary" />
									<span>{planFeatures.users} Users</span>
								</div>
								<div className="flex items-center gap-2">
									<HardDrive className="w-4 h-4 text-primary" />
									<span>{planFeatures.storage} Storage</span>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<h4 className="font-medium">Quick Actions</h4>
							<div className="space-y-2">
								<Button variant="outline" size="sm" className="w-full">
									<Settings className="w-4 h-4 mr-2" />
									Manage Billing
								</Button>
								<Button variant="outline" size="sm" className="w-full">
									<ArrowUpRight className="w-4 h-4 mr-2" />
									Upgrade Plan
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Usage Overview */}
			<Card className="border-border/20 bg-card/50 backdrop-blur-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="w-5 h-5" />
						Usage Overview
					</CardTitle>
					<CardDescription>
						Monitor your current usage against plan limits
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-muted-foreground">
									Databases
								</span>
								<span className="text-sm text-foreground">
									{currentCounts?.databases || 0}/{planLimits.databases}
								</span>
							</div>
							<Progress value={getUsagePercentage('databases')} className="h-2" />
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-muted-foreground">
									Tables
								</span>
								<span className="text-sm text-foreground">
									{currentCounts?.tables || 0}/{planLimits.tables}
								</span>
							</div>
							<Progress value={getUsagePercentage('tables')} className="h-2" />
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-muted-foreground">
									Users
								</span>
								<span className="text-sm text-foreground">
									{currentCounts?.users || 0}/{planLimits.users}
								</span>
							</div>
							<Progress value={getUsagePercentage('users')} className="h-2" />
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-muted-foreground">
									Storage
								</span>
								<span className="text-sm text-foreground">
									{currentCounts?.storage || 0}MB/{planLimits.storage}MB
								</span>
							</div>
							<Progress value={getUsagePercentage('storage')} className="h-2" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Billing Metrics */}
			{billingMetrics && (
				<Card className="border-border/20 bg-card/50 backdrop-blur-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<DollarSign className="w-5 h-5" />
							Billing Metrics
						</CardTitle>
						<CardDescription>
							Key financial metrics for your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<div className="space-y-2">
								<div className="text-2xl font-bold">
									{formatPrice(billingMetrics.totalSpent)}
								</div>
								<div className="text-sm text-muted-foreground">Total Spent</div>
							</div>
							<div className="space-y-2">
								<div className="text-2xl font-bold">
									{formatPrice(billingMetrics.monthlyRecurringRevenue)}
								</div>
								<div className="text-sm text-muted-foreground">Monthly Revenue</div>
							</div>
							<div className="space-y-2">
								<div className="text-2xl font-bold">
									{formatPrice(billingMetrics.averageInvoiceValue)}
								</div>
								<div className="text-sm text-muted-foreground">Avg Invoice Value</div>
							</div>
							<div className="space-y-2">
								<div className="text-2xl font-bold">
									{billingMetrics.paymentSuccessRate.toFixed(1)}%
								</div>
								<div className="text-sm text-muted-foreground">Payment Success Rate</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Detailed Management */}
			<Tabs defaultValue="subscription" className="space-y-6">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="subscription">Subscription Management</TabsTrigger>
					<TabsTrigger value="billing">Billing History</TabsTrigger>
				</TabsList>

				<TabsContent value="subscription">
					<SubscriptionManager
						subscription={subscription || {
							stripeCustomerId: null,
							stripeSubscriptionId: null,
							subscriptionStatus: null,
							subscriptionPlan: null,
							subscriptionCurrentPeriodEnd: null,
						}}
						onRefresh={handleRefresh}
						isLoading={subscriptionLoading}
					/>
				</TabsContent>

				<TabsContent value="billing">
					<BillingHistory customerId={subscription?.stripeCustomerId || null} />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default BillingDashboard;
