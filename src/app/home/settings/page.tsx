/** @format */
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useApp } from "@/contexts/AppContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	User,
	Shield,
	CreditCard,
	Database,
	Users,
	Table,
	BarChart3,
	Settings,
	Puzzle,
} from "lucide-react";
import BasicSettings from "@/components/settings/user/BasicSettings";
import PasswordSetter from "@/components/settings/user/PasswordSetter";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
import PlanLimitsDisplay from "@/components/PlanLimitsDisplay";
import GDPRRights from "@/components/settings/user/GDPRRights";
import { UserProfileImageUpload } from "@/components/users/UserProfileImageUpload";
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { settingsTourSteps, tourUtils } from "@/lib/tour-config";
import TourResetButton from "@/components/TourResetButton";
import {
	PremiumTabNavigation,
	PremiumTabContentWrapper,
} from "@/components/ui/premium-tabs";

function Page() {
	const { data: session } = useSession();
	const { user, setUser, showAlert, loading } = useApp();
	const { subscription, loading: subscriptionLoading } = useSubscription();
	const { data: dashboardData, loading: dashboardLoading } = useDashboardData();
	const { t } = useLanguage();
	const [activeTab, setActiveTab] = useState("profile");
	const { setIsOpen, setCurrentStep } = useTour();

	const startTour = () => {
		setCurrentStep(0);
		setIsOpen(true);
	};

	useEffect(() => {
		const hasSeenTour = tourUtils.isTourSeen("settings");
		if (!hasSeenTour) {
			// Start tour after a short delay to ensure elements are rendered
			const timer = setTimeout(() => {
				startTour();
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, []);

	const handleImageUpdate = (imageUrl: string) => {
		if (user) {
			setUser({ ...user, profileImage: imageUrl });
		}
	};

	useEffect(() => {
		// User changed
	}, [user]);

	const currentPlan = subscription?.subscriptionPlan || "Free";
	const isSubscribed = subscription?.subscriptionStatus === "active";

	// Show loading state if session is not available, user data is not available, or still loading
	if (loading || !session?.user || !user) {
		return (
			<div className='h-full bg-background flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-muted-foreground'>{t("settings.loading")}</p>
				</div>
			</div>
		);
	}

	return (
		<TourProv
			steps={settingsTourSteps}
			onTourComplete={() => {
				tourUtils.markTourSeen("settings");
			}}
			onTourSkip={() => {
				tourUtils.markTourSeen("settings");
			}}>
			<div className='h-full bg-background'>
				{/* Header */}
				<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-6 gap-4'>
						<div>
							<h1 className='text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent'>
								{t("settings.title")}
							</h1>
							<p className='text-sm text-muted-foreground mt-1'>
								{t("settings.subtitle")}
							</p>
						</div>
						<div className='flex items-center space-x-3'>
							<Badge
								variant={isSubscribed ? "default" : "secondary"}
								className='text-sm px-3 py-1.5 rounded-full shadow-sm'>
								{currentPlan} Plan
							</Badge>
							<div className='w-2 h-2 rounded-full bg-primary animate-pulse shadow-sm'></div>
							<TourResetButton />
						</div>
					</div>
				</div>

				{/* Main Content - Mobile First */}
				<div className='p-4 sm:p-6 max-w-7xl mx-auto'>
					{/* Mobile Navigation */}
					<div className='lg:hidden mb-6'>
						<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
							<TabsList className='grid w-full grid-cols-2 sm:grid-cols-3 mb-4'>
								<TabsTrigger value='profile' className='text-xs sm:text-sm'>
									<User className='h-4 w-4 mr-1' />
									<span className='hidden sm:inline'>Profile</span>
								</TabsTrigger>
								<TabsTrigger value='security' className='text-xs sm:text-sm'>
									<Shield className='h-4 w-4 mr-1' />
									<span className='hidden sm:inline'>Security</span>
								</TabsTrigger>
								<TabsTrigger value='subscription' className='text-xs sm:text-sm'>
									<CreditCard className='h-4 w-4 mr-1' />
									<span className='hidden sm:inline'>Plan</span>
								</TabsTrigger>
							</TabsList>
							<TabsList className='grid w-full grid-cols-2'>
								<TabsTrigger value='usage' className='text-xs sm:text-sm'>
									<BarChart3 className='h-4 w-4 mr-1' />
									Usage
								</TabsTrigger>
								<TabsTrigger value='privacy' className='text-xs sm:text-sm'>
									<Shield className='h-4 w-4 mr-1' />
									Privacy
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					<div className='grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8'>
						{/* Desktop Sidebar */}
						<div className='hidden lg:block lg:col-span-1'>
							<Card className='sticky top-8 border-border/20 backdrop-blur-sm settings-navigation shadow-xl border-0 bg-card'>
								<CardHeader className='pb-4'>
									<CardTitle className='text-lg flex items-center gap-2 text-foreground'>
										<div className='p-2 bg-primary/10 rounded-xl'>
											<Settings className='w-5 h-5 text-primary' />
										</div>
										{t("settings.navigation.title")}
									</CardTitle>
								</CardHeader>
								<CardContent className='p-0'>
									<PremiumTabNavigation
										tabs={[
											{
												id: "profile",
												label: t("settings.tabs.profile"),
												icon: User,
												description: t("settings.profile.subtitle"),
											},
											{
												id: "security",
												label: t("settings.tabs.security"),
												icon: Shield,
												description: t("settings.security.subtitle"),
											},
											{
												id: "subscription",
												label: t("settings.tabs.subscription"),
												icon: CreditCard,
												description: t("settings.subscription.adminSubtitle"),
											},
											{
												id: "usage",
												label: t("settings.tabs.usage"),
												icon: BarChart3,
												description: t("settings.usage.subtitle"),
											},
											{
												id: "privacy",
												label: t("settings.tabs.privacy"),
												icon: Shield,
												description: t("settings.privacy.subtitle"),
											},
										]}
										activeTab={activeTab}
										onTabChange={setActiveTab}
										variant='sidebar'
										className='px-4 pb-4'
									/>
								</CardContent>
							</Card>
						</div>

						{/* Main Content Area - Mobile Optimized */}
						<div className='lg:col-span-3 space-y-6 lg:space-y-8'>
							{/* Profile Tab */}
							<PremiumTabContentWrapper isActive={activeTab === "profile"}>
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											{t("settings.profile.title")}
										</h2>
										<p className='text-muted-foreground'>
											{t("settings.profile.subtitle")}
										</p>
									</div>

									<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
										<Card className='border-border/20  backdrop-blur-sm profile-settings shadow-lg border-0 bg-card'>
											<CardHeader>
												<CardTitle className='flex items-center gap-2'>
													<div className='p-2 bg-primary/10 rounded-xl'>
														<User className='w-5 h-5 text-primary' />
													</div>
													{t("settings.profile.personalInformation.title")}
												</CardTitle>
												<CardDescription>
													{t(
														"settings.profile.personalInformation.description",
													)}
												</CardDescription>
											</CardHeader>
											<CardContent>
												<BasicSettings user={user} />
											</CardContent>
										</Card>

										<Card className='border-border/20  backdrop-blur-sm shadow-lg border-0 bg-card'>
											<CardHeader>
												<CardTitle className='flex items-center gap-2'>
													<div className='p-2 bg-primary/10 rounded-xl'>
														<User className='w-5 h-5 text-primary' />
													</div>
													{t("settings.profile.profilePicture.title")}
												</CardTitle>
												<CardDescription>
													{t("settings.profile.profilePicture.description")}
												</CardDescription>
											</CardHeader>
											<CardContent>
												<UserProfileImageUpload
													userId={user.id}
													currentImage={user.profileImage}
													userName={
														`${user.firstName || ""} ${
															user.lastName || ""
														}`.trim() || "User"
													}
													onImageUpdate={handleImageUpdate}
												/>
											</CardContent>
										</Card>
									</div>
								</div>
							</PremiumTabContentWrapper>

							{/* Security Tab */}
							<PremiumTabContentWrapper isActive={activeTab === "security"}>
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											{t("settings.security.title")}
										</h2>
										<p className='text-muted-foreground'>
											{t("settings.security.subtitle")}
										</p>
									</div>

									<Card className='border-border/20  backdrop-blur-sm shadow-lg border-0 bg-card'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<div className='p-2 bg-primary/10 rounded-xl'>
													<Shield className='w-5 h-5 text-primary' />
												</div>
												{t("settings.security.passwordAuthentication.title")}
											</CardTitle>
											<CardDescription>
												{t(
													"settings.security.passwordAuthentication.description",
												)}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<PasswordSetter user={user} />
										</CardContent>
									</Card>
								</div>
							</PremiumTabContentWrapper>

							{/* Subscription Tab */}
							<PremiumTabContentWrapper isActive={activeTab === "subscription"}>
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											{t("settings.subscription.title")}
										</h2>
										<p className='text-muted-foreground'>
											{user?.role === "ADMIN"
												? t("settings.subscription.adminSubtitle")
												: t("settings.subscription.userSubtitle")}
										</p>
									</div>

									{user?.role === "ADMIN" ? (
										<SubscriptionManager
											subscription={
												subscription || {
													stripeCustomerId: null,
													stripeSubscriptionId: null,
													subscriptionStatus: null,
													subscriptionPlan: null,
													subscriptionCurrentPeriodEnd: null,
												}
											}
											onRefresh={() => {
												// Refresh subscription data
												window.location.reload();
											}}
											isLoading={subscriptionLoading}
										/>
									) : (
										<Card className='border-border/20  backdrop-blur-sm shadow-lg border-0 bg-card'>
											<CardHeader>
												<CardTitle className='flex items-center gap-2'>
													<div className='p-2 bg-primary/10 rounded-xl'>
														<CreditCard className='w-5 h-5 text-primary' />
													</div>
													{t("settings.subscription.information.title")}
												</CardTitle>
												<CardDescription>
													{t("settings.subscription.information.description")}
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className='text-center py-8'>
													<div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20'>
														<CreditCard className='w-8 h-8 text-primary' />
													</div>
													<h3 className='text-lg font-semibold text-foreground mb-2'>
														{subscription?.subscriptionPlan ||
															t(
																"settings.subscription.information.noPlan",
															)}{" "}
														Plan
													</h3>
													<p className='text-muted-foreground mb-4'>
														{t("settings.subscription.information.status")}{" "}
														{subscription?.subscriptionStatus ||
															t(
																"settings.subscription.information.noSubscription",
															)}
													</p>
													<div className='text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg border border-dashed'>
														{t(
															"settings.subscription.information.adminOnlyMessage",
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									)}
								</div>
							</PremiumTabContentWrapper>

							{/* Usage Tab */}
							<PremiumTabContentWrapper isActive={activeTab === "usage"}>
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											{t("settings.usage.title")}
										</h2>
										<p className='text-muted-foreground'>
											{t("settings.usage.subtitle")}
										</p>
									</div>

									<Card className='border-border/20  backdrop-blur-sm shadow-lg border-0 bg-card'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<div className='p-2 bg-primary/10 rounded-xl'>
													<BarChart3 className='w-5 h-5 text-primary' />
												</div>
												{t("settings.usage.resourceUsage.title")}
											</CardTitle>
											<CardDescription>
												{t("settings.usage.resourceUsage.description")}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<PlanLimitsDisplay />
										</CardContent>
									</Card>

									{/* Quick Stats */}
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
										<Card className='border-border/20  backdrop-blur-sm shadow-lg border-0 bg-card'>
											<CardContent className='p-6'>
												<div className='flex items-center gap-3'>
													<div className='p-2 bg-primary/10 rounded-lg'>
														<Database className='w-5 h-5 text-primary' />
													</div>
													<div>
														<p className='text-sm text-muted-foreground'>
															{t("settings.usage.databases")}
														</p>
														<p className='text-2xl font-bold text-foreground'>
															{dashboardLoading
																? "..."
																: `${
																		dashboardData?.stats.totalDatabases || 0
																  }/${
																		dashboardData?.usageData?.databases
																			?.total || "∞"
																  }`}
														</p>
													</div>
												</div>
											</CardContent>
										</Card>

										<Card className='border-border/20  backdrop-blur-sm shadow-lg border-0 bg-card'>
											<CardContent className='p-6'>
												<div className='flex items-center gap-3'>
													<div className='p-2 bg-primary/10 rounded-lg'>
														<Table className='w-5 h-5 text-primary' />
													</div>
													<div>
														<p className='text-sm text-muted-foreground'>
															{t("settings.usage.tables")}
														</p>
														<p className='text-2xl font-bold text-foreground'>
															{dashboardLoading
																? "..."
																: `${dashboardData?.stats.totalTables || 0}/${
																		dashboardData?.usageData?.tables?.total ||
																		"∞"
																  }`}
														</p>
													</div>
												</div>
											</CardContent>
										</Card>

										<Card className='border-border/20  backdrop-blur-sm shadow-lg border-0 bg-card'>
											<CardContent className='p-6'>
												<div className='flex items-center gap-3'>
													<div className='p-2 bg-primary/10 rounded-lg'>
														<Users className='w-5 h-5 text-primary' />
													</div>
													<div>
														<p className='text-sm text-muted-foreground'>
															{t("settings.usage.users")}
														</p>
														<p className='text-2xl font-bold text-foreground'>
															{dashboardLoading
																? "..."
																: `${dashboardData?.stats.totalUsers || 0}/${
																		dashboardData?.usageData?.users?.total ||
																		"∞"
																  }`}
														</p>
													</div>
												</div>
											</CardContent>
										</Card>
									</div>
								</div>
							</PremiumTabContentWrapper>

							{/* Privacy Tab */}
							<PremiumTabContentWrapper isActive={activeTab === "privacy"}>
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											{t("settings.privacy.title")}
										</h2>
										<p className='text-muted-foreground'>
											{t("settings.privacy.subtitle")}
										</p>
									</div>

									<Card className=' border-border/20  backdrop-blur-sm shadow-lg border-0 bg-card'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<div className='p-2 bg-primary/10 rounded-xl'>
													<Shield className='w-5 h-5 text-primary' />
												</div>
												{t("settings.privacy.gdprRights.title")}
											</CardTitle>
											<CardDescription>
												{t("settings.privacy.gdprRights.description")}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<GDPRRights />
										</CardContent>
									</Card>
								</div>
							</PremiumTabContentWrapper>
						</div>
					</div>
				</div>
			</div>
		</TourProv>
	);
}

export default Page;
