/** @format */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useApp } from "@/contexts/AppContext";
import { useSubscription } from "@/hooks/useSubscription";
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
} from "lucide-react";
import BasicSettings from "@/components/settings/user/BasicSettings";
import PasswordSetter from "@/components/settings/user/PasswordSetter";
import SubscriptionCard from "@/components/subscription/SubscriptionCard";
import PlanLimitsDisplay from "@/components/PlanLimitsDisplay";

function Page() {
	const { data: session } = useSession();
	const { user } = useApp();
	const { subscription, loading: subscriptionLoading } = useSubscription();
	const [activeTab, setActiveTab] = useState("profile");

	if (!user || !session) return null;

	const currentPlan = session?.subscription?.plan || "Starter";
	const isSubscribed = session?.subscription?.status === "active";

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
			{/* Header */}
			<div className='border-b bg-white/80 backdrop-blur-sm'>
				<div className='container mx-auto px-6 py-8'>
					<div className='flex items-center justify-between'>
						<div>
							<h1 className='text-3xl font-bold text-gray-900'>Settings</h1>
							<p className='text-gray-600 mt-1'>
								Manage your account, subscription, and preferences
							</p>
						</div>
						<div className='flex items-center gap-3'>
							<Badge
								variant={isSubscribed ? "default" : "secondary"}
								className='text-sm'>
								{currentPlan} Plan
							</Badge>
							<div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='container mx-auto px-6 py-8'>
				<div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
					{/* Sidebar */}
					<div className='lg:col-span-1'>
						<Card className='sticky top-8'>
							<CardHeader>
								<CardTitle className='text-lg'>Navigation</CardTitle>
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
									].map((item) => (
										<button
											key={item.id}
											onClick={() => setActiveTab(item.id)}
											className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
												activeTab === item.id
													? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
													: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
											}`}>
											<div className='flex items-center gap-3'>
												<item.icon className='w-5 h-5' />
												<div>
													<div className='font-medium'>{item.label}</div>
													<div className='text-sm text-gray-500'>
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
					<div className='lg:col-span-3 space-y-8'>
						{/* Profile Tab */}
						{activeTab === "profile" && (
							<div className='space-y-6'>
								<div>
									<h2 className='text-2xl font-semibold text-gray-900 mb-2'>
										Profile Settings
									</h2>
									<p className='text-gray-600'>
										Update your personal information and account details.
									</p>
								</div>

								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<User className='w-5 h-5' />
											Personal Information
										</CardTitle>
										<CardDescription>
											Manage your name, email, and account details
										</CardDescription>
									</CardHeader>
									<CardContent>
										<BasicSettings user={user} />
									</CardContent>
								</Card>
							</div>
						)}

						{/* Security Tab */}
						{activeTab === "security" && (
							<div className='space-y-6'>
								<div>
									<h2 className='text-2xl font-semibold text-gray-900 mb-2'>
										Security Settings
									</h2>
									<p className='text-gray-600'>
										Manage your password and account security.
									</p>
								</div>

								<Card>
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
									<h2 className='text-2xl font-semibold text-gray-900 mb-2'>
										Subscription & Billing
									</h2>
									<p className='text-gray-600'>
										Manage your subscription, billing information, and plan
										upgrades.
									</p>
								</div>

								{!subscriptionLoading && subscription && (
									<Card>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<CreditCard className='w-5 h-5' />
												Current Subscription
											</CardTitle>
											<CardDescription>
												View and manage your subscription details
											</CardDescription>
										</CardHeader>
										<CardContent>
											<SubscriptionCard
												subscription={subscription}
												onManageSubscription={() => {}}
											/>
										</CardContent>
									</Card>
								)}
							</div>
						)}

						{/* Usage Tab */}
						{activeTab === "usage" && (
							<div className='space-y-6'>
								<div>
									<h2 className='text-2xl font-semibold text-gray-900 mb-2'>
										Usage & Limits
									</h2>
									<p className='text-gray-600'>
										Monitor your resource usage and plan limits.
									</p>
								</div>

								<Card>
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
									<Card>
										<CardContent className='p-6'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-blue-100 rounded-lg'>
													<Database className='w-5 h-5 text-blue-600' />
												</div>
												<div>
													<p className='text-sm text-gray-600'>Databases</p>
													<p className='text-2xl font-bold text-gray-900'>
														1/1
													</p>
												</div>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardContent className='p-6'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-green-100 rounded-lg'>
													<Table className='w-5 h-5 text-green-600' />
												</div>
												<div>
													<p className='text-sm text-gray-600'>Tables</p>
													<p className='text-2xl font-bold text-gray-900'>
														1/1
													</p>
												</div>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardContent className='p-6'>
											<div className='flex items-center gap-3'>
												<div className='p-2 bg-purple-100 rounded-lg'>
													<Users className='w-5 h-5 text-purple-600' />
												</div>
												<div>
													<p className='text-sm text-gray-600'>Users</p>
													<p className='text-2xl font-bold text-gray-900'>
														1/2
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Page;
