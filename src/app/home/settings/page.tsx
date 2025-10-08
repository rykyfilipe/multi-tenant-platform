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
	FileText,
} from "lucide-react";
import BasicSettings from "@/components/settings/user/BasicSettings";
import PasswordSetter from "@/components/settings/user/PasswordSetter";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
import PlanLimitsDisplay from "@/components/PlanLimitsDisplay";
import GDPRRights from "@/components/settings/user/GDPRRights";
import { UserAvatar } from "@/components/users/UserAvatar";
import { ANAFIntegrationToggle } from "@/components/anaf/ANAFIntegrationToggle";
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
	const { user, showAlert, loading, token, tenant } = useApp();
	const { subscription, loading: subscriptionLoading } = useSubscription();
	const { data: dashboardData, loading: dashboardLoading } = useDashboardData();
	const { t } = useLanguage();
	const [activeTab, setActiveTab] = useState("profile");
	const { setIsOpen, setCurrentStep } = useTour();

	// ANAF Integration state
	const [anafEnabled, setAnafEnabled] = useState(false);
	const [anafAuthenticated, setAnafAuthenticated] = useState(false);
	const [anafLoading, setAnafLoading] = useState(false);

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

	useEffect(() => {
		// User changed
	}, [user]);

	// ANAF Integration handlers
	const handleAnafToggle = async (enabled: boolean) => {
		if (!token || !tenant) return;
		
		setAnafLoading(true);
		try {
			// Update ANAF integration status
			const response = await fetch(`/api/tenants/${tenant.id}/integrations/anaf`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ enabled }),
			});

			if (response.ok) {
				setAnafEnabled(enabled);
				showAlert(
					enabled ? t("settings.anaf.integration.enabled") : t("settings.anaf.integration.disabled"),
					"success"
				);
			} else {
				showAlert(t("settings.anaf.integration.error"), "error");
			}
		} catch (error) {
			console.error('Error toggling ANAF integration:', error);
			showAlert(t("settings.anaf.integration.error"), "error");
		} finally {
			setAnafLoading(false);
		}
	};

	const handleAnafAuthenticate = async () => {
		if (!token || !tenant) return;
		
		setAnafLoading(true);
		try {
			// Redirect to ANAF OAuth
			const response = await fetch(`/api/anaf/auth-url`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ 
					tenantId: tenant.id,
					userId: user?.id 
				}),
			});

			if (response.ok) {
				const data = await response.json();
				window.location.href = data.authUrl;
			} else {
				showAlert(t("settings.anaf.integration.auth_error"), "error");
			}
		} catch (error) {
			console.error('Error authenticating with ANAF:', error);
			showAlert(t("settings.anaf.integration.auth_error"), "error");
		} finally {
			setAnafLoading(false);
		}
	};

	const handleAnafDisconnect = async () => {
		if (!token || !tenant) return;
		
		setAnafLoading(true);
		try {
			const response = await fetch(`/api/tenants/${tenant.id}/integrations/anaf`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
			});

			if (response.ok) {
				setAnafAuthenticated(false);
				setAnafEnabled(false);
				showAlert(t("settings.anaf.integration.disconnected"), "success");
			} else {
				showAlert(t("settings.anaf.integration.disconnect_error"), "error");
			}
		} catch (error) {
			console.error('Error disconnecting ANAF:', error);
			showAlert(t("settings.anaf.integration.disconnect_error"), "error");
		} finally {
			setAnafLoading(false);
		}
	};

	// Check ANAF integration status on mount
	useEffect(() => {
		const checkAnafStatus = async () => {
			if (!token || !tenant) return;
			
			try {
				const response = await fetch(`/api/tenants/${tenant.id}/integrations/anaf`, {
					headers: {
						'Authorization': `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setAnafEnabled(data.enabled || false);
					setAnafAuthenticated(data.authenticated || false);
				}
			} catch (error) {
				console.error('Error checking ANAF status:', error);
			}
		};

		checkAnafStatus();
	}, [token, tenant]);

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

				{/* Main Content */}
				<div className='p-6 max-w-7xl mx-auto'>
					<div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
						{/* Sidebar */}
						<div className='lg:col-span-1'>
							<Card className='sticky top-8 border-border/20  backdrop-blur-sm settings-navigation shadow-xl border-0 bg-card'>
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
												id: "privacy",
												label: t("settings.tabs.privacy"),
												icon: Shield,
												description: t("settings.privacy.subtitle"),
											},
											{
												id: "anaf",
												label: t("settings.tabs.anaf"),
												icon: FileText,
												description: t("settings.anaf.subtitle"),
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

						{/* Main Content Area */}
						<div className='lg:col-span-3 space-y-8'>
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
												<div className='flex flex-col items-center space-y-4 py-6'>
													<UserAvatar
														firstName={user.firstName}
														lastName={user.lastName}
														size='xl'
														className='ring-4 ring-primary/10 shadow-lg'
													/>
													<div className='text-center'>
														<p className='text-lg font-semibold text-foreground'>
															{user.firstName} {user.lastName}
														</p>
														<p className='text-sm text-muted-foreground mt-1'>
															{user.email}
														</p>
													</div>
													<div className='bg-muted/50 rounded-lg p-4 border border-dashed border-border/50 max-w-sm'>
														<p className='text-xs text-muted-foreground text-center'>
															{t("settings.profile.avatarInfo") || "Your avatar is automatically generated based on your name"}
														</p>
													</div>
												</div>
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

							{/* ANAF Integration Tab */}
							<PremiumTabContentWrapper isActive={activeTab === "anaf"}>
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											{t("settings.anaf.title")}
										</h2>
										<p className='text-muted-foreground'>
											{t("settings.anaf.subtitle")}
										</p>
									</div>

									<Card className='border-border/20 backdrop-blur-sm shadow-lg border-0 bg-card'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<div className='p-2 bg-primary/10 rounded-xl'>
													<FileText className='w-5 h-5 text-primary' />
												</div>
												{t("settings.anaf.integration.title")}
											</CardTitle>
											<CardDescription>
												{t("settings.anaf.integration.description")}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<ANAFIntegrationToggle
												onToggle={handleAnafToggle}
												isEnabled={anafEnabled}
												isAuthenticated={anafAuthenticated}
												onAuthenticate={handleAnafAuthenticate}
												onDisconnect={handleAnafDisconnect}
												isLoading={anafLoading}
											/>
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
