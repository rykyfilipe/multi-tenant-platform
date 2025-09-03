/** @format */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
	Check, 
	X, 
	Star, 
	Zap, 
	Shield, 
	Users, 
	Database, 
	HardDrive,
	TrendingUp,
	Calendar,
	Percent
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPlanComparison, formatPrice } from "@/lib/planConstants";

interface PricingPlansProps {
	onSelectPlan?: (plan: string, billing: "monthly" | "annual") => void;
	currentPlan?: string;
	showUpgrade?: boolean;
}

/**
 * Pricing Plans Component
 * Displays all available plans with annual discount options
 */
export function PricingPlans({ 
	onSelectPlan, 
	currentPlan = "Free",
	showUpgrade = true 
}: PricingPlansProps) {
	const { t } = useLanguage();
	const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

	const plans = getPlanComparison();

	const handlePlanSelect = (planName: string) => {
		setSelectedPlan(planName);
		if (onSelectPlan) {
			onSelectPlan(planName, billingCycle);
		}
	};

	const getPlanIcon = (planName: string) => {
		switch (planName) {
			case "Free": return <Zap className="h-6 w-6" />;
			case "Starter": return <Star className="h-6 w-6" />;
			case "Pro": return <Shield className="h-6 w-6" />;
			case "Enterprise": return <TrendingUp className="h-6 w-6" />;
			default: return <Database className="h-6 w-6" />;
		}
	};

	const getPlanColor = (planName: string) => {
		switch (planName) {
			case "Free": return "border-gray-200";
			case "Starter": return "border-blue-200 bg-blue-50/50";
			case "Pro": return "border-purple-200 bg-purple-50/50";
			case "Enterprise": return "border-gold-200 bg-gold-50/50";
			default: return "border-gray-200";
		}
	};

	const getPriceDisplay = (plan: any) => {
		if (plan.name === "Free") {
			return plan.price;
		}

		if (billingCycle === "annual") {
			return (
				<div className="text-center">
					<div className="text-3xl font-bold text-primary">
						{formatPrice(plan.annualPrice)}
					</div>
					<div className="text-sm text-muted-foreground">
						per year
					</div>
					<div className="flex items-center justify-center gap-1 mt-1">
						<Badge variant="secondary" className="text-xs">
							<Percent className="h-3 w-3 mr-1" />
							{plan.annualDiscount}% off
						</Badge>
					</div>
				</div>
			);
		} else {
			return (
				<div className="text-center">
					<div className="text-3xl font-bold text-primary">
						{formatPrice(plan.monthlyPrice)}
					</div>
					<div className="text-sm text-muted-foreground">
						per month
					</div>
				</div>
			);
		}
	};

	const getSavingsDisplay = (plan: any) => {
		if (plan.name === "Free" || billingCycle === "monthly") {
			return null;
		}

		const monthlyTotal = plan.monthlyPrice * 12;
		const savings = monthlyTotal - plan.annualPrice;
		
		return (
			<div className="text-center">
				<div className="text-sm text-green-600 font-medium">
					Save {formatPrice(savings)} per year
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center space-y-4">
				<h2 className="text-3xl font-bold">Choose Your Plan</h2>
				<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
					Start free and scale as you grow. All plans include core features with annual billing discounts.
				</p>

				{/* Billing Toggle */}
				<div className="flex items-center justify-center gap-4">
					<span className={`text-sm ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
						Monthly
					</span>
					<Switch
						checked={billingCycle === "annual"}
						onCheckedChange={(checked) => setBillingCycle(checked ? "annual" : "monthly")}
					/>
					<span className={`text-sm ${billingCycle === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
						Annual
					</span>
					{billingCycle === "annual" && (
						<Badge variant="secondary" className="ml-2">
							<Calendar className="h-3 w-3 mr-1" />
							Save 17%
						</Badge>
					)}
				</div>
			</div>

			{/* Plans Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{plans.map((plan) => (
					<Card 
						key={plan.name} 
						className={`relative transition-all duration-200 hover:shadow-lg ${
							plan.popular ? "ring-2 ring-primary shadow-lg" : ""
						} ${getPlanColor(plan.name)} ${
							selectedPlan === plan.name ? "ring-2 ring-primary" : ""
						}`}
					>
						{plan.popular && (
							<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
								<Badge className="bg-primary text-primary-foreground">
									<Star className="h-3 w-3 mr-1" />
									Most Popular
								</Badge>
							</div>
						)}

						<CardHeader className="text-center pb-4">
							<div className="flex justify-center mb-2">
								{getPlanIcon(plan.name)}
							</div>
							<CardTitle className="text-xl">{plan.name}</CardTitle>
							<CardDescription>
								{plan.name === "Free" && "Perfect for getting started"}
								{plan.name === "Starter" && "Great for small teams"}
								{plan.name === "Pro" && "Ideal for growing businesses"}
								{plan.name === "Enterprise" && "For large organizations"}
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-6">
							{/* Pricing */}
							<div>
								{getPriceDisplay(plan)}
								{getSavingsDisplay(plan)}
							</div>

							{/* Features */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Database className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">
										{plan.databases} {typeof plan.databases === "number" ? "databases" : "databases"}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<HardDrive className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">
										{plan.tables} {typeof plan.tables === "number" ? "tables" : "tables"}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">
										{plan.users} {typeof plan.users === "number" ? "users" : "users"}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<HardDrive className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">{plan.storage}</span>
								</div>
								<div className="flex items-center gap-2">
									<TrendingUp className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">{plan.rows}</span>
								</div>
							</div>

							{/* Key Features */}
							<div className="space-y-2">
								{plan.name === "Free" && (
									<>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											Basic analytics
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											Data import/export
										</div>
										<div className="flex items-center gap-2 text-sm">
											<X className="h-4 w-4 text-red-500" />
											Advanced features
										</div>
									</>
								)}
								{plan.name === "Starter" && (
									<>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											All Free features
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											Multiple databases
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											Team collaboration
										</div>
									</>
								)}
								{plan.name === "Pro" && (
									<>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											All Starter features
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											Advanced analytics
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											Custom integrations
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											Priority support
										</div>
									</>
								)}
								{plan.name === "Enterprise" && (
									<>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											All Pro features
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											Unlimited everything
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											Dedicated support
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-green-600" />
											Advanced security
										</div>
									</>
								)}
							</div>

							{/* Action Button */}
							<div className="pt-4">
								{plan.name === currentPlan ? (
									<Button 
										variant="outline" 
										className="w-full" 
										disabled
									>
										Current Plan
									</Button>
								) : (
									<Button 
										className="w-full"
										variant={plan.popular ? "default" : "outline"}
										onClick={() => handlePlanSelect(plan.name)}
									>
										{plan.name === "Free" ? "Get Started" : 
										 plan.name === "Enterprise" ? "Contact Sales" : 
										 "Upgrade"}
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Additional Info */}
			<div className="text-center space-y-4">
				<p className="text-sm text-muted-foreground">
					All plans include 24/7 support, data backup, and security features.
				</p>
				<div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
					<div className="flex items-center gap-1">
						<Shield className="h-4 w-4" />
						<span>Secure & Compliant</span>
					</div>
					<div className="flex items-center gap-1">
						<Calendar className="h-4 w-4" />
						<span>Cancel Anytime</span>
					</div>
					<div className="flex items-center gap-1">
						<Users className="h-4 w-4" />
						<span>Team Collaboration</span>
					</div>
				</div>
			</div>
		</div>
	);
}
