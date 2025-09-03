/** @format */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
	ArrowUp, 
	Check, 
	AlertTriangle, 
	TrendingUp,
	Database,
	Users,
	HardDrive,
	Zap,
	Calendar,
	Percent
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPlanComparison, formatPrice, getPlanLimits } from "@/lib/planConstants";

interface PlanUpgradeProps {
	currentPlan: string;
	currentUsage: {
		databases: number;
		tables: number;
		users: number;
		storage: number; // in MB
		rows: number;
	};
	onUpgrade?: (plan: string, billing: "monthly" | "annual") => void;
}

/**
 * Plan Upgrade Component
 * Shows current usage vs limits and suggests upgrades
 */
export function PlanUpgrade({ 
	currentPlan, 
	currentUsage, 
	onUpgrade 
}: PlanUpgradeProps) {
	const { t } = useLanguage();
	const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

	const plans = getPlanComparison();
	const currentPlanData = plans.find(p => p.name === currentPlan);
	const currentLimits = getPlanLimits(currentPlan);

	// Calculate usage percentages
	const getUsagePercentage = (current: number, limit: number) => {
		if (limit === -1) return 0; // Unlimited
		return Math.min((current / limit) * 100, 100);
	};

	const usagePercentages = {
		databases: getUsagePercentage(currentUsage.databases, currentLimits.databases),
		tables: getUsagePercentage(currentUsage.tables, currentLimits.tables),
		users: getUsagePercentage(currentUsage.users, currentLimits.users),
		storage: getUsagePercentage(currentUsage.storage, currentLimits.storage),
		rows: getUsagePercentage(currentUsage.rows, currentLimits.rows),
	};

	// Find plans that would resolve current limitations
	const getRecommendedPlans = () => {
		return plans.filter(plan => {
			if (plan.name === currentPlan) return false;
			
			const planLimits = plan.limits;
			return (
				(currentLimits.databases !== -1 && planLimits.databases > currentLimits.databases) ||
				(currentLimits.tables !== -1 && planLimits.tables > currentLimits.tables) ||
				(currentLimits.users !== -1 && planLimits.users > currentLimits.users) ||
				(currentLimits.storage !== -1 && planLimits.storage > currentLimits.storage) ||
				(currentLimits.rows !== -1 && planLimits.rows > currentLimits.rows)
			);
		});
	};

	const recommendedPlans = getRecommendedPlans();

	const getUsageColor = (percentage: number) => {
		if (percentage >= 90) return "text-red-600";
		if (percentage >= 75) return "text-yellow-600";
		return "text-green-600";
	};

	const getProgressColor = (percentage: number) => {
		if (percentage >= 90) return "bg-red-500";
		if (percentage >= 75) return "bg-yellow-500";
		return "bg-green-500";
	};

	const formatStorage = (mb: number) => {
		if (mb >= 1024) {
			return `${(mb / 1024).toFixed(1)} GB`;
		}
		return `${mb} MB`;
	};

	const handleUpgrade = (planName: string) => {
		setSelectedPlan(planName);
		if (onUpgrade) {
			onUpgrade(planName, billingCycle);
		}
	};

	return (
		<div className="space-y-6">
			{/* Current Plan Status */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Current Plan: {currentPlan}
					</CardTitle>
					<CardDescription>
						Monitor your usage and upgrade when needed
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Usage Overview */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Database className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Databases</span>
							</div>
							<div className="space-y-1">
								<div className="flex justify-between text-sm">
									<span>{currentUsage.databases}</span>
									<span className={getUsageColor(usagePercentages.databases)}>
										{currentLimits.databases === -1 ? "∞" : `/ ${currentLimits.databases}`}
									</span>
								</div>
								<Progress 
									value={usagePercentages.databases} 
									className="h-2"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<HardDrive className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Tables</span>
							</div>
							<div className="space-y-1">
								<div className="flex justify-between text-sm">
									<span>{currentUsage.tables}</span>
									<span className={getUsageColor(usagePercentages.tables)}>
										{currentLimits.tables === -1 ? "∞" : `/ ${currentLimits.tables}`}
									</span>
								</div>
								<Progress 
									value={usagePercentages.tables} 
									className="h-2"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Users</span>
							</div>
							<div className="space-y-1">
								<div className="flex justify-between text-sm">
									<span>{currentUsage.users}</span>
									<span className={getUsageColor(usagePercentages.users)}>
										{currentLimits.users === -1 ? "∞" : `/ ${currentLimits.users}`}
									</span>
								</div>
								<Progress 
									value={usagePercentages.users} 
									className="h-2"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<HardDrive className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Storage</span>
							</div>
							<div className="space-y-1">
								<div className="flex justify-between text-sm">
									<span>{formatStorage(currentUsage.storage)}</span>
									<span className={getUsageColor(usagePercentages.storage)}>
										{currentLimits.storage === -1 ? "∞" : `/ ${formatStorage(currentLimits.storage)}`}
									</span>
								</div>
								<Progress 
									value={usagePercentages.storage} 
									className="h-2"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Zap className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Rows</span>
							</div>
							<div className="space-y-1">
								<div className="flex justify-between text-sm">
									<span>{currentUsage.rows.toLocaleString()}</span>
									<span className={getUsageColor(usagePercentages.rows)}>
										{currentLimits.rows === -1 ? "∞" : `/ ${currentLimits.rows.toLocaleString()}`}
									</span>
								</div>
								<Progress 
									value={usagePercentages.rows} 
									className="h-2"
								/>
							</div>
						</div>
					</div>

					{/* Warnings */}
					{Object.values(usagePercentages).some(p => p >= 90) && (
						<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
							<div className="flex items-center gap-2 text-red-800">
								<AlertTriangle className="h-4 w-4" />
								<span className="font-medium">Usage Limit Warning</span>
							</div>
							<p className="text-sm text-red-700 mt-1">
								You're approaching or have reached your plan limits. Consider upgrading to avoid service interruptions.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Recommended Upgrades */}
			{recommendedPlans.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ArrowUp className="h-5 w-5" />
							Recommended Upgrades
						</CardTitle>
						<CardDescription>
							These plans will resolve your current limitations
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Billing Toggle */}
						<div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
							<span className={`text-sm ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
								Monthly
							</span>
							<div className="relative">
								<input
									type="checkbox"
									checked={billingCycle === "annual"}
									onChange={(e) => setBillingCycle(e.target.checked ? "annual" : "monthly")}
									className="sr-only"
								/>
								<div className={`w-12 h-6 rounded-full transition-colors ${
									billingCycle === "annual" ? "bg-primary" : "bg-muted-foreground/20"
								}`}>
									<div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
										billingCycle === "annual" ? "translate-x-6" : "translate-x-0.5"
									} mt-0.5`} />
								</div>
							</div>
							<span className={`text-sm ${billingCycle === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
								Annual
							</span>
							{billingCycle === "annual" && (
								<Badge variant="secondary" className="ml-2">
									<Percent className="h-3 w-3 mr-1" />
									Save 17%
								</Badge>
							)}
						</div>

						{/* Upgrade Options */}
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{recommendedPlans.map((plan) => (
								<Card 
									key={plan.name} 
									className={`relative transition-all duration-200 hover:shadow-md ${
										plan.popular ? "ring-2 ring-primary" : ""
									} ${selectedPlan === plan.name ? "ring-2 ring-primary" : ""}`}
								>
									{plan.popular && (
										<div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
											<Badge className="bg-primary text-primary-foreground text-xs">
												Most Popular
											</Badge>
										</div>
									)}

									<CardHeader className="pb-3">
										<CardTitle className="text-lg">{plan.name}</CardTitle>
										<div className="text-2xl font-bold text-primary">
											{billingCycle === "annual" ? formatPrice(plan.annualPrice) : formatPrice(plan.monthlyPrice)}
											<span className="text-sm font-normal text-muted-foreground">
												/{billingCycle === "annual" ? "year" : "month"}
											</span>
										</div>
										{billingCycle === "annual" && (
											<div className="text-sm text-green-600">
												Save {formatPrice(plan.monthlyPrice * 12 - plan.annualPrice)} per year
											</div>
										)}
									</CardHeader>

									<CardContent className="space-y-4">
										{/* Key Benefits */}
										<div className="space-y-2">
											{plan.limits.databases > currentLimits.databases && (
												<div className="flex items-center gap-2 text-sm">
													<Check className="h-4 w-4 text-green-600" />
													<span>
														{plan.limits.databases === -1 ? "Unlimited" : plan.limits.databases} databases
													</span>
												</div>
											)}
											{plan.limits.tables > currentLimits.tables && (
												<div className="flex items-center gap-2 text-sm">
													<Check className="h-4 w-4 text-green-600" />
													<span>
														{plan.limits.tables === -1 ? "Unlimited" : plan.limits.tables} tables
													</span>
												</div>
											)}
											{plan.limits.users > currentLimits.users && (
												<div className="flex items-center gap-2 text-sm">
													<Check className="h-4 w-4 text-green-600" />
													<span>
														{plan.limits.users === -1 ? "Unlimited" : plan.limits.users} users
													</span>
												</div>
											)}
											{plan.limits.storage > currentLimits.storage && (
												<div className="flex items-center gap-2 text-sm">
													<Check className="h-4 w-4 text-green-600" />
													<span>
														{plan.limits.storage === -1 ? "Unlimited" : formatStorage(plan.limits.storage)} storage
													</span>
												</div>
											)}
											{plan.limits.rows > currentLimits.rows && (
												<div className="flex items-center gap-2 text-sm">
													<Check className="h-4 w-4 text-green-600" />
													<span>
														{plan.limits.rows === -1 ? "Unlimited" : plan.limits.rows.toLocaleString()} rows
													</span>
												</div>
											)}
										</div>

										<Button 
											className="w-full"
											variant={plan.popular ? "default" : "outline"}
											onClick={() => handleUpgrade(plan.name)}
										>
											Upgrade to {plan.name}
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
