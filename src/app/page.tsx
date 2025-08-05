/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
	Database,
	Users,
	Settings,
	Zap,
	Shield,
	BarChart3,
	Check,
	Menu,
	ArrowRight,
	Globe,
	AlertTriangle,
	LogOut,
} from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { redirectToCheckout } from "@/lib/stripe";
import { ContactForm } from "@/components/ContactForm";

const DataHubLandingPage = () => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState("pro");
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [mounted, setMounted] = useState(false);

	const { data: session } = useSession();
	const router = useRouter();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	const currentPlan = session?.subscription?.plan;
	const isSubscribed = session?.subscription?.status === "active";

	const handleStripeCheckout = async (priceId: string, planName: string) => {
		if (!session) {
			setShowLoginModal(true);
			return;
		}

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
			icon: <Database className='w-6 h-6' />,
			title: "Multi-Tenant Architecture",
			description:
				"Isolated data environments for different clients and projects with enterprise-grade security.",
		},
		{
			icon: <Users className='w-6 h-6' />,
			title: "Advanced User Management",
			description:
				"Granular role-based access control with detailed permissions and audit trails.",
		},
		{
			icon: <BarChart3 className='w-6 h-6' />,
			title: "Dynamic Schema Builder",
			description:
				"Create and modify database schemas without coding. Support for all major data types.",
		},
		{
			icon: <Zap className='w-6 h-6' />,
			title: "Real-time Data Operations",
			description:
				"Instant data updates, bulk operations, and seamless CSV import/export capabilities.",
		},
		{
			icon: <Shield className='w-6 h-6' />,
			title: "Enterprise Security",
			description:
				"SOC 2 compliant with encryption at rest, secure API access, and comprehensive audit logs.",
		},
		{
			icon: <Globe className='w-6 h-6' />,
			title: "RESTful API",
			description:
				"Full-featured REST API with comprehensive documentation and SDK support.",
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
				"5 tables",
				"2 users",
				"1 API token",
				"Basic user management",
				"API access (limited)",
				"Community support",
				"Data import/export",
			],
			priceId: null,
			popular: false,
		},
		{
			name: "Pro",
			price: "$29",
			period: "/month",
			description: "Most popular for teams and businesses",
			features: [
				"5 databases",
				"25 tables",
				"10 users",
				"5 API tokens",
				"2 public tables",
				"Advanced user permissions",
				"Full API access",
				"Priority support",
			],
			priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
			popular: true,
		},
		{
			name: "Enterprise",
			price: "$99",
			period: "/month",
			description: "For large teams and organizations",
			features: [
				"Unlimited databases",
				"Unlimited tables",
				"Unlimited users",
				"10 API tokens",
				"10 public tables",
				"Everything in Pro",
				"Advanced security features",
				"Advanced analytics",
			],
			priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
			popular: false,
		},
	];

	const benefits = [
		{
			icon: <Shield className='w-8 h-8' />,
			title: "Enterprise Security",
			description: "SOC 2 compliant with end-to-end encryption",
		},
		{
			icon: <Zap className='w-8 h-8' />,
			title: "Lightning Fast",
			description: "Real-time data operations and instant updates",
		},
		{
			icon: <Globe className='w-8 h-8' />,
			title: "Global Access",
			description: "Access your data from anywhere, anytime",
		},
		{
			icon: <Settings className='w-8 h-8' />,
			title: "Easy Setup",
			description: "Get started in minutes, no coding required",
		},
	];

	return (
		<div className='min-h-screen bg-background'>
			{/* Development Notice */}
			<div className='bg-amber-50 border-b border-amber-200 px-4 py-3'>
				<div className='max-w-7xl mx-auto flex items-center justify-center gap-3 text-amber-800'>
					<AlertTriangle className='w-5 h-5 flex-shrink-0' />
					<div className='text-center'>
						<p className='text-sm font-medium'>
							🚧 Application Under Development
						</p>
						<p className='text-xs text-amber-700 mt-1'>
							Some features may not work as expected. We're actively building
							and improving the platform.
						</p>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<nav className='border-b border-border/20 bg-card/90 backdrop-blur-2xl sticky top-0 z-50 shadow-lg'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between items-center h-16'>
						<div className='flex items-center space-x-3'>
							<div className='w-10 h-10 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center border border-border/20'>
								<Database className='w-5 h-5 text-primary' />
							</div>
							<span className='text-xl font-bold text-foreground'>YDV</span>
						</div>

						{/* Desktop Navigation */}
						<div className='hidden md:flex items-center space-x-8'>
							<a
								href='#features'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
								Features
							</a>
							<a
								href='#pricing'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
								Pricing
							</a>
							<a
								href='#contact'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
								Contact
							</a>
						</div>

						<div className='flex items-center space-x-4'>
							{session ? (
								<>
									{currentPlan && (
										<span className='bg-card/80 text-foreground px-4 py-2 rounded-full text-xs font-semibold shadow-inner'>
											{currentPlan}
										</span>
									)}
									<Button onClick={() => router.push("home/dashboard")}>
										Go to App
									</Button>

									{/* User Profile Dropdown */}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant='ghost'
												className='relative h-8 w-8 rounded-full'>
												<Avatar className='h-8 w-8'>
													<AvatarImage
														src={session.user?.image || undefined}
														alt='User'
													/>
													<AvatarFallback className='text-xs'>
														{(session.user as any)?.firstName?.[0] ||
															session.user?.name?.[0] ||
															"U"}
														{(session.user as any)?.lastName?.[0] || ""}
													</AvatarFallback>
												</Avatar>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className='w-56'
											align='end'
											forceMount>
											<div className='flex items-center justify-start gap-2 p-2'>
												<div className='flex flex-col space-y-1 leading-none'>
													<p className='font-medium'>
														{(session.user as any)?.firstName &&
														(session.user as any)?.lastName
															? `${(session.user as any).firstName} ${
																	(session.user as any).lastName
															  }`
															: session.user?.name || "User"}
													</p>
													{session.user?.email && (
														<p className='w-[200px] truncate text-sm text-muted-foreground'>
															{session.user.email}
														</p>
													)}
												</div>
											</div>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => router.push("/home/settings")}>
												<Settings className='mr-2 h-4 w-4' />
												<span>Settings</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => signOut({ callbackUrl: "/" })}>
												<LogOut className='mr-2 h-4 w-4' />
												<span>Log out</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</>
							) : (
								<>
									<Button
										variant='ghost'
										onClick={() => setShowLoginModal(true)}>
										Sign In
									</Button>
									<Button onClick={() => setShowLoginModal(true)}>
										Get Started
									</Button>
								</>
							)}

							{/* Mobile menu button */}
							<Button
								variant='ghost'
								size='sm'
								className='md:hidden'
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
								<Menu className='w-5 h-5' />
							</Button>
						</div>
					</div>
				</div>

				{/* Mobile Navigation */}
				{mobileMenuOpen && (
					<div className='md:hidden border-t border-border bg-card'>
						<div className='px-2 pt-2 pb-3 space-y-1'>
							<a
								href='#features'
								className='block px-3 py-2 text-sm text-muted-foreground hover:text-foreground'>
								Features
							</a>
							<a
								href='#pricing'
								className='block px-3 py-2 text-sm text-muted-foreground hover:text-foreground'>
								Pricing
							</a>
							<a
								href='#contact'
								className='block px-3 py-2 text-sm text-muted-foreground hover:text-foreground'>
								Contact
							</a>
						</div>
					</div>
				)}
			</nav>

			{/* Hero Section */}
			<section className='py-24 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto text-center'>
					<Badge
						variant='secondary'
						className='mb-8 px-6 py-3 text-sm font-semibold bg-card shadow-lg'>
						Your Data Your View
					</Badge>
					<h1 className='text-5xl md:text-7xl font-bold text-foreground mb-8 leading-tight'>
						Multi-Tenant
						<br />
						<span className='text-foreground'>Database Platform</span>
					</h1>
					<p className='text-xl text-muted-foreground mb-8 max-w-3xl mx-auto'>
						Create, manage, and share databases for multiple clients or
						projects. No coding required - build custom tables, manage users,
						and access data via API.
					</p>
					<div className='flex flex-col sm:flex-row gap-6 justify-center'>
						<Button
							size='lg'
							onClick={() => setShowLoginModal(true)}
							className='text-lg text-black px-12 py-5 bg-card shadow-lg hover:shadow-xl hover:bg-card/80 transform hover:scale-105 transition-all duration-300'>
							Get Started
							<ArrowRight className='ml-2 w-5 h-5' />
						</Button>
						{/* <Button
							variant='outline'
							size='lg'
							className='text-lg px-12 py-5 bg-card/80 shadow-inner hover:shadow-lg hover:bg-card transition-all duration-300'>
							Watch Demo
						</Button> */}
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className='py-20 bg-card shadow-inner'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl md:text-4xl font-bold text-foreground mb-4'>
							Why Choose YDV?
						</h2>
						<p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
							Built for modern teams who need powerful, secure, and easy-to-use
							data management.
						</p>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
						{benefits.map((benefit, index) => (
							<div key={index} className='text-center'>
								<div className='flex justify-center mb-6'>
									<div className='p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-border/20'>
										{benefit.icon}
									</div>
								</div>
								<h3 className='text-lg font-semibold text-foreground mb-3'>
									{benefit.title}
								</h3>
								<p className='text-sm text-muted-foreground leading-relaxed'>
									{benefit.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id='features' className='py-24 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-20'>
						<h2 className='text-4xl md:text-5xl font-bold text-foreground mb-6'>
							Everything you need to manage multiple databases
						</h2>
						<p className='text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed'>
							From creating custom tables to managing team permissions, our
							platform gives you complete control over your data.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
						{features.map((feature, index) => (
							<Card
								key={index}
								className='professional-card hover:scale-105 transition-all duration-500'>
								<CardHeader>
									<div className='p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl w-fit mb-6 shadow-lg'>
										{feature.icon}
									</div>
									<CardTitle className='text-2xl font-bold'>
										{feature.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className='text-base leading-relaxed'>
										{feature.description}
									</CardDescription>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section id='pricing' className='py-20 px-4 sm:px-6 lg:px-8 bg-muted/30'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl md:text-4xl font-bold text-foreground mb-4'>
							Simple, transparent pricing
						</h2>
						<p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
							Start free with the Starter plan. Upgrade when you need more
							databases and features.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
						{plans.map((plan, index) => {
							const isCurrentPlan =
								currentPlan &&
								plan.name.toLowerCase() === currentPlan.toLowerCase();
							return (
								<Card
									key={index}
									className={`professional-card relative ${
										plan.popular ? "ring-2 ring-primary" : ""
									} ${isCurrentPlan ? "ring-2 ring-accent" : ""}`}>
									{plan.popular && (
										<Badge className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
											Most Popular
										</Badge>
									)}
									{isCurrentPlan && (
										<Badge className='absolute -top-3 right-4 bg-accent text-accent-foreground'>
											Current Plan
										</Badge>
									)}
									<CardHeader className='text-center'>
										<CardTitle className='text-2xl'>{plan.name}</CardTitle>
										<div className='flex items-baseline justify-center'>
											<span className='text-4xl font-bold'>{plan.price}</span>
											<span className='text-muted-foreground ml-1'>
												{plan.period}
											</span>
										</div>
										<CardDescription className='text-base'>
											{plan.description}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<ul className='space-y-3 mb-8'>
											{plan.features.map((feature, featureIndex) => (
												<li key={featureIndex} className='flex items-center'>
													<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
													<span className='text-sm'>{feature}</span>
												</li>
											))}
										</ul>
										<Button
											className='w-full'
											variant={
												isCurrentPlan
													? "secondary"
													: plan.popular
													? "default"
													: "outline"
											}
											onClick={() => {
												if (isCurrentPlan) {
													return; // Nu face nimic dacă este planul curent
												}
												if (plan.name === "Starter") {
													router.push("home/dashboard");
												} else {
													plan.priceId
														? handleStripeCheckout(plan.priceId, plan.name)
														: null;
												}
											}}
											disabled={
												isCurrentPlan ||
												(!plan.priceId && plan.name !== "Starter")
											}>
											{isCurrentPlan
												? "Current Plan"
												: plan.name === "Starter"
												? "Get Started Free"
												: "Get Started"}
										</Button>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-20 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-4xl mx-auto text-center'>
					<h2 className='text-3xl md:text-4xl font-bold text-foreground mb-4'>
						Ready to Transform Your Data Management?
					</h2>
					<p className='text-xl text-muted-foreground mb-8'>
						Join thousands of organizations that trust DataHub for their data
						needs.
					</p>
					<Button
						size='lg'
						onClick={() => setShowLoginModal(true)}
						className='text-lg px-8 py-3'>
						Get Started Now
						<ArrowRight className='ml-2 w-5 h-5' />
					</Button>
				</div>
			</section>

			{/* Contact Section */}
			<ContactForm />

			{/* Footer */}
			<footer className='border-t border-border bg-card py-12 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto'>
					{/* Development Status */}
					<div className='text-center mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
						<div className='flex items-center justify-center gap-2 mb-2'>
							<AlertTriangle className='w-5 h-5 text-amber-600' />
							<h3 className='text-lg font-semibold text-amber-800'>
								Development Status
							</h3>
						</div>
						<p className='text-sm text-amber-700 max-w-2xl mx-auto'>
							YDV is currently in active development. While core features are
							functional, some advanced capabilities may still be under
							construction. We appreciate your patience and feedback as we build
							the perfect data management platform.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
						<div>
							<div className='flex items-center space-x-3 mb-4'>
								<div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
									<Database className='w-4 h-4 text-primary-foreground' />
								</div>
								<span className='text-xl font-bold'>YDV</span>
							</div>
							<p className='text-muted-foreground'>
								Your Data Your View - Multi-Tenant Database Platform.
							</p>
						</div>
						<div>
							<h3 className='font-semibold mb-4'>Product</h3>
							<ul className='space-y-2 text-sm text-muted-foreground'>
								<li>
									<a href='#' className='hover:text-foreground'>
										Features
									</a>
								</li>
								<li>
									<a href='#' className='hover:text-foreground'>
										Pricing
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-foreground line-through opacity-50'>
										API
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-foreground line-through opacity-50'>
										Documentation
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h3 className='font-semibold mb-4'>Company</h3>
							<ul className='space-y-2 text-sm text-muted-foreground'>
								<li>
									<a
										href='#'
										className='hover:text-foreground line-through opacity-50'>
										About
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-foreground line-through opacity-50'>
										Blog
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-foreground line-through opacity-50'>
										Careers
									</a>
								</li>
								<li>
									<a href='#contact' className='hover:text-foreground'>
										Contact
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h3 className='font-semibold mb-4'>Support</h3>
							<ul className='space-y-2 text-sm text-muted-foreground'>
								<li>
									<a
										href='#'
										className='hover:text-foreground line-through opacity-50'>
										Help Center
									</a>
								</li>
								<li>
									<a
										href='#'
										className='hover:text-foreground line-through opacity-50'>
										Status
									</a>
								</li>
								<li>
									<a href='/docs/terms' className='hover:text-foreground'>
										Terms
									</a>
								</li>
								<li>
									<a href='/docs/privacy' className='hover:text-foreground'>
										Privacy
									</a>
								</li>
								<li>
									<a href='/docs/cookies' className='hover:text-foreground'>
										Cookies
									</a>
								</li>
								<li>
									<a href='/docs/refund' className='hover:text-foreground'>
										Refund Policy
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className='border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground'>
						© 2025 YDV. All rights reserved. Multi-Tenant Database Platform.
					</div>
				</div>
			</footer>

			{/* Auth Modal */}
			{showLoginModal && <AuthModal onClose={() => setShowLoginModal(false)} />}
		</div>
	);
};

export default DataHubLandingPage;
