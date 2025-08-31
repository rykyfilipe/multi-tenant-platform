/** @format */

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Calendar,
	CreditCard,
	Settings,
	AlertCircle,
	X,
	Check,
	Zap,
	Shield,
	Database,
	Users,
	Table,
	ArrowUpRight,
	ArrowDownRight,
	RefreshCw,
	Info,
	BarChart3,
	Loader2,
	HardDrive,
} from "lucide-react";
import { format } from "date-fns";
import { useApp } from "@/contexts/AppContext";
import BillingHistory from "./BillingHistory";
import { getPlanFeatures } from "@/lib/planConstants";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubscriptionData {
	stripeCustomerId: string | null;
	stripeSubscriptionId: string | null;
	subscriptionStatus: string | null;
	subscriptionPlan: string | null;
	subscriptionCurrentPeriodEnd: Date | null;
}

interface SubscriptionManagerProps {
	subscription: SubscriptionData;
	onRefresh: () => void;
	isLoading?: boolean;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
	subscription,
	onRefresh,
	isLoading = false,
}) => {
	const { data: session } = useSession();
	const { showAlert, user } = useApp();
	const { t } = useLanguage();
	const [isActionLoading, setIsActionLoading] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
	const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
	const [showPortalDialog, setShowPortalDialog] = useState(false);

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
				return t("subscription.status.active");
			case "canceled":
				return t("subscription.status.canceled");
			case "past_due":
				return t("subscription.status.pastDue");
			case "unpaid":
				return t("subscription.status.unpaid");
			default:
				return t("subscription.status.noSubscription");
		}
	};

	const getPlanFeaturesLocal = (plan: string | null) => {
		return getPlanFeatures(plan);
	};

	const handleManageSubscription = async () => {
		if (!subscription.stripeCustomerId) {
			showAlert(t("subscription.noSubscriptionFound"), "error");
			return;
		}

		setIsActionLoading(true);
		try {
			const response = await fetch("/api/stripe/create-portal-session", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					customerId: subscription.stripeCustomerId,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				if (data.error && data.error.includes("not configured")) {
					showAlert(t("subscription.portalNotConfigured"), "error");
					return;
				}
				throw new Error(data.error || t("subscription.failedToCreatePortal"));
			}

			const { url } = data;
			window.location.href = url;
		} catch (error) {
			console.error("Error creating portal session:", error);
			showAlert(t("subscription.failedToOpenManagement"), "error");
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleCancelSubscription = async () => {
		if (!subscription.stripeSubscriptionId) {
			showAlert(t("subscription.noSubscriptionFound"), "error");
			return;
		}

		setIsActionLoading(true);
		try {
			const response = await fetch("/api/stripe/cancel-subscription", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					subscriptionId: subscription.stripeSubscriptionId,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || t("subscription.failedToCancel"));
			}

			showAlert(t("subscription.canceledSuccessfully"), "success");
			setShowCancelDialog(false);
			onRefresh();
		} catch (error) {
			console.error("Error canceling subscription:", error);
			showAlert(t("subscription.failedToCancel"), "error");
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleUpgradePlan = () => {
		window.location.href = "/?upgrade=true";
	};

	const handleDowngradePlan = async () => {
		if (!user) return;

		setIsActionLoading(true);

		try {
			const response = await fetch("/api/stripe/downgrade-to-free", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || t("subscription.failedToDowngrade"));
			}

			// Close dialog
			setShowDowngradeDialog(false);

			// Show success message
			showAlert(t("subscription.downgradeSuccess"), "success");

			// Refresh the component to reflect changes
			onRefresh();
		} catch (error: any) {
			console.error("Downgrade error:", error);
			showAlert(error.message || t("subscription.downgradeError"), "error");
		} finally {
			setIsActionLoading(false);
		}
	};

	const planFeatures = getPlanFeaturesLocal(subscription.subscriptionPlan);
	const isActive = subscription.subscriptionStatus === "active";
	const isCanceled = subscription.subscriptionStatus === "canceled";
	const isAdmin = user?.role === "ADMIN";

	// Show loading skeleton if data is loading
	if (isLoading) {
		return (
			<div className='space-y-6'>
				<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<div className='space-y-2'>
								<Skeleton className='h-6 w-48' />
								<Skeleton className='h-4 w-64' />
							</div>
							<Skeleton className='h-6 w-20' />
						</div>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div className='space-y-4'>
								<div className='space-y-2'>
									<Skeleton className='h-4 w-16' />
									<Skeleton className='h-5 w-24' />
								</div>
								<div className='space-y-2'>
									<Skeleton className='h-4 w-16' />
									<Skeleton className='h-5 w-20' />
								</div>
								<div className='space-y-2'>
									<Skeleton className='h-4 w-24' />
									<Skeleton className='h-5 w-32' />
								</div>
							</div>
							<div className='space-y-3'>
								<Skeleton className='h-4 w-24' />
								<div className='space-y-2'>
									<Skeleton className='h-4 w-32' />
									<Skeleton className='h-4 w-28' />
									<Skeleton className='h-4 w-24' />
									<Skeleton className='h-4 w-30' />
								</div>
							</div>
						</div>
						<Separator />
						<div className='flex flex-col sm:flex-row gap-3'>
							<Skeleton className='h-10 flex-1' />
							<Skeleton className='h-10 flex-1' />
							<Skeleton className='h-10 flex-1' />
						</div>
					</CardContent>
				</Card>

				<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
					<CardHeader>
						<div className='space-y-2'>
							<Skeleton className='h-6 w-40' />
							<Skeleton className='h-4 w-64' />
						</div>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							<div className='space-y-3'>
								<Skeleton className='h-4 w-20' />
								<Skeleton className='h-2 w-full' />
							</div>
							<div className='space-y-3'>
								<Skeleton className='h-4 w-16' />
								<Skeleton className='h-2 w-full' />
							</div>
							<div className='space-y-3'>
								<Skeleton className='h-4 w-12' />
								<Skeleton className='h-2 w-full' />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!subscription.subscriptionStatus) {
		return (
			<div className='space-y-6'>
				<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<CreditCard className='w-5 h-5' />
							No Active Subscription
						</CardTitle>
						<CardDescription>
							Subscribe to unlock all features and start building your databases
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='text-center py-8'>
							<AlertCircle className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
							<p className='text-muted-foreground mb-6 max-w-md mx-auto'>
								Get started with our Free plan and unlock powerful database
								management features.
							</p>
							<Button onClick={() => (window.location.href = "/")} size='lg'>
								<Zap className='w-4 h-4 mr-2' />
								View Plans
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Current Subscription Status */}
			<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='flex items-center gap-2'>
								<CreditCard className='w-5 h-5' />
								Current Subscription
							</CardTitle>
							<CardDescription>
								Manage your subscription and billing information
							</CardDescription>
						</div>
						<Badge className={getStatusColor(subscription.subscriptionStatus)}>
							{getStatusText(subscription.subscriptionStatus)}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Plan Details */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='space-y-4'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-muted-foreground'>
									Plan
								</span>
								<span className='font-semibold text-foreground'>
									{subscription.subscriptionPlan}
								</span>
							</div>

							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-muted-foreground'>
									Price
								</span>
								<span className='font-semibold text-foreground'>
									{planFeatures.price}
								</span>
							</div>

							{subscription.subscriptionCurrentPeriodEnd && (
								<div className='flex items-center justify-between'>
									<span className='text-sm font-medium text-muted-foreground'>
										Next billing
									</span>
									<div className='flex items-center gap-1'>
										<Calendar className='w-4 h-4 text-muted-foreground' />
										<span className='text-sm text-foreground'>
											{format(
												new Date(subscription.subscriptionCurrentPeriodEnd),
												"MMM dd, yyyy",
											)}
										</span>
									</div>
								</div>
							)}
						</div>

						{/* Plan Features */}
						<div className='space-y-3'>
							<h4 className='text-sm font-medium text-muted-foreground'>
								Plan Features
							</h4>
							<div className='space-y-2'>
								<div className='flex items-center gap-2'>
									<Database className='w-4 h-4 text-primary' />
									<span className='text-sm text-foreground'>
										{planFeatures.databases} Databases
									</span>
								</div>
								<div className='flex items-center gap-2'>
									<Table className='w-4 h-4 text-primary' />
									<span className='text-sm text-foreground'>
										{planFeatures.tables} Tables
									</span>
								</div>
								<div className='flex items-center gap-2'>
									<Users className='w-4 h-4 text-primary' />
									<span className='text-sm text-foreground'>
										{planFeatures.users} Users
									</span>
								</div>
								<div className='flex items-center gap-2'>
									<Shield className='w-4 h-4 text-primary' />
									<span className='text-sm text-foreground'>
										{planFeatures.storage} Storage
									</span>
								</div>
								<div className='flex items-center gap-2'>
									<HardDrive className='w-4 h-4 text-primary' />
									<span className='text-sm text-foreground'>
										{planFeatures.rows} Rows
									</span>
								</div>
							</div>
						</div>
					</div>

					<Separator />

					{/* Action Buttons */}
					<div className='flex flex-col sm:flex-row gap-3'>
						<Button
							onClick={handleManageSubscription}
							disabled={isActionLoading}
							className='flex-1'
							variant='outline'>
							<Settings className='w-4 h-4 mr-2' />
							{isActionLoading
								? t("subscription.loading")
								: t("subscription.manageBilling")}
						</Button>

						{isActive && isAdmin && (
							<>
								<Button
									onClick={() => setShowUpgradeDialog(true)}
									className='flex-1'
									variant='outline'>
									<ArrowUpRight className='w-4 h-4 mr-2' />
									Upgrade Plan
								</Button>

								{subscription.subscriptionPlan !== "Free" && (
									<>
										<Button
											onClick={() => setShowDowngradeDialog(true)}
											className='flex-1'
											variant='outline'>
											<ArrowDownRight className='w-4 h-4 mr-2' />
											Downgrade Plan
										</Button>

										<Button
											onClick={() => setShowCancelDialog(true)}
											className='flex-1'
											variant='destructive'>
											<X className='w-4 h-4 mr-2' />
											Cancel Plan
										</Button>
									</>
								)}

								{subscription.subscriptionPlan === "Free" && (
									<div className='flex-1 flex items-center justify-center p-3 bg-muted/50 rounded-md border border-dashed'>
										<div className='text-center'>
											<Info className='w-4 h-4 mx-auto mb-1 text-muted-foreground' />
											<p className='text-xs text-muted-foreground'>
												Free plan cannot be canceled or downgraded
											</p>
										</div>
									</div>
								)}
							</>
						)}

						{isActive && !isAdmin && (
							<div className='flex-1 flex items-center justify-center p-3 bg-muted/50 rounded-md border border-dashed'>
								<div className='text-center'>
									<Info className='w-4 h-4 mx-auto mb-1 text-muted-foreground' />
									<p className='text-xs text-muted-foreground'>
										Only administrators can modify subscription plans
									</p>
								</div>
							</div>
						)}

						{isCanceled && isAdmin && (
							<Button
								onClick={() => (window.location.href = "/#pricing")}
								className='flex-1'>
								<Zap className='w-4 h-4 mr-2' />
								Reactivate Subscription
							</Button>
						)}

						{isCanceled && !isAdmin && (
							<div className='flex-1 flex items-center justify-center p-3 bg-muted/50 rounded-md border border-dashed'>
								<div className='text-center'>
									<Info className='w-4 h-4 mx-auto mb-1 text-muted-foreground' />
									<p className='text-xs text-muted-foreground'>
										Contact your administrator to reactivate the subscription
									</p>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Usage Statistics */}
			<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BarChart3 className='w-5 h-5' />
						Usage Statistics
					</CardTitle>
					<CardDescription>
						Monitor your current usage against plan limits
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-muted-foreground'>
									Databases
								</span>
								<span className='text-sm text-foreground'>1/1</span>
							</div>
							<Progress value={100} className='h-2' />
						</div>

						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-muted-foreground'>
									Tables
								</span>
								<span className='text-sm text-foreground'>1/5</span>
							</div>
							<Progress value={20} className='h-2' />
						</div>

						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-muted-foreground'>
									Users
								</span>
								<span className='text-sm text-foreground'>1/2</span>
							</div>
							<Progress value={50} className='h-2' />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Billing History */}
			<BillingHistory customerId={subscription.stripeCustomerId} />

			{/* Cancel Subscription Dialog */}
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel your subscription? You'll continue
							to have access to your current plan until the end of your billing
							period on{" "}
							{subscription.subscriptionCurrentPeriodEnd
								? format(
										new Date(subscription.subscriptionCurrentPeriodEnd),
										"MMM dd, yyyy",
								  )
								: t("subscription.endOfPeriod")}
							.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Keep Subscription</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancelSubscription}
							disabled={isActionLoading}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
							{isActionLoading
								? t("subscription.canceling")
								: t("subscription.cancelSubscription")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Upgrade Plan Dialog */}
			<Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Upgrade Your Plan</DialogTitle>
						<DialogDescription>
							Upgrade to unlock more features and higher limits.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='p-4 border rounded-lg'>
							<h4 className='font-medium mb-2'>Pro Plan - $29/month</h4>
							<ul className='space-y-1 text-sm text-muted-foreground'>
								<li>• 5 Databases</li>
								<li>• 50 Tables</li>
								<li>• 10 Users</li>
								<li>• 1 GB Storage</li>
								<li>• Priority Support</li>
							</ul>
						</div>
						<div className='p-4 border rounded-lg'>
							<h4 className='font-medium mb-2'>Enterprise Plan - $99/month</h4>
							<ul className='space-y-1 text-sm text-muted-foreground'>
								<li>• Unlimited Databases</li>
								<li>• Unlimited Tables</li>
								<li>• Unlimited Users</li>
								<li>• 5 GB Storage</li>
								<li>• 24/7 Support</li>
							</ul>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowUpgradeDialog(false)}>
							Cancel
						</Button>
						<Button onClick={handleUpgradePlan}>
							<ArrowUpRight className='w-4 h-4 mr-2' />
							Upgrade Now
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Downgrade Plan Dialog */}
			<Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Downgrade to Free Plan</DialogTitle>
						<DialogDescription>
							This will immediately cancel your current subscription and switch
							you to the Free plan. You'll lose access to premium features right
							away.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='p-4 border rounded-lg'>
							<h4 className='font-medium mb-2'>Free Plan - $0/month</h4>
							<ul className='space-y-1 text-sm text-muted-foreground'>
								<li>• 1 Database</li>
								<li>• 5 Tables</li>
								<li>• 1 User</li>
								<li>• 10 MB Storage</li>
								<li>• Email Support</li>
							</ul>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowDowngradeDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleDowngradePlan}
							disabled={isActionLoading}
							variant='outline'>
							{isActionLoading ? (
								<>
									<Loader2 className='w-4 h-4 mr-2 animate-spin' />
									Processing...
								</>
							) : (
								<>
									<ArrowDownRight className='w-4 h-4 mr-2' />
									Downgrade Now
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default SubscriptionManager;
