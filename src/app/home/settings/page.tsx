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
import { Skeleton } from "@/components/ui/skeleton";
import {
	User,
	Shield,
	CreditCard,
	Settings,
	FileText,
	Sparkles,
} from "lucide-react";
import BasicSettings from "@/components/settings/user/BasicSettings";
import PasswordSetter from "@/components/settings/user/PasswordSetter";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
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
			const timer = setTimeout(() => {
				startTour();
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, []);

	// ANAF Integration handlers
	const handleAnafToggle = async (enabled: boolean) => {
		if (!token || !tenant) return;
		
		setAnafLoading(true);
		try {
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
			showAlert(t("settings.anaf.integration.error"), "error");
		} finally {
			setAnafLoading(false);
		}
	};

	const handleAnafAuthenticate = async () => {
		if (!token || !tenant) return;
		
		setAnafLoading(true);
		try {
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
				// Silent fail for status check
			}
		};

		checkAnafStatus();
	}, [token, tenant]);

	const currentPlan = subscription?.subscriptionPlan || "Free";
	const isSubscribed = subscription?.subscriptionStatus === "active";

	// Loading state
	if (loading || !session?.user || !user) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6'>
				<div className='max-w-7xl mx-auto space-y-6'>
					<div className="flex items-center justify-between">
						<div className="space-y-2">
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-4 w-72" />
						</div>
						<Skeleton className="h-9 w-24" />
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
						<div className="lg:col-span-1">
							<Skeleton className="h-96 rounded-xl" />
						</div>
						<div className="lg:col-span-3 space-y-6">
							<Skeleton className="h-64 rounded-xl" />
							<Skeleton className="h-64 rounded-xl" />
						</div>
					</div>
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
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
				{/* Header */}
				<div className='border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40'>
					<div className='max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-5 gap-4'>
						<div className="flex items-center gap-4">
							<div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
								<Settings className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h1 className='text-2xl font-bold text-foreground tracking-tight'>
									{t("settings.title")}
								</h1>
								<p className='text-sm text-muted-foreground'>
									{t("settings.subtitle")}
								</p>
							</div>
						</div>
						<div className='flex items-center gap-3'>
							<Badge
								variant={isSubscribed ? "default" : "secondary"}
								className='font-semibold px-3 py-1.5'>
								{currentPlan} Plan
							</Badge>
							<TourResetButton />
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='max-w-7xl mx-auto p-4 sm:p-6'>
					<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
						{/* Sidebar Navigation */}
						<div className='lg:col-span-1'>
							<div className='lg:sticky lg:top-24'>
								<Card className='bg-card border-border shadow-sm settings-navigation'>
									<CardHeader className='pb-3'>
										<CardTitle className='text-base font-bold text-foreground'>
											Navigation
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
											className='px-3 pb-3'
										/>
									</CardContent>
								</Card>
							</div>
						</div>

						{/* Content Area */}
						<div className='lg:col-span-3 space-y-6'>
							{/* Profile Tab */}
							<PremiumTabContentWrapper isActive={activeTab === "profile"}>
								<div className='space-y-6'>
									<div>
										<h2 className='text-xl font-bold text-foreground mb-1'>
											{t("settings.profile.title")}
										</h2>
										<p className='text-sm text-muted-foreground'>
											{t("settings.profile.subtitle")}
										</p>
									</div>

									<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
										<Card className='bg-card border-border shadow-sm profile-settings'>
											<CardHeader className="border-b border-border/50 pb-4">
												<CardTitle className='text-base font-bold flex items-center gap-2'>
													<div className='p-1.5 rounded-lg bg-primary/10'>
														<User className='w-4 h-4 text-primary' />
													</div>
													{t("settings.profile.personalInformation.title")}
												</CardTitle>
												<CardDescription className="text-xs">
													{t("settings.profile.personalInformation.description")}
												</CardDescription>
											</CardHeader>
											<CardContent className="pt-6">
												<BasicSettings user={user} />
											</CardContent>
										</Card>

										<Card className='bg-card border-border shadow-sm'>
											<CardHeader className="border-b border-border/50 pb-4">
												<CardTitle className='text-base font-bold flex items-center gap-2'>
													<div className='p-1.5 rounded-lg bg-primary/10'>
														<User className='w-4 h-4 text-primary' />
													</div>
													{t("settings.profile.profilePicture.title")}
												</CardTitle>
												<CardDescription className="text-xs">
													{t("settings.profile.profilePicture.description")}
												</CardDescription>
											</CardHeader>
											<CardContent className="pt-6">
												<div className='flex flex-col items-center space-y-4 py-4'>
													<UserAvatar
														firstName={user.firstName}
														lastName={user.lastName}
														size='xl'
														className='ring-4 ring-primary/10 shadow-sm'
													/>
													<div className='text-center'>
														<p className='text-base font-semibold text-foreground'>
															{user.firstName} {user.lastName}
														</p>
														<p className='text-sm text-muted-foreground mt-0.5'>
															{user.email}
														</p>
													</div>
													<div className='bg-muted/30 rounded-lg p-3 border border-border/50 max-w-sm'>
														<p className='text-xs text-muted-foreground text-center leading-relaxed'>
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
										<h2 className='text-xl font-bold text-foreground mb-1'>
											{t("settings.security.title")}
										</h2>
										<p className='text-sm text-muted-foreground'>
											{t("settings.security.subtitle")}
										</p>
									</div>

									<Card className='bg-card border-border shadow-sm'>
										<CardHeader className="border-b border-border/50 pb-4">
											<CardTitle className='text-base font-bold flex items-center gap-2'>
												<div className='p-1.5 rounded-lg bg-primary/10'>
													<Shield className='w-4 h-4 text-primary' />
												</div>
												{t("settings.security.passwordAuthentication.title")}
											</CardTitle>
											<CardDescription className="text-xs">
												{t("settings.security.passwordAuthentication.description")}
											</CardDescription>
										</CardHeader>
										<CardContent className="pt-6">
											<PasswordSetter user={user} />
										</CardContent>
									</Card>
								</div>
							</PremiumTabContentWrapper>

							{/* Subscription Tab */}
							<PremiumTabContentWrapper isActive={activeTab === "subscription"}>
								<div className='space-y-6'>
									<div>
										<h2 className='text-xl font-bold text-foreground mb-1'>
											{t("settings.subscription.title")}
										</h2>
										<p className='text-sm text-muted-foreground'>
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
												window.location.reload();
											}}
											isLoading={subscriptionLoading}
										/>
									) : (
										<Card className='bg-card border-border shadow-sm'>
											<CardHeader className="border-b border-border/50 pb-4">
												<CardTitle className='text-base font-bold flex items-center gap-2'>
													<div className='p-1.5 rounded-lg bg-primary/10'>
														<CreditCard className='w-4 h-4 text-primary' />
													</div>
													{t("settings.subscription.information.title")}
												</CardTitle>
												<CardDescription className="text-xs">
													{t("settings.subscription.information.description")}
												</CardDescription>
											</CardHeader>
											<CardContent className="pt-6">
												<div className='text-center py-8'>
													<div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4'>
														<CreditCard className='w-8 h-8 text-primary' />
													</div>
													<h3 className='text-lg font-bold text-foreground mb-2'>
														{subscription?.subscriptionPlan || t("settings.subscription.information.noPlan")} Plan
													</h3>
													<p className='text-sm text-muted-foreground mb-6'>
														{t("settings.subscription.information.status")}{" "}
														{subscription?.subscriptionStatus || t("settings.subscription.information.noSubscription")}
													</p>
													<div className='text-xs text-muted-foreground p-4 bg-muted/30 rounded-lg border border-border/50 max-w-md mx-auto'>
														{t("settings.subscription.information.adminOnlyMessage")}
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
										<h2 className='text-xl font-bold text-foreground mb-1'>
											{t("settings.privacy.title")}
										</h2>
										<p className='text-sm text-muted-foreground'>
											{t("settings.privacy.subtitle")}
										</p>
									</div>

									<Card className='bg-card border-border shadow-sm'>
										<CardHeader className="border-b border-border/50 pb-4">
											<CardTitle className='text-base font-bold flex items-center gap-2'>
												<div className='p-1.5 rounded-lg bg-primary/10'>
													<Shield className='w-4 h-4 text-primary' />
												</div>
												{t("settings.privacy.gdprRights.title")}
											</CardTitle>
											<CardDescription className="text-xs">
												{t("settings.privacy.gdprRights.description")}
											</CardDescription>
										</CardHeader>
										<CardContent className="pt-6">
											<GDPRRights />
										</CardContent>
									</Card>
								</div>
							</PremiumTabContentWrapper>

							{/* ANAF Integration Tab */}
							<PremiumTabContentWrapper isActive={activeTab === "anaf"}>
								<div className='space-y-6'>
									<div>
										<h2 className='text-xl font-bold text-foreground mb-1'>
											{t("settings.anaf.title")}
										</h2>
										<p className='text-sm text-muted-foreground'>
											{t("settings.anaf.subtitle")}
										</p>
									</div>

									<Card className='bg-card border-border shadow-sm'>
										<CardHeader className="border-b border-border/50 pb-4">
											<CardTitle className='text-base font-bold flex items-center gap-2'>
												<div className='p-1.5 rounded-lg bg-primary/10'>
													<FileText className='w-4 h-4 text-primary' />
												</div>
												{t("settings.anaf.integration.title")}
											</CardTitle>
											<CardDescription className="text-xs">
												{t("settings.anaf.integration.description")}
											</CardDescription>
										</CardHeader>
										<CardContent className="pt-6">
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
