/** @format */

"use client";

import React, { useEffect, useState } from "react";
import {
	Database,
	Users,
	Settings,
	Zap,
	Shield,
	BarChart3,
	Check,
	Menu,
	X,
	ArrowRight,
	Star,
	UserCircle,
} from "lucide-react";
import AuthForm from "@/components/auth/AuthForm";
import AuthModal from "@/components/auth/AuthModal";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { redirectToCheckout } from "@/lib/stripe";

const YDVLandingPage = () => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState("pro");
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { data: session } = useSession();
	const router = useRouter();

	// Get current subscription info
	const currentPlan = session?.subscription?.plan;
	const isSubscribed = session?.subscription?.status === "active";

	const handleStripeCheckout = async (priceId: string, planName: string) => {
		if (!session) {
			setShowLoginModal(true);
			return;
		}

		// Check if Stripe is configured
		if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
			alert("Stripe is not configured. Please contact support.");
			return;
		}

		setIsLoading(true);
		try {
			await redirectToCheckout(priceId, planName);
		} catch (error) {
			console.error("Checkout error:", error);
			alert(
				"Failed to start checkout. Please check your Stripe configuration and try again.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const features = [
		{
			icon: <Database className='w-8 h-8' />,
			title: "Multi-Tenant Database Platform",
			description:
				"Create and manage multiple databases for different clients or projects with complete isolation.",
		},
		{
			icon: <Users className='w-8 h-8' />,
			title: "User Management & Permissions",
			description:
				"Add team members, manage roles, and control access to databases and tables with granular permissions.",
		},
		{
			icon: <Settings className='w-8 h-8' />,
			title: "Dynamic Table Builder",
			description:
				"Create custom tables with any columns you need - text, numbers, dates, and more. No coding required.",
		},
		{
			icon: <Zap className='w-8 h-8' />,
			title: "Real-time Data Management",
			description:
				"Add, edit, and manage data in real-time. Import/export CSV files and collaborate with your team.",
		},
		{
			icon: <Shield className='w-8 h-8' />,
			title: "Secure API Access",
			description:
				"Generate API tokens for secure access to your data. Perfect for integrations and custom applications.",
		},
		{
			icon: <BarChart3 className='w-8 h-8' />,
			title: "Public Data Sharing",
			description:
				"Share your data publicly with customizable views and read-only access for external users.",
		},
	];

	const plans = [
		{
			name: "Starter",
			price: "Free",
			period: "",
			description: "Perfect for individuals and small projects",
			features: [
				"1 database",
				"1 table",
				"2 users",
				"1 API token",
				"Basic user management",
				"API access (limited)",
				"Community support",
				"Data import/export",
			],
			popular: false,
			stripePriceId:
				process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || "price_starter",
		},
		{
			name: "Pro",
			price: "$20",
			period: "/month",
			description: "Most popular for teams and businesses",
			features: [
				"1 database",
				"5 tables",
				"5 users",
				"3 API tokens",
				"2 public tables",
				"Advanced user permissions",
				"Full API access",
				"Priority support",
				"Advanced data management",
				"Public data sharing",
				"Custom integrations",
			],
			popular: true,
			stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro",
		},
		{
			name: "Enterprise",
			price: "$99",
			period: "/month",
			description: "For large teams and organizations",
			features: [
				"10 databases",
				"50 tables",
				"20 users",
				"10 API tokens",
				"10 public tables",
				"Everything in Pro",
				"Advanced security features",
				"24/7 priority support",
				"Custom branding",
				"Advanced analytics",
				"White-label options",
				"SLA guarantee",
			],
			popular: false,
			stripePriceId:
				process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID ||
				"price_enterprise",
		},
	];

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
			{/* Navigation */}
			<nav className='fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-slate-200/60 z-50'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between items-center h-16'>
						<div className='flex items-center space-x-3'>
							<div className='w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center'>
								<Database className='w-6 h-6 text-white' />
							</div>
							<span className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
								YDV
							</span>
						</div>

						<div className='hidden md:flex items-center space-x-8'>
							<a
								href='#features'
								className='text-slate-600 hover:text-blue-600 transition-colors font-medium'>
								Features
							</a>
							<a
								href='#pricing'
								className='text-slate-600 hover:text-blue-600 transition-colors font-medium'>
								Pricing
							</a>

							{session && (
								// Dropdown profil când e logat
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className='flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors font-medium'>
											<UserCircle className='w-6 h-6' />
											<span>{session.user?.name || "User"}</span>
											{currentPlan && (
												<span className='bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'>
													{currentPlan}
												</span>
											)}
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align='end'
										className='w-48 bg-white rounded-md shadow-lg p-1'>
										{currentPlan && (
											<DropdownMenuItem className='cursor-default px-3 py-2 text-green-600 font-semibold'>
												Current Plan: {currentPlan}
											</DropdownMenuItem>
										)}

										<DropdownMenuItem
											onClick={() => router.push("/home/settings")}
											className='cursor-pointer hover:bg-blue-100 rounded-md px-3 py-2'>
											Settings
										</DropdownMenuItem>

										<DropdownMenuSeparator />

										<DropdownMenuItem
											onClick={() => signOut()}
											className='cursor-pointer hover:bg-blue-100 rounded-md px-3 py-2 text-red-600 font-semibold'>
											Logout
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
							{session ? (
								<button
									onClick={() => router.push("/home")}
									className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium'>
									Go to App
								</button>
							) : (
								<Button
									variant='ghost'
									className='text-md text-blue-500 hover:text-blue-600 transition-colors font-medium '
									onClick={() => setShowLoginModal(true)}>
									Login
								</Button>
							)}
						</div>
						<button
							className='md:hidden block'
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
							{mobileMenuOpen ? (
								<X className='w-6 h-6' />
							) : (
								<Menu className='w-6 h-6' />
							)}
						</button>
					</div>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<div className='md:hidden bg-white border-t border-slate-200'>
						<div className='px-4 py-4 space-y-4'>
							<a
								href='#features'
								className='block text-slate-600 hover:text-blue-600 font-medium'>
								Features
							</a>
							<a
								href='#pricing'
								className='block text-slate-600 hover:text-blue-600 font-medium'>
								Pricing
							</a>
							{/* Poți extinde și meniul mobil cu Login/Profil */}
							{session ? (
								<button
									className='block w-full text-left text-slate-600 hover:text-blue-600 font-medium'
									onClick={() => router.push("/profile")}>
									Profile
								</button>
							) : (
								<button
									className='block text-slate-600 hover:text-blue-600 font-medium'
									onClick={() => setShowLoginModal(true)}>
									Login
								</button>
							)}
							<button className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 font-medium'>
								{session ? "Go to App" : "Get Started"}
							</button>
						</div>
					</div>
				)}
			</nav>

			{showLoginModal && <AuthModal onClose={() => setShowLoginModal(false)} />}

			{showLoginModal && <AuthModal onClose={() => setShowLoginModal(false)} />}

			{/* Hero Section */}
			<section className='pt-32 pb-20 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center max-w-4xl mx-auto'>
						<div className='inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-8 border border-blue-200'>
							<Star className='w-4 h-4 mr-2' />
							Perfect for agencies, consultants, and teams
						</div>

						<h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight'>
							Multi-Tenant{" "}
							<span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
								Database Platform
							</span>
						</h1>

						<p className='text-xl sm:text-2xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto'>
							Create, manage, and share databases for multiple clients or
							projects. No coding required - build custom tables, manage users,
							and access data via API.
						</p>

						<div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
							<button
								onClick={() => router.push("/home")}
								className='group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg flex items-center'>
								Get Started Free
								<ArrowRight className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
							</button>
							<button className='text-slate-600 hover:text-blue-600 font-semibold text-lg px-8 py-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 transition-all duration-200'>
								View Pricing
							</button>
						</div>

						<div className='mt-16 text-sm text-slate-500'>
							Free Starter plan • No credit card required • Upgrade anytime
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id='features' className='py-20 px-4 sm:px-6 lg:px-8 bg-white'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-16'>
						<h2 className='text-4xl sm:text-5xl font-bold text-slate-900 mb-6'>
							Everything you need to manage multiple databases
						</h2>
						<p className='text-xl text-slate-600 max-w-3xl mx-auto'>
							From creating custom tables to managing team permissions, our
							platform gives you complete control over your data.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
						{features.map((feature, index) => (
							<div
								key={index}
								className='group p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
								<div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300'>
									{feature.icon}
								</div>
								<h3 className='text-xl font-bold text-slate-900 mb-4'>
									{feature.title}
								</h3>
								<p className='text-slate-600 leading-relaxed'>
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section
				id='pricing'
				className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-16'>
						<h2 className='text-4xl sm:text-5xl font-bold text-slate-900 mb-6'>
							Simple, transparent pricing
						</h2>
						<p className='text-xl text-slate-600 max-w-3xl mx-auto'>
							Start free with the Starter plan. Upgrade when you need more
							databases and features.
						</p>

						{/* Current Plan Info */}
						{isSubscribed && currentPlan && (
							<div className='mt-8 p-4 bg-green-50 border border-green-200 rounded-lg max-w-md mx-auto'>
								<div className='flex items-center justify-center space-x-2'>
									<Check className='w-5 h-5 text-green-600' />
									<span className='text-green-800 font-medium'>
										You're currently on the {currentPlan} plan
									</span>
								</div>
								<p className='text-green-600 text-sm mt-1'>
									You can upgrade or manage your subscription anytime.
								</p>
							</div>
						)}
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto'>
						{plans.map((plan, index) => {
							const isCurrentPlan = currentPlan === plan.name;
							const isUpgrade = isSubscribed && !isCurrentPlan;

							return (
								<div
									key={index}
									className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${
										plan.popular
											? "border-blue-500 bg-white shadow-2xl scale-105"
											: "border-slate-200 bg-white hover:border-blue-300 hover:shadow-xl"
									} ${isCurrentPlan ? "border-green-500 bg-green-50" : ""}`}>
									{plan.popular && (
										<div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
											<span className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold'>
												Most Popular
											</span>
										</div>
									)}

									{isCurrentPlan && (
										<div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
											<span className='bg-green-600 text-white px-6 py-2 rounded-full text-sm font-semibold'>
												Current Plan
											</span>
										</div>
									)}

									<div className='text-center mb-8'>
										<h3 className='text-2xl font-bold text-slate-900 mb-2'>
											{plan.name}
										</h3>
										<p className='text-slate-600 mb-6'>{plan.description}</p>
										<div className='flex items-end justify-center'>
											<span className='text-5xl font-bold text-slate-900'>
												{plan.price}
											</span>
											<span className='text-slate-600 ml-2'>{plan.period}</span>
										</div>
									</div>

									<ul className='space-y-4 mb-8'>
										{plan.features.map((feature, featureIndex) => (
											<li
												key={featureIndex}
												className='flex items-center text-slate-600'>
												<Check className='w-5 h-5 text-green-500 mr-3 flex-shrink-0' />
												{feature}
											</li>
										))}
									</ul>

									<button
										onClick={() => {
											if (plan.name === "Starter") {
												router.push("/home");
											} else {
												handleStripeCheckout(plan.stripePriceId, plan.name);
											}
										}}
										disabled={isLoading || isCurrentPlan}
										className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
											isCurrentPlan
												? "bg-green-600 text-white cursor-not-allowed"
												: plan.popular
												? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
												: "bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
										}`}>
										{isLoading
											? "Processing..."
											: isCurrentPlan
											? "Current Plan"
											: plan.name === "Starter"
											? "Get Started Free"
											: isUpgrade
											? `Upgrade to ${plan.name}`
											: `Get Started with ${plan.name}`}
									</button>
								</div>
							);
						})}
					</div>

					<div className='text-center mt-12'>
						<p className='text-slate-600'>
							Need a custom solution?{" "}
							<a
								href='#'
								className='text-blue-600 hover:text-blue-700 font-semibold'>
								Contact our sales team
							</a>
						</p>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto'>
					<div className='flex flex-col md:flex-row justify-between items-center'>
						<div className='flex items-center space-x-3 mb-8 md:mb-0'>
							<div className='w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center'>
								<Database className='w-6 h-6 text-white' />
							</div>
							<span className='text-2xl font-bold'>YDV</span>
						</div>

						<div className='flex space-x-8'>
							<a
								href='#'
								className='text-slate-400 hover:text-white transition-colors'>
								Privacy Policy
							</a>
							<a
								href='#'
								className='text-slate-400 hover:text-white transition-colors'>
								Terms of Service
							</a>
							<a
								href='#'
								className='text-slate-400 hover:text-white transition-colors'>
								Contact
							</a>
						</div>
					</div>

					<div className='border-t border-slate-800 mt-8 pt-8 text-center text-slate-400'>
						<p>
							&copy; 2025 YDV. All rights reserved. Multi-Tenant Database
							Platform.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default YDVLandingPage;
