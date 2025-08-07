/** @format */
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useApp } from "@/contexts/AppContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useDashboardData } from "@/hooks/useDashboardData";
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
} from "lucide-react";
import BasicSettings from "@/components/settings/user/BasicSettings";
import PasswordSetter from "@/components/settings/user/PasswordSetter";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
import PlanLimitsDisplay from "@/components/PlanLimitsDisplay";
import GDPRRights from "@/components/settings/user/GDPRRights";
import { ProfileImageUpload } from "@/components/users/ProfileImageUpload";
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { settingsTourSteps, tourUtils } from "@/lib/tour-config";
import TourResetButton from "@/components/TourResetButton";

function Page() {
	const { data: session } = useSession();
	const { user, setUser, showAlert } = useApp();
	const { subscription, loading: subscriptionLoading } = useSubscription();
	const { data: dashboardData, loading: dashboardLoading } = useDashboardData();
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

	const currentPlan = subscription?.subscriptionPlan || "Starter";
	const isSubscribed = subscription?.subscriptionStatus === "active";

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
				<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-4'>
						<div>
							<h1 className='text-xl font-semibold text-foreground'>
								Settings
							</h1>
							<p className='text-sm text-muted-foreground'>
								Manage your account and preferences
							</p>
						</div>
						<div className='flex items-center space-x-3'>
							<Badge
								variant={isSubscribed ? "default" : "secondary"}
								className='text-sm'>
								{currentPlan} Plan
							</Badge>
							<div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
							<TourResetButton />
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='p-6 max-w-7xl mx-auto'>
					<div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
						{/* Sidebar */}
						<div className='lg:col-span-1'>
							<Card className='sticky top-8 border-border/20 bg-card/50 backdrop-blur-sm settings-navigation'>
								<CardHeader>
									<CardTitle className='text-lg flex items-center gap-2'>
										<Settings className='w-5 h-5' />
										Navigation
									</CardTitle>
								</CardHeader>
								<CardContent className='p-0'>
									<nav className='space-y-1'>
										{[
											{
												id: "profile",
												label: "Profile",
												icon: User,
												description: "Personal information",
											},
											{
												id: "security",
												label: "Security",
												icon: Shield,
												description: "Password & authentication",
											},
											{
												id: "subscription",
												label: "Subscription",
												icon: CreditCard,
												description: "Billing & plans",
											},
											{
												id: "usage",
												label: "Usage",
												icon: BarChart3,
												description: "Resource limits",
											},
											{
												id: "privacy",
												label: "Privacy",
												icon: Shield,
												description: "GDPR rights & data",
											},
										].map((item) => (
											<button
												key={item.id}
												onClick={() => setActiveTab(item.id)}
												className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
													activeTab === item.id
														? "bg-primary/10 text-primary border-r-2 border-primary"
														: "text-muted-foreground hover:bg-muted hover:text-foreground"
												}`}>
												<div className='flex items-center gap-3'>
													<item.icon className='w-4 h-4' />
													<div className='flex-1'>
														<div className='font-medium'>{item.label}</div>
														<div className='text-xs opacity-75'>
															{item.description}
														</div>
													</div>
												</div>
											</button>
										))}
									</nav>
								</CardContent>
							</Card>
						</div>

						{/* Main Content Area */}
						<div className='lg:col-span-3'>
							{/* Profile Tab */}
							{activeTab === "profile" && (
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											Profile Settings
										</h2>
										<p className='text-muted-foreground'>
											Update your personal information and profile picture.
										</p>
									</div>

									<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
										<Card className='border-border/20 bg-card/50 backdrop-blur-sm profile-settings'>
											<CardHeader>
												<CardTitle className='flex items-center gap-2'>
													<User className='w-5 h-5' />
													Personal Information
												</CardTitle>
												<CardDescription>
													Update your name, email, and other details
												</CardDescription>
											</CardHeader>
											<CardContent>
												<BasicSettings user={user} />
											</CardContent>
										</Card>

										<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
											<CardHeader>
												<CardTitle className='flex items-center gap-2'>
													<User className='w-5 h-5' />
													Profile Picture
												</CardTitle>
												<CardDescription>
													Upload or change your profile image
												</CardDescription>
											</CardHeader>
											<CardContent>
												<ProfileImageUpload
													userId={user?.id?.toString() || ""}
													currentImage={user?.profileImage}
													userName={`${user?.firstName} ${user?.lastName}`}
													onImageUpdate={handleImageUpdate}
												/>
											</CardContent>
										</Card>
									</div>
								</div>
							)}

							{/* Security Tab */}
							{activeTab === "security" && (
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											Security Settings
										</h2>
										<p className='text-muted-foreground'>
											Manage your password and account security.
										</p>
									</div>

									<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<Shield className='w-5 h-5' />
												Password & Authentication
											</CardTitle>
											<CardDescription>
												Update your password and security preferences
											</CardDescription>
										</CardHeader>
										<CardContent>
											<PasswordSetter user={user} />
										</CardContent>
									</Card>
								</div>
							)}

							{/* Subscription Tab */}
							{activeTab === "subscription" && (
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											Subscription & Billing
										</h2>
										<p className='text-muted-foreground'>
											Manage your subscription, billing information, and plan
											upgrades.
										</p>
									</div>

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
								</div>
							)}

							{/* Usage Tab */}
							{activeTab === "usage" && (
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											Usage & Limits
										</h2>
										<p className='text-muted-foreground'>
											Monitor your resource usage and plan limits.
										</p>
									</div>

									<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<BarChart3 className='w-5 h-5' />
												Resource Usage
											</CardTitle>
											<CardDescription>
												Track your current usage against plan limits
											</CardDescription>
										</CardHeader>
										<CardContent>
											<PlanLimitsDisplay />
										</CardContent>
									</Card>

									{/* Quick Stats */}
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
										<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
											<CardContent className='p-6'>
												<div className='flex items-center gap-3'>
													<div className='p-2 bg-primary/10 rounded-lg'>
														<Database className='w-5 h-5 text-primary' />
													</div>
													<div>
														<p className='text-sm text-muted-foreground'>
															Databases
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

										<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
											<CardContent className='p-6'>
												<div className='flex items-center gap-3'>
													<div className='p-2 bg-green-500/10 rounded-lg'>
														<Table className='w-5 h-5 text-green-500' />
													</div>
													<div>
														<p className='text-sm text-muted-foreground'>
															Tables
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

										<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
											<CardContent className='p-6'>
												<div className='flex items-center gap-3'>
													<div className='p-2 bg-purple-500/10 rounded-lg'>
														<Users className='w-5 h-5 text-purple-500' />
													</div>
													<div>
														<p className='text-sm text-muted-foreground'>
															Users
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
							)}

							{/* Privacy Tab */}
							{activeTab === "privacy" && (
								<div className='space-y-6'>
									<div>
										<h2 className='text-2xl font-semibold text-foreground mb-2'>
											Privacy & Data Rights
										</h2>
										<p className='text-muted-foreground'>
											Manage your data privacy and exercise your GDPR rights.
										</p>
									</div>

									<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<Shield className='w-5 h-5' />
												GDPR Rights
											</CardTitle>
											<CardDescription>
												Exercise your data protection rights
											</CardDescription>
										</CardHeader>
										<CardContent>
											<GDPRRights />
										</CardContent>
									</Card>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</TourProv>
	);
}

export default Page;
