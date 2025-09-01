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
import { useLanguage } from "@/contexts/LanguageContext";
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
	const { t } = useLanguage();

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
			alert(t("landing.alerts.adminOnlySubscription"));
			return;
		}

		if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
			alert(t("landing.alerts.stripeNotConfigured"));
			return;
		}

		setIsLoading(true);
		try {
			await redirectToCheckout(priceId, planName);
		} catch (error) {
			alert(t("landing.alerts.checkoutFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	const features = [
		{
			icon: <Database className='w-6 h-6' />,
			title: t("landing.features.multiTenant.title"),
			description: t("landing.features.multiTenant.description"),
		},
		{
			icon: <Users className='w-6 h-6' />,
			title: t("landing.features.userManagement.title"),
			description: t("landing.features.userManagement.description"),
		},
		{
			icon: <Settings className='w-6 h-6' />,
			title: t("landing.features.schemaBuilder.title"),
			description: t("landing.features.schemaBuilder.description"),
		},
		{
			icon: <Filter className='w-6 h-6' />,
			title: t("landing.features.dataFiltering.title"),
			description: t("landing.features.dataFiltering.description"),
		},
		{
			icon: <Zap className='w-6 h-6' />,
			title: t("landing.features.realTimeData.title"),
			description: t("landing.features.realTimeData.description"),
		},
		{
			icon: <Shield className='w-6 h-6' />,
			title: t("landing.features.enterpriseSecurity.title"),
			description: t("landing.features.enterpriseSecurity.description"),
		},
	];

	const businessBenefits = [
		{
			icon: <Users className='w-8 h-8' />,
			title: t("landing.benefits.organizeCustomers.title"),
			description: t("landing.benefits.organizeCustomers.description"),
		},
		{
			icon: <Database className='w-8 h-8' />,
			title: t("landing.benefits.customTables.title"),
			description: t("landing.benefits.customTables.description"),
		},
	];

	const targetAudience = [
		{
			icon: <Building2 className='w-8 h-8' />,
			title: t("landing.audience.smallBusiness.title"),
			description: t("landing.audience.smallBusiness.description"),
		},
		{
			icon: <Users className='w-8 h-8' />,
			title: t("landing.audience.freelancers.title"),
			description: t("landing.audience.freelancers.description"),
		},
		{
			icon: <Zap className='w-8 h-8' />,
			title: t("landing.audience.startups.title"),
			description: t("landing.audience.startups.description"),
		},
	];

	const plans = [
		{
			name: t("landing.plans.free.name"),
			price: t("landing.plans.free.name"),
			period: "/month",
			description: t("landing.plans.free.description"),
			storage: "10MB",
			features: [
				t("landing.plans.free.databases"),
				t("landing.plans.free.tables"),
				t("landing.plans.free.users"),
				t("landing.plans.free.support"),
				t("landing.plans.free.importExport"),
			],
			popular: false,
		},
		{
			name: t("landing.plans.pro.name"),
			price: "€29",
			period: "/month",
			description: t("landing.plans.pro.description"),
			storage: "1GB",
			features: [
				t("landing.plans.pro.databases"),
				t("landing.plans.pro.tables"),
				t("landing.plans.pro.users"),
				t("landing.plans.pro.support"),
				t("landing.plans.pro.analytics"),
			],
			priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
			popular: true,
		},
		{
			name: t("landing.plans.enterprise.name"),
			price: "€99",
			period: "/month",
			description: t("landing.plans.enterprise.description"),
			storage: "10GB",
			features: [
				t("landing.plans.enterprise.databases"),
				t("landing.plans.enterprise.tables"),
				t("landing.plans.enterprise.users"),
				t("landing.plans.enterprise.integrations"),
				t("landing.plans.enterprise.security"),
				t("landing.plans.enterprise.support"),
			],
			priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
			popular: false,
		},
	];

	return (
		<div className='min-h-screen premium-gradient-bg'>
			{/* Navigation */}
			<nav className='border-b border-border/20 bg-card/90 backdrop-blur-2xl sticky top-0 z-50 shadow-lg'>
				<div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
					<div className='flex justify-between items-center h-14 sm:h-16'>
						<div className='flex items-center space-x-2 sm:space-x-3'>
							<div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center border border-border/20'>
								<Database className='w-4 h-4 sm:w-5 sm:h-5 text-primary' />
							</div>
							<span className='text-lg sm:text-xl font-bold text-foreground'>
								YDV
							</span>
						</div>

						{/* Desktop Navigation */}
						<div className='hidden md:flex items-center space-x-8'>
							<a
								href='#features'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors premium-interaction px-3 py-2 rounded-md'>
								{t("landing.nav.features")}
							</a>
							<a
								href='#pricing'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors premium-interaction px-3 py-2 rounded-md'>
								{t("landing.nav.pricing")}
							</a>
							<a
								href='/docs/help'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors premium-interaction px-3 py-2 rounded-md'>
								{t("landing.nav.help")}
							</a>
							<a
								href='#contact'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors premium-interaction px-3 py-2 rounded-md'>
								{t("landing.nav.contact")}
							</a>
						</div>

						<div className='flex items-center space-x-2 sm:space-x-4'>
							{session ? (
								<>
									{currentPlan && (
										<span className='hidden sm:block bg-card/80 text-foreground px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold shadow-inner'>
											{currentPlan}
										</span>
									)}
									<Button
										onClick={() => router.push("home/analytics")}
										className='premium-hover-subtle text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2'>
										<span className='hidden sm:inline'>
											{t("landing.nav.goToApp")}
										</span>
										<span className='sm:hidden'>App</span>
									</Button>

									{/* User Profile Dropdown */}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant='ghost'
												className='relative h-8 w-8 rounded-full premium-hover-subtle'>
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
												<span>{t("landing.nav.settings")}</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => signOut({ callbackUrl: "/" })}>
												<LogOut className='mr-2 h-4 w-4' />
												<span>{t("landing.nav.logOut")}</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</>
							) : (
								<>
									<Button
										variant='ghost'
										onClick={() => setShowLoginModal(true)}
										className='premium-hover-subtle text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 hidden sm:flex'>
										{t("landing.nav.signIn")}
									</Button>
									<Button
										onClick={() => setShowLoginModal(true)}
										className='premium-hover-subtle text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2'>
										<span className='hidden sm:inline'>
											{t("landing.nav.getStarted")}
										</span>
										<span className='sm:hidden'>Start</span>
									</Button>
								</>
							)}

							{/* Mobile menu button */}
							<Button
								variant='ghost'
								size='sm'
								className='md:hidden premium-hover-subtle p-2'
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
								<Menu className='w-4 h-4 sm:w-5 sm:h-5' />
							</Button>
						</div>
					</div>
				</div>

				{/* Mobile Navigation */}
				{mobileMenuOpen && (
					<div className='md:hidden border-t border-border bg-card/95 backdrop-blur-xl mobile-drawer-enter'>
						<div className='px-3 pt-3 pb-4 space-y-1'>
							<a
								href='#features'
								className='block px-3 py-3 text-sm text-muted-foreground hover:text-foreground premium-interaction rounded-lg mobile-touch-feedback'
								onClick={() => setMobileMenuOpen(false)}>
								{t("landing.nav.features")}
							</a>
							<a
								href='#pricing'
								className='block px-3 py-3 text-sm text-muted-foreground hover:text-foreground premium-interaction rounded-lg mobile-touch-feedback'
								onClick={() => setMobileMenuOpen(false)}>
								{t("landing.nav.pricing")}
							</a>
							<a
								href='/docs/help'
								className='block px-3 py-3 text-sm text-muted-foreground hover:text-foreground premium-interaction rounded-lg mobile-touch-feedback'
								onClick={() => setMobileMenuOpen(false)}>
								{t("landing.nav.help")}
							</a>
							<a
								href='#contact'
								className='block px-3 py-3 text-sm text-muted-foreground hover:text-foreground premium-interaction rounded-lg mobile-touch-feedback'
								onClick={() => setMobileMenuOpen(false)}>
								{t("landing.nav.contact")}
							</a>
						</div>
					</div>
				)}
			</nav>

			{/* Hero Section */}
			<section className='py-12 sm:py-16 md:py-20 lg:py-24'>
				<div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
					<div className='text-center'>
						<Badge
							variant='secondary'
							className='mb-6 sm:mb-8 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold bg-card shadow-lg premium-hover-subtle'>
							{t("landing.tagline")}
						</Badge>
						<h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6 sm:mb-8 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent'>
							{t("landing.hero.title")}
						</h1>
						<p className='text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8 sm:mb-12'>
							{t("landing.hero.subtitle")}
						</p>
						{session && (
							<div className='bg-card/50 backdrop-blur-sm border border-border/20 rounded-2xl p-6 sm:p-8 shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:bg-card/60 mb-8 sm:mb-12 max-w-2xl mx-auto'>
								<p className='text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6'>
									{t("landing.hero.startFree")}
								</p>
								<Button
									size='lg'
									onClick={() => {
										if (!session) {
											setShowLoginModal(true);
										} else {
											router.push("home/dashboard");
										}
									}}
									className='text-sm sm:text-lg text-black dark:text-white px-8 sm:px-12 py-4 sm:py-6 bg-card shadow-lg hover:shadow-xl hover:bg-card/80 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto'>
									{t("landing.hero.createAccount")}
									<ArrowRight className='ml-2 w-4 h-4 sm:w-5 sm:h-5' />
								</Button>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className='py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-r from-card/50 via-card/30 to-card/50 backdrop-blur-sm'>
				<div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
					<div className='text-center mb-8 sm:mb-12 lg:mb-16 space-y-3 sm:space-y-4'>
						<h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent'>
							{t("landing.benefits.title")}
						</h2>
						<p className='text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground leading-relaxed max-w-3xl mx-auto'>
							{t("landing.benefits.subtitle")}
						</p>
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8'>
						{businessBenefits.map((benefit, index) => (
							<div key={index} className='text-center space-y-4 sm:space-y-6'>
								<div className='flex justify-center mb-4 sm:mb-6'>
									<div className='p-4 sm:p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-border/20 premium-hover'>
										{benefit.icon}
									</div>
								</div>
								<h3 className='text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4'>
									{benefit.title}
								</h3>
								<p className='text-sm sm:text-sm text-muted-foreground leading-relaxed'>
									{benefit.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Who is it for Section */}
			<section className='py-12 sm:py-16 md:py-20 lg:py-24'>
				<div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
					<div className='text-center mb-8 sm:mb-12 lg:mb-16 space-y-3 sm:space-y-4'>
						<h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent'>
							{t("landing.audience.title")}
						</h2>
						<p className='text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground leading-relaxed max-w-3xl mx-auto'>
							{t("landing.audience.subtitle")}
						</p>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
						{targetAudience.map((audience, index) => (
							<Card key={index} className='professional-card premium-hover'>
								<CardHeader className='p-4 sm:p-6 md:p-8'>
									<div className='p-4 sm:p-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl w-fit mb-4 sm:mb-6 shadow-lg premium-hover'>
										{audience.icon}
									</div>
									<CardTitle className='text-xl sm:text-2xl font-bold'>
										{audience.title}
									</CardTitle>
								</CardHeader>
								<CardContent className='p-4 sm:p-6 md:p-8 pt-0'>
									<CardDescription className='text-sm sm:text-base leading-relaxed'>
										{audience.description}
									</CardDescription>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section
				id='features'
				className='py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-r from-card/50 via-card/30 to-card/50 backdrop-blur-sm'>
				<div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
					<div className='text-center mb-8 sm:mb-12 lg:mb-16 space-y-3 sm:space-y-4'>
						<h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent'>
							{t("landing.features.title")}
						</h2>
						<p className='text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground leading-relaxed max-w-3xl mx-auto'>
							{t("landing.features.subtitle")}
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
						{features.map((feature, index) => (
							<Card key={index} className='professional-card premium-hover'>
								<CardHeader className='p-4 sm:p-6 md:p-8'>
									<div className='p-4 sm:p-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl w-fit mb-4 sm:mb-6 shadow-lg premium-hover'>
										{feature.icon}
									</div>
									<CardTitle className='text-xl sm:text-2xl font-bold'>
										{feature.title}
									</CardTitle>
								</CardHeader>
								<CardContent className='p-4 sm:p-6 md:p-8 pt-0'>
									<CardDescription className='text-sm sm:text-base leading-relaxed'>
										{feature.description}
									</CardDescription>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section id='pricing' className='py-12 sm:py-16 md:py-20 lg:py-24'>
				<div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
					<div className='text-center mb-8 sm:mb-12 lg:mb-16 space-y-3 sm:space-y-4'>
						<h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent'>
							{t("landing.pricing.title")}
						</h2>
						<p className='text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground leading-relaxed max-w-3xl mx-auto'>
							{t("landing.pricing.subtitle")}
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
						{plans.map((plan, index) => {
							const isCurrentPlan =
								currentPlan &&
								plan.name.toLowerCase() === currentPlan.toLowerCase();
							return (
								<Card
									key={index}
									className={`professional-card premium-hover relative ${
										plan.popular ? "ring-2 ring-primary scale-105" : ""
									} ${isCurrentPlan ? "ring-2 ring-accent" : ""}`}>
									{plan.popular && (
										<Badge className='absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary'>
											{t("landing.pricing.recommended")}
										</Badge>
									)}
									{isCurrentPlan && (
										<Badge className='absolute -top-3 right-4 bg-accent text-accent-foreground'>
											{t("landing.pricing.yourPlan")}
										</Badge>
									)}
									<CardHeader className='text-center p-4 sm:p-6 md:p-8'>
										<CardTitle className='text-xl sm:text-2xl'>
											{plan.name}
										</CardTitle>
										<div className='flex items-baseline justify-center'>
											<span className='text-3xl sm:text-4xl font-bold'>
												{plan.price}
											</span>
											<span className='text-muted-foreground ml-1 text-sm sm:text-base'>
												{plan.period}
											</span>
										</div>
										<div className='text-base sm:text-lg font-semibold text-primary mb-2'>
											{plan.storage} {t("landing.pricing.dataStorage")}
										</div>
										<CardDescription className='text-sm sm:text-base'>
											{plan.description}
										</CardDescription>
									</CardHeader>
									<CardContent className='p-4 sm:p-6 md:p-8 pt-0'>
										<ul className='space-y-3 mb-6 sm:mb-8'>
											{plan.features.map((feature, featureIndex) => (
												<li key={featureIndex} className='flex items-center'>
													<Check className='w-3 h-3 sm:w-4 sm:h-4 text-primary mr-2 sm:mr-3 flex-shrink-0' />
													<span className='text-xs sm:text-sm'>{feature}</span>
												</li>
											))}
										</ul>
										<Button
											className='w-full premium-hover-subtle text-sm sm:text-base'
											variant={
												isCurrentPlan
													? "secondary"
													: plan.popular
													? "default"
													: "outline"
											}
											onClick={() => {
												if (isCurrentPlan) {
													return; // Do nothing if it's the current plan
												}
												if (plan.name === t("landing.plans.free.name")) {
													router.push("home/dashboard");
												} else {
													plan.priceId
														? handleStripeCheckout(plan.priceId, plan.name)
														: null;
												}
											}}
											disabled={
												isCurrentPlan ||
												(!plan.priceId &&
													plan.name !== t("landing.plans.free.name")) ||
												(!isAdmin &&
													plan.name !== t("landing.plans.free.name") &&
													!!session)
											}>
											{isCurrentPlan
												? t("landing.plans.buttons.yourPlan")
												: !isAdmin &&
												  plan.name !== t("landing.plans.free.name") &&
												  session
												? t("landing.plans.buttons.adminOnly")
												: plan.name === t("landing.plans.free.name")
												? t("landing.plans.buttons.startFree")
												: t("landing.plans.buttons.getStarted")}
										</Button>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-r from-card/50 via-card/30 to-card/50 backdrop-blur-sm'>
				<div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
					<div className='max-w-4xl mx-auto text-center'>
						<h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4 sm:mb-6 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent'>
							{t("landing.cta.title")}
						</h2>
						<p className='text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8 sm:mb-12'>
							{t("landing.cta.subtitle")}
						</p>
						<Button
							size='lg'
							onClick={() => setShowLoginModal(true)}
							className='text-sm sm:text-lg px-8 sm:px-12 py-4 sm:py-6 premium-hover shadow-lg w-full sm:w-auto'>
							{t("landing.cta.button")}
							<ArrowRight className='ml-2 w-4 h-4 sm:w-5 sm:h-5' />
						</Button>
						<div className='mt-8 sm:mt-12 bg-card/50 backdrop-blur-sm border border-border/20 rounded-2xl p-6 sm:p-8 shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:bg-card/60'>
							<p className='text-base sm:text-lg text-muted-foreground'>
								{t("landing.cta.bonus")}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Contact Section */}
			<ContactForm />

			{/* Footer */}
			<footer className='border-t border-border bg-card py-12 sm:py-16 md:py-20 lg:py-24'>
				<div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8'>
						<div className='sm:col-span-2 lg:col-span-1'>
							<div className='flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6'>
								<div className='w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center'>
									<Database className='w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground' />
								</div>
								<span className='text-lg sm:text-xl font-bold'>YDV</span>
							</div>
							<p className='text-sm sm:text-base text-muted-foreground'>
								{t("landing.footer.description")}
							</p>
						</div>
						<div>
							<h3 className='font-semibold mb-4 sm:mb-6 text-sm sm:text-base'>
								{t("landing.footer.product")}
							</h3>
							<ul className='space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground'>
								<li>
									<a
										href='#features'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.features")}
									</a>
								</li>
								<li>
									<a
										href='#pricing'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.pricing")}
									</a>
								</li>
								<li>
									<a
										href='/docs/help'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.documentation")}
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h3 className='font-semibold mb-4 sm:mb-6 text-sm sm:text-base'>
								{t("landing.footer.company")}
							</h3>
							<ul className='space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground'>
								<li>
									<a
										href='/docs/about'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.about")}
									</a>
								</li>
								<li>
									<a
										href='#contact'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.contact")}
									</a>
								</li>
							</ul>
						</div>
						<div className='sm:col-span-2 lg:col-span-1'>
							<h3 className='font-semibold mb-4 sm:mb-6 text-sm sm:text-base'>
								{t("landing.footer.support")}
							</h3>
							<ul className='space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground'>
								<li>
									<a
										href='/docs/help'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.helpCenter")}
									</a>
								</li>
								<li>
									<a
										href='/docs/status'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.status")}
									</a>
								</li>
								<li>
									<a
										href='/docs/legal/terms'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.terms")}
									</a>
								</li>
								<li>
									<a
										href='/docs/legal/privacy'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.privacy")}
									</a>
								</li>
								<li>
									<a
										href='/docs/legal/cookies'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.cookies")}
									</a>
								</li>
								<li>
									<a
										href='/docs/legal/refund'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.refundPolicy")}
									</a>
								</li>
								<li>
									<a
										href='/docs/legal/dpa'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.dpa")}
									</a>
								</li>
								<li>
									<a
										href='/docs/legal/acceptable-use'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.acceptableUse")}
									</a>
								</li>
								<li>
									<a
										href='/docs/legal/sla'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.sla")}
									</a>
								</li>
								<li>
									<a
										href='/docs/legal/configure'
										className='hover:text-foreground premium-interaction px-2 py-1 -mx-2 rounded block'>
										{t("landing.footer.legalConfig")}
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className='border-t border-border mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground'>
						{t("landing.footer.copyright")}
					</div>
				</div>
			</footer>

			{/* Auth Modal */}
			{showLoginModal && <AuthModal onClose={() => setShowLoginModal(false)} />}
		</div>
	);
};

export default DataHubLandingPage;
