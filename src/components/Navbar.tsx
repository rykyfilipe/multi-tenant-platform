/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
	Database,
	Users,
	Settings,
	BarChart3,
	Building2,
	Zap,
	LogOut,
	User,
	Sun,
	Moon,
	ChevronLeft,
	ChevronRight,
	Menu,
	Home,
	FileText,
	Code,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useTenantTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import TenantLogo from "./tenant/TenantLogo";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getNavigationItems = (
	t: (key: string) => string,
	userRole?: string,
	tenant?: any,
	user?: any,
) => [
	{
		title: t("nav.analytics"),
		url: "/home/analytics",
		icon: BarChart3,
		description: t("nav.analytics.description"),
	},
	{
		title: t("nav.organization"),
		url: "/home/tenant",
		icon: Building2,
		description: t("nav.organization.description"),
	},
	{
		title: userRole === "ADMIN" ? t("nav.users") : t("nav.team"),
		url: "/home/users",
		icon: Users,
		description:
			userRole === "ADMIN"
				? t("nav.users.description")
				: t("nav.team.description"),
	},
	{
		title: t("nav.database"),
		url: "/home/database",
		icon: Database,
		description: t("nav.database.description"),
	},
	// Only show invoices if billing module is enabled
	...(tenant?.enabledModules?.includes("billing")
		? [
				{
					title: t("nav.invoices"),
					url: "/home/invoices",
					icon: FileText,
					description: t("nav.invoices.description"),
				},
		  ]
		: []),
	{
		title: t("nav.settings"),
		url: "/home/settings",
		icon: Settings,
		description: t("nav.settings.description"),
	},
	// Development tools for admins
	...(user?.role === "ADMIN" && process.env.NODE_ENV === "development"
		? [
				{
					title: "Dev Tools",
					url: "/home/dev",
					icon: Code,
					description: "Development and debugging tools",
				},
		  ]
		: []),
];

// Navigation items pentru mobile (doar cele esențiale pentru spațiu limitat)
const getMobileNavigationItems = (
	t: (key: string) => string,
	userRole?: string,
	tenant?: any,
	user?: any,
) => [
	{
		title: t("nav.database"),
		url: "/home/database",
		icon: Database,
	},
	{
		title: t("nav.analytics"),
		url: "/home/analytics",
		icon: BarChart3,
	},
	{
		title: userRole === "ADMIN" ? t("nav.users") : t("nav.team"),
		url: "/home/users",
		icon: Users,
	},
	// Only show invoices if billing module is enabled
	...(tenant?.enabledModules?.includes("billing")
		? [
				{
					title: t("nav.invoices"),
					url: "/home/invoices",
					icon: FileText,
				},
		  ]
		: []),
	{
		title: t("nav.settings"),
		url: "/home/settings",
		icon: Settings,
	},
];

