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

const YDVLandingPage = () => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState("pro");
	const [showLoginModal, setShowLoginModal] = useState(false);

	const { data: session } = useSession();
	const router = useRouter();

	const handleStripeCheckout = (priceId: string, planName: string) => {
		// In a real implementation, this would redirect to Stripe Checkout
		alert(`Redirecting to Stripe Checkout for ${planName} plan (${priceId})`);
	};
	const features = [
		{
			icon: <Database className='w-8 h-8' />,
			title: "Create Custom Databases",
			description:
				"Build and deploy databases tailored to your specific needs with our intuitive interface.",
		},
		{
			icon: <Users className='w-8 h-8' />,
			title: "Multi-Tenant Architecture",
			description:
				"Secure, scalable infrastructure that keeps your data isolated and protected.",
		},
		{
			icon: <Settings className='w-8 h-8' />,
			title: "Customizable Tables & Columns",
			description:
				"Design your data structure exactly how you want it with flexible schema management.",
		},
		{
			icon: <Zap className='w-8 h-8' />,
			title: "Lightning Fast Performance",
			description:
				"Optimized queries and caching ensure your data is always accessible instantly.",
		},
		{
			icon: <Shield className='w-8 h-8' />,
			title: "Enterprise Security",
			description:
				"Bank-level encryption and compliance standards protect your valuable data.",
		},
		{
			icon: <BarChart3 className='w-8 h-8' />,
			title: "Advanced Analytics",
			description:
				"Gain insights with built-in analytics and reporting tools for better decisions.",
		},
	];

	const plans = [
		{
			name: "Starter",
			price: "$19",
			period: "/month",
			description: "Perfect for small teams getting started",
			features: [
				"Up to 3 databases",
				"50GB storage",
				"Basic support",
				"API access",
				"Standard security",
			],
			popular: false,
			stripePriceId: "price_starter",
		},
		{
			name: "Pro",
			price: "$49",
			period: "/month",
			description: "Most popular for growing businesses",
			features: [
				"Unlimited databases",
				"500GB storage",
				"Priority support",
				"Advanced API",
				"Enhanced security",
				"Custom integrations",
				"Analytics dashboard",
			],
			popular: true,
			stripePriceId: "price_pro",
		},
		{
			name: "Enterprise",
			price: "$149",
			period: "/month",
			description: "For large organizations with custom needs",
			features: [
				"Everything in Pro",
				"Unlimited storage",
				"24/7 dedicated support",
				"Custom deployment",
				"SLA guarantee",
				"Advanced compliance",
				"White-label options",
			],
			popular: false,
			stripePriceId: "price_enterprise",
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
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align='end'
										className='w-48 bg-white rounded-md shadow-lg p-1'>
										<DropdownMenuItem
											onClick={() => router.push("/profile")}
											className='cursor-pointer hover:bg-blue-100 rounded-md px-3 py-2'>
											Profile
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
							Trusted by 10,000+ businesses worldwide
						</div>

						<h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight'>
							Your Data,{" "}
							<span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
								Your View
							</span>
						</h1>

						<p className='text-xl sm:text-2xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto'>
							Transform how you manage data with customizable databases,
							intelligent tables, and powerful analytics. Built for teams who
							demand flexibility without complexity.
						</p>

						<div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
							<button className='group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg flex items-center'>
								Start Free Trial
								<ArrowRight className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
							</button>
							<button className='text-slate-600 hover:text-blue-600 font-semibold text-lg px-8 py-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 transition-all duration-200'>
								Watch Demo
							</button>
						</div>

						<div className='mt-16 text-sm text-slate-500'>
							No credit card required • 14-day free trial • Cancel anytime
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id='features' className='py-20 px-4 sm:px-6 lg:px-8 bg-white'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-16'>
						<h2 className='text-4xl sm:text-5xl font-bold text-slate-900 mb-6'>
							Everything you need to manage data
						</h2>
						<p className='text-xl text-slate-600 max-w-3xl mx-auto'>
							Powerful features designed to give you complete control over your
							data architecture and workflows.
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
							Choose the perfect plan for your team. Scale up or down as needed.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto'>
						{plans.map((plan, index) => (
							<div
								key={index}
								className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${
									plan.popular
										? "border-blue-500 bg-white shadow-2xl scale-105"
										: "border-slate-200 bg-white hover:border-blue-300 hover:shadow-xl"
								}`}>
								{plan.popular && (
									<div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
										<span className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold'>
											Most Popular
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
									onClick={() =>
										handleStripeCheckout(plan.stripePriceId, plan.name)
									}
									className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
										plan.popular
											? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105"
											: "bg-slate-100 text-slate-900 hover:bg-slate-200"
									}`}>
									Get Started with {plan.name}
								</button>
							</div>
						))}
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
						<p>&copy; 2025 YDV. All rights reserved. Your Data, Your View.</p>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default YDVLandingPage;
