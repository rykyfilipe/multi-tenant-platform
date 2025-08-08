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
	LogOut,
	Monitor,
	Building2,
	Store,
	Calendar,
	Truck,
	ChartBar,
	Filter,
} from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
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
	const { user } = useApp();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	const currentPlan = session?.subscription?.plan;
	const isSubscribed = session?.subscription?.status === "active";
	const isAdmin = user?.role === "ADMIN";

	const handleStripeCheckout = async (priceId: string, planName: string) => {
		if (!session) {
			setShowLoginModal(true);
			return;
		}

		if (!isAdmin) {
			alert(
				"Only administrators can modify subscription plans. Please contact your administrator.",
			);
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
			alert(
				"Failed to start checkout. Please check your Stripe configuration and try again.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const useCases = [
		{
			icon: <Monitor className='w-8 h-8' />,
			title: "Content Management System (CMS)",
			description:
				"Store and manage content, articles, products, and media metadata. Your frontend CMS can fetch and display content through our API.",
			features: [
				"Content database",
				"Media metadata",
				"SEO data storage",
				"Content scheduling",
				"Multi-language content",
			],
			color: "from-blue-500/20 to-cyan-500/20",
			iconColor: "text-blue-600",
		},
		{
			icon: <Building2 className='w-8 h-8' />,
			title: "Admin Panel & Dashboard",
			description:
				"Store user data, permissions, settings, and analytics data. Your admin dashboard can read and manage this data through our secure API.",
			features: [
				"User data storage",
				"Permission management",
				"Analytics data",
				"System configuration",
				"Audit trail data",
			],
			color: "from-purple-500/20 to-pink-500/20",
			iconColor: "text-purple-600",
		},
		{
			icon: <Store className='w-8 h-8' />,
			title: "Business Management",
			description:
				"Store all your business data - customers, orders, inventory, and financial records. Your business applications can access this data via API.",
			features: [
				"Customer database",
				"Order data storage",
				"Inventory tracking",
				"Financial records",
				"Business reporting data",
			],
			color: "from-green-500/20 to-emerald-500/20",
			iconColor: "text-green-600",
		},
		{
			icon: <Truck className='w-8 h-8' />,
			title: "Logistics & Supply Chain",
			description:
				"Store logistics data - shipments, warehouses, inventory, and delivery information. Your logistics apps can track and manage operations via API.",
			features: [
				"Shipment data",
				"Warehouse information",
				"Inventory tracking",
				"Route data",
				"Delivery schedules",
			],
			color: "from-orange-500/20 to-red-500/20",
			iconColor: "text-orange-600",
		},
		{
			icon: <Calendar className='w-8 h-8' />,
			title: "Project Management",
			description:
				"Store project data, tasks, team assignments, and progress tracking. Your project management tools can sync with this data through API.",
			features: [
				"Project data storage",
				"Task information",
				"Team assignments",
				"Time tracking data",
				"Progress metrics",
			],
			color: "from-indigo-500/20 to-blue-500/20",
			iconColor: "text-indigo-600",
		},
		{
			icon: <ChartBar className='w-8 h-8' />,
			title: "Data Analytics & Reporting",
			description:
				"Store analytics data, metrics, and reporting information. Your analytics dashboards and reporting tools can fetch this data via API.",
			features: [
				"Analytics data storage",
				"Metrics collection",
				"Reporting data",
				"Data export via API",
				"Real-time data access",
			],
			color: "from-teal-500/20 to-cyan-500/20",
			iconColor: "text-teal-600",
		},
	];

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
			icon: <Filter className='w-6 h-6' />,
			title: "Advanced Data Filtering",
			description:
				"Powerful filtering with 20+ operators including regex, date ranges, and smart presets.",
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
			name: "Free",
			price: "Free",
			period: "",
			description: "Perfect for individuals and small projects",
			features: [
				"1 database",
				"5 tables",
				"2 users",
				"1 API token",
				"100 MB storage",
				"10.000 rows",
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
				"1 GB storage",
				"100.000 rows",
				"2 public tables",
				"Advanced user permissions",
				"Full API access",
				"Priority support",
			],
			priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
			popular: true,
		},
		{
			name: "Business",
			price: "$99",
			period: "/month",
			description: "For large teams and organizations",
			features: [
				"Unlimited databases",
				"Unlimited tables",
				"Unlimited users",
				"10 API tokens",
				"5 GB storage",
				"1.000.000 rows",
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
			description:
				"SOC 2 compliant with end-to-end encryption and 99.98% authentication uptime",
		},
		{
			icon: <Zap className='w-8 h-8' />,
			title: "Lightning Fast",
			description: "15ms database response time with 99.99% API uptime",
		},
		{
			icon: <Globe className='w-8 h-8' />,
			title: "Global Access",
			description:
				"99.95% web interface uptime with real-time data synchronization",
		},
		{
			icon: <Settings className='w-8 h-8' />,
			title: "Easy Setup",
			description:
				"Get started in minutes with 99.90% file storage reliability",
		},
	];

	return (
		<div className='min-h-screen bg-background'>
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
								href='/docs/api'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
								API
							</a>
							<a
								href='/docs/help'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
								Help
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
								href='/docs/api'
								className='block px-3 py-2 text-sm text-muted-foreground hover:text-foreground'>
								API
							</a>
							<a
								href='/docs/help'
								className='block px-3 py-2 text-sm text-muted-foreground hover:text-foreground'>
								Help
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
						Business Data
						<br />
						<span className='text-foreground'>Management Platform</span>
					</h1>
					<p className='text-xl text-muted-foreground mb-8 max-w-3xl mx-auto'>
						Gestionează-ți toate datele companiei într-un singur loc. Creează
						baze de date personalizate, administrează utilizatorii și
						permisiunile, și conectează orice aplicație prin API-ul nostru
						puternic — fără cod necesar.
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
							De ce să alegi YDV?
						</h2>
						<p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
							Construit pentru companii moderne care au nevoie de o gestionare
							puternică, sigură și ușor de folosit a datelor.
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

			{/* Use Cases Section */}
			<section className='py-24 px-4 sm:px-6 lg:px-8 bg-muted/20'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-20'>
						<h2 className='text-4xl md:text-5xl font-bold text-foreground mb-6'>
							Gestionează-ți Datele de Business
						</h2>
						<p className='text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed'>
							YDV oferă soluția completă de gestionare a datelor pentru compania
							ta. Creează și administrează structura datelor, apoi conectează
							orice aplicație prin API-ul nostru puternic.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
						{useCases.map((useCase, index) => (
							<Card
								key={index}
								className='professional-card hover:scale-105 transition-all duration-500 group'>
								<CardHeader>
									<div
										className={`p-4 bg-gradient-to-br ${useCase.color} rounded-2xl w-fit mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
										<div className={useCase.iconColor}>{useCase.icon}</div>
									</div>
									<CardTitle className='text-2xl font-bold'>
										{useCase.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className='text-base leading-relaxed mb-6'>
										{useCase.description}
									</CardDescription>
									<div className='space-y-2'>
										{useCase.features.map((feature, featureIndex) => (
											<div
												key={featureIndex}
												className='flex items-center text-sm'>
												<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
												<span className='text-muted-foreground'>{feature}</span>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					<div className='text-center mt-16'>
						<div className='bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 border border-border/20'>
							<h3 className='text-2xl font-bold text-foreground mb-4'>
								Backend Puternic pentru Business
							</h3>
							<p className='text-lg text-muted-foreground mb-6 max-w-2xl mx-auto'>
								Interfața intuitivă YDV îți permite să proiectezi structura
								datelor fără cod. Apoi folosește API-ul nostru REST pentru a
								conecta orice aplicație - site-uri web, aplicații mobile sau
								dashboard-uri personalizate.
							</p>
							<Button
								size='lg'
								onClick={() => {
									if (!session) setShowLoginModal(true);
									else router.push("home/dashboard");
								}}
								className='text-lg px-8 py-3'>
								Începe să Gestionezi Datele
								<ArrowRight className='ml-2 w-5 h-5' />
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Advanced Filtering Section */}
			<section className='py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-16'>
						<h2 className='text-4xl md:text-5xl font-bold text-foreground mb-6'>
							Advanced Data Filtering
						</h2>
						<p className='text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed'>
							Find exactly what you need with our powerful filtering system.
							From simple text searches to complex date ranges and regex
							patterns.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
						<Card className='professional-card hover:scale-105 transition-all duration-500'>
							<CardHeader>
								<div className='p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl w-fit mb-6 shadow-lg'>
									<Filter className='w-6 h-6 text-blue-600' />
								</div>
								<CardTitle className='text-2xl font-bold'>
									Text Filters
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className='text-base leading-relaxed mb-4'>
									Advanced text filtering with 9 different operators
								</CardDescription>
								<div className='space-y-2'>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Contains & Does not contain
										</span>
									</div>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Starts with & Ends with
										</span>
									</div>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Regular expressions
										</span>
									</div>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Empty/Non-empty checks
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className='professional-card hover:scale-105 transition-all duration-500'>
							<CardHeader>
								<div className='p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl w-fit mb-6 shadow-lg'>
									<BarChart3 className='w-6 h-6 text-green-600' />
								</div>
								<CardTitle className='text-2xl font-bold'>
									Number Filters
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className='text-base leading-relaxed mb-4'>
									Comprehensive numeric filtering with range support
								</CardDescription>
								<div className='space-y-2'>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Greater/Less than
										</span>
									</div>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Between & Not between
										</span>
									</div>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Equals & Not equals
										</span>
									</div>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Null value detection
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className='professional-card hover:scale-105 transition-all duration-500'>
							<CardHeader>
								<div className='p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl w-fit mb-6 shadow-lg'>
									<Calendar className='w-6 h-6 text-purple-600' />
								</div>
								<CardTitle className='text-2xl font-bold'>
									Date Filters
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className='text-base leading-relaxed mb-4'>
									Smart date filtering with automatic period detection
								</CardDescription>
								<div className='space-y-2'>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Today, Yesterday
										</span>
									</div>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											This week/month/year
										</span>
									</div>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Before/After dates
										</span>
									</div>
									<div className='flex items-center text-sm'>
										<Check className='w-4 h-4 text-primary mr-3 flex-shrink-0' />
										<span className='text-muted-foreground'>
											Date range filtering
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className='text-center'>
						<div className='bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 border border-border/20'>
							<h3 className='text-2xl font-bold text-foreground mb-4'>
								Smart Filter Features
							</h3>
							<p className='text-lg text-muted-foreground mb-6 max-w-2xl mx-auto'>
								Save filter presets, use global search, and combine multiple
								conditions to find exactly what you need. Our filtering system
								adapts to your data types automatically.
							</p>
							<Button
								size='lg'
								onClick={() => {
									if (!session) setShowLoginModal(true);
									else router.push("home/dashboard");
								}}
								className='text-lg px-8 py-3'>
								Try Advanced Filtering
								<ArrowRight className='ml-2 w-5 h-5' />
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id='features' className='py-24 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-20'>
						<h2 className='text-4xl md:text-5xl font-bold text-foreground mb-6'>
							Tot ce ai nevoie pentru a gestiona datele companiei
						</h2>
						<p className='text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed'>
							De la crearea tabelelor personalizate la gestionarea permisiunilor
							echipei, platforma noastră îți oferă controlul complet asupra
							backend-ului de date.
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
												(!plan.priceId && plan.name !== "Starter") ||
												(!isAdmin && plan.name !== "Starter" && !!session)
											}>
											{isCurrentPlan
												? "Current Plan"
												: !isAdmin && plan.name !== "Starter" && session
												? "Admin Only"
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
						Gata să Transformi Gestionarea Datelor Companiei?
					</h2>
					<p className='text-xl text-muted-foreground mb-8'>
						Alătură-te miilor de organizații care se încred în YDV pentru
						nevoile lor de date.
					</p>
					<Button
						size='lg'
						onClick={() => setShowLoginModal(true)}
						className='text-lg px-8 py-3'>
						Începe Acum
						<ArrowRight className='ml-2 w-5 h-5' />
					</Button>
				</div>
			</section>

			{/* Contact Section */}
			<ContactForm />

			{/* Footer */}
			<footer className='border-t border-border bg-card py-12 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto'>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
						<div>
							<div className='flex items-center space-x-3 mb-4'>
								<div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
									<Database className='w-4 h-4 text-primary-foreground' />
								</div>
								<span className='text-xl font-bold'>YDV</span>
							</div>
							<p className='text-muted-foreground'>
								Your Data Your View - Platformă de Gestionare a Datelor de
								Business.
							</p>
						</div>
						<div>
							<h3 className='font-semibold mb-4'>Product</h3>
							<ul className='space-y-2 text-sm text-muted-foreground'>
								<li>
									<a href='#features' className='hover:text-foreground'>
										Features
									</a>
								</li>
								<li>
									<a href='#pricing' className='hover:text-foreground'>
										Pricing
									</a>
								</li>
								<li>
									<a href='/docs/api' className='hover:text-foreground'>
										API
									</a>
								</li>
								<li>
									<a href='/docs/help' className='hover:text-foreground'>
										Documentation
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h3 className='font-semibold mb-4'>Company</h3>
							<ul className='space-y-2 text-sm text-muted-foreground'>
								<li>
									<a href='/docs/about' className='hover:text-foreground'>
										About
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
									<a href='/docs/help' className='hover:text-foreground'>
										Help Center
									</a>
								</li>
								<li>
									<a href='/docs/status' className='hover:text-foreground'>
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
						© 2025 YDV. All rights reserved. Business Data Management Platform.
					</div>
				</div>
			</footer>

			{/* Auth Modal */}
			{showLoginModal && <AuthModal onClose={() => setShowLoginModal(false)} />}
		</div>
	);
};

export default DataHubLandingPage;