// Mobile Bottom Navigation Bar
export function MobileBottomNavbar() {
	const { user, tenant, token, setTenant } = useApp();
	const { t } = useLanguage();
	const router = useRouter();
	const pathname = usePathname();
	const { data: session } = useSession();
	const { currentTheme, setTheme } = useTenantTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	const handleSignOut = () => {
		signOut({ callbackUrl: "/" });
	};

	return (
		<motion.div
			className='fixed bottom-0 left-0 right-0 z-50 md:hidden'
			initial={{ y: 100, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.5, ease: "easeOut" }}>
			{/* Clean background */}
			<div className='bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800'>
				{/* Main navigation - Icons only */}
				<div className='flex items-center justify-between px-2 py-3 overflow-x-auto scrollbar-hide' style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
					{getMobileNavigationItems(t, user?.role, tenant, user).map(
						(item, index) => {
							const isActive = pathname === item.url;
							return (
								<motion.div
									key={item.title}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: index * 0.1 }}
									className="flex-shrink-0">
									<Link
										href={item.url}
										className={cn(
											"flex items-center justify-center p-3 rounded-xl min-w-0",
											"w-12 h-12", // Fixed size for consistency
											isActive
												? "bg-primary text-primary-foreground"
												: "text-gray-600 dark:text-gray-300",
										)}>
										<div className="flex items-center justify-center">
											<item.icon className='w-5 h-5' />
										</div>
									</Link>
								</motion.div>
							);
						},
					)}

					{/* User Profile Menu - Icon Only */}
					{session?.user && (
						<div className="flex-shrink-0">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button className='flex items-center justify-center p-3 rounded-xl text-gray-600 dark:text-gray-300 w-12 h-12'>
										<Avatar className='w-6 h-6'>
											<AvatarImage src={session.user.image || undefined} />
											<AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
												{session.user.firstName?.[0]}
												{session.user.lastName?.[0]}
											</AvatarFallback>
										</Avatar>
									</button>
								</DropdownMenuTrigger>

							<DropdownMenuContent
								align='end'
								side='top'
								className='mb-2 w-48 sm:w-56'>
								<div className='p-3 sm:p-4 border-b border-border'>
									<p className='font-medium text-foreground text-xs sm:text-sm'>
										{session.user.firstName} {session.user.lastName}
									</p>
									<p className='text-xs text-muted-foreground'>
										{session.user.email}
									</p>
									{user?.role && (
										<Badge
											variant='secondary'
											className='mt-1 text-xs premium-hover-subtle'>
											{user.role}
										</Badge>
									)}
								</div>

								<DropdownMenuItem
									onClick={() => {
										const newTheme = currentTheme === "dark" ? "light" : "dark";
										setTheme(newTheme);
									}}
									className='cursor-pointer premium-interaction'>
									{currentTheme === "dark" ? (
										<Sun className='w-4 h-4 mr-2' />
									) : (
										<Moon className='w-4 h-4 mr-2' />
									)}
									{currentTheme === "dark"
										? t("ui.switchToLightTheme")
										: t("ui.switchToDarkTheme")}
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									onClick={() => router.push("/")}
									className='cursor-pointer premium-interaction'>
									<Home className='w-4 h-4 mr-2' />
									{t("ui.home")}
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									onClick={handleSignOut}
									className='cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 premium-interaction'>
									<LogOut className='w-4 h-4 mr-2' />
									{t("ui.signOut")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}

export function AppSidebar() {
	const { user, tenant, token, setTenant } = useApp();
	const { t } = useLanguage();
	const router = useRouter();
	const pathname = usePathname();
	const { data: session } = useSession();
	const { currentTheme, setTheme } = useTenantTheme();
	const [mounted, setMounted] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(true);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	const handleSignOut = () => {
		signOut({ callbackUrl: "/" });
	};

	const toggleSidebar = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<motion.div
			className={cn(
				"relative flex flex-col h-full transition-all duration-300 ease-in-out",
				"border-r shadow-2xl backdrop-blur-xl",
				// Premium glass effect
				"bg-white/80 border-white/20 shadow-black/5",
				"dark:bg-black/80 dark:border-white/10 dark:shadow-white/5",
				isCollapsed ? "w-16" : "w-20",
				// Ascuns pe mobile
				"hidden md:flex",
			)}
			initial={{ x: -100, opacity: 0 }}
			animate={{ x: 0, opacity: 1 }}
			transition={{ duration: 0.5, ease: "easeOut" }}>
			{/* Premium Header - Logo Only */}
			<div className='relative p-4 border-b border-white/10 dark:border-white/5'>
				<div className="flex items-center justify-center">
					<TenantLogo size='lg' showText={false} />
				</div>
			</div>

			{/* Toggle Button - Always visible */}
			<div className='flex justify-center py-2'>
				<Button
					onClick={toggleSidebar}
					variant='ghost'
					size='sm'
					className='h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-full transition-all duration-200'>
					{isCollapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
				</Button>
			</div>

			{/* Navigation Menu - Icons Only */}
			<div className='flex-1 p-2 overflow-hidden'>
				<nav className='space-y-2'>
					{getNavigationItems(t, user?.role, tenant, user).map(
						(item, index) => {
							const isActive = pathname === item.url;
							return (
								<motion.div
									key={item.title}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: index * 0.1 }}>
									<Link
										href={item.url}
										className={cn(
											"group relative flex items-center justify-center rounded-xl transition-all duration-200",
											"hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10",
											"p-3",
											isActive && [
												"bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10",
												"shadow-lg shadow-primary/20",
												"text-primary",
											],
											!isActive &&
												"text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
										)}>
										<motion.div
											className="flex items-center justify-center"
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}>
											<item.icon className='w-5 h-5' />
										</motion.div>

										{/* Premium Tooltip */}
										<div className='absolute left-full ml-3 px-3 py-2 bg-gray-900/95 dark:bg-gray-800/95 text-white text-sm rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 backdrop-blur-sm border border-gray-700/50 dark:border-gray-600/50 transition-all duration-200'>
											<div className='font-medium'>
												{item.title}
											</div>
											<div className='text-xs text-gray-300 dark:text-gray-400 mt-1'>
												{item.description}
											</div>
											<div className='absolute top-1/2 -left-1 w-2 h-2 bg-gray-900/95 dark:bg-gray-800/95 border-l border-b border-gray-700/50 dark:border-gray-600/50 rotate-45 transform -translate-y-1/2'></div>
										</div>
									</Link>
								</motion.div>
							);
						},
					)}
				</nav>
			</div>

			{/* Premium Footer - User Avatar Only */}
			<div className='p-3 border-t border-white/10 dark:border-white/5'>
				{session?.user && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="flex items-center justify-center cursor-pointer p-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 group">
								<Avatar className='w-8 h-8 ring-2 ring-white/20 dark:ring-white/10 group-hover:ring-primary/30 transition-all duration-200'>
									<AvatarImage src={session.user.image || undefined} />
									<AvatarFallback className='bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm'>
										{session.user.firstName?.[0]}
										{session.user.lastName?.[0]}
									</AvatarFallback>
								</Avatar>
							</div>
						</DropdownMenuTrigger>

						<DropdownMenuContent
							align={isCollapsed ? "center" : "start"}
							className='w-44 sm:w-48 professional-card shadow-xl'>
							<div className='p-3 sm:p-4 border-b border-black/5 dark:border-white/10'>
								<p className='font-medium text-gray-900 dark:text-white text-xs sm:text-sm'>
									{session.user.firstName} {session.user.lastName}
								</p>
								<p className='text-xs text-gray-500 dark:text-gray-400'>
									{session.user.email}
								</p>
								{user?.role && (
									<Badge
										variant='secondary'
										className='mt-1 text-xs bg-gray-900/10 dark:bg-white/20 text-gray-900 dark:text-white border-gray-900/20 dark:border-white/20 premium-hover-subtle'>
										{user.role}
									</Badge>
								)}
							</div>

							<DropdownMenuItem
								onClick={() => {
									const newTheme = currentTheme === "dark" ? "light" : "dark";
									setTheme(newTheme);
								}}
								className='cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 focus:bg-black/5 dark:focus:bg-white/10 text-gray-900 dark:text-gray-100 premium-interaction'>
								{currentTheme === "dark" ? (
									<Sun className='w-4 h-4 mr-2' />
								) : (
									<Moon className='w-4 h-4 mr-2' />
								)}
								{currentTheme === "dark"
									? t("ui.switchToLightTheme")
									: t("ui.switchToDarkTheme")}
							</DropdownMenuItem>

							<DropdownMenuSeparator className='bg-black/10 dark:bg-white/10' />

							<DropdownMenuItem
								onClick={() => router.push("/")}
								className='cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 focus:bg-black/5 dark:focus:bg-white/10 text-gray-900 dark:text-gray-100 premium-interaction'>
								<Home className='w-4 h-4 mr-2' />
								{t("ui.home")}
							</DropdownMenuItem>

							<DropdownMenuSeparator className='bg-black/10 dark:bg-white/10' />

							<DropdownMenuItem
								onClick={handleSignOut}
								className='cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 focus:text-red-700 dark:focus:text-red-300 premium-interaction'>
								<LogOut className='w-4 h-4 mr-2' />
								{t("ui.signOut")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</motion.div>
	);
}
