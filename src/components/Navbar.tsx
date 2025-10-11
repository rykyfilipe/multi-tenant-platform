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
	LayoutDashboard,
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
		title: t("nav.dashboards"),
		url: "/home/dashboards",
		icon: LayoutDashboard,
		description: t("nav.dashboards.description"),
	},
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
	{
		title: t("nav.invoices"),
		url: "/home/invoices",
		icon: FileText,
		description: t("nav.invoices.description"),
	},
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
				{
					title: "ANAF Test",
					url: "/test/anaf",
					icon: FileText,
					description: "Test ANAF e-Factura integration",
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
		title: t("nav.dashboards"),
		url: "/home/dashboards",
		icon: LayoutDashboard,
	},
	{
		title: t("nav.analytics"),
		url: "/home/analytics",
		icon: BarChart3,
	},
	{
		title: t("nav.database"),
		url: "/home/database",
		icon: Database,
	},
	{
		title: t("nav.invoices"),
		url: "/home/invoices",
		icon: FileText,
	},
	{
		title: t("nav.organization"),
		url: "/home/tenant",
		icon: Building2,
	},
	{
		title: userRole === "ADMIN" ? t("nav.users") : t("nav.team"),
		url: "/home/users",
		icon: Users,
	},
	// Development tools for admins
	...(user?.role === "ADMIN" && process.env.NODE_ENV === "development"
		? [
				{
					title: "Dev Tools",
					url: "/home/dev",
					icon: Code,
				},
				{
					title: "ANAF Test",
					url: "/test/anaf",
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
		<div className='fixed bottom-0 left-0 right-0 z-50 md:hidden'>
			{/* Clean background */}
			<div className='bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800'>
				{/* Main navigation - Icons only */}
				<div className='flex items-center justify-between px-2 py-3 overflow-x-auto scrollbar-hide' style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
					{getMobileNavigationItems(t, user?.role, tenant, user).map(
						(item) => {
							const isActive = pathname === item.url;
							return (
								<div key={item.title} className="flex-shrink-0">
									<Link
										href={item.url}
										className={cn(
											"flex items-center justify-center p-3 rounded-lg min-w-0",
											"w-12 h-12", // Fixed size for consistency
											isActive
												? "bg-gray-900 text-white"
												: "text-gray-600 dark:text-gray-300",
										)}>
										<div className="flex items-center justify-center">
											<item.icon className='w-5 h-5' />
										</div>
									</Link>
								</div>
							);
						},
					)}

					{/* User Profile Menu - Icon Only */}
					{session?.user && (
						<div className="flex-shrink-0">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button className='flex items-center justify-center p-3 rounded-lg text-gray-600 dark:text-gray-300 w-12 h-12'>
										<Avatar className='w-6 h-6'>
											<AvatarFallback className='bg-gradient-to-br from-primary to-primary/80 text-white font-semibold text-xs'>
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
								<div className='p-3 sm:p-4 border-b border-gray-200'>
									<p className='font-medium text-gray-900 text-xs sm:text-sm'>
										{session.user.firstName} {session.user.lastName}
									</p>
									<p className='text-xs text-gray-500'>
										{session.user.email}
									</p>
									{user?.role && (
										<Badge
											variant='secondary'
											className='mt-1 text-xs bg-gray-100 text-gray-700'>
											{user.role}
										</Badge>
									)}
								</div>

								<DropdownMenuItem
									onClick={() => {
										const newTheme = currentTheme === "dark" ? "light" : "dark";
										setTheme(newTheme);
									}}
									className='cursor-pointer'>
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
									className='cursor-pointer'>
									<Home className='w-4 h-4 mr-2' />
									{t("ui.home")}
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									onClick={handleSignOut}
									className='cursor-pointer text-red-600 hover:bg-red-50'>
									<LogOut className='w-4 h-4 mr-2' />
									{t("ui.signOut")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						</div>
					)}
				</div>
			</div>
		</div>
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
		<div
			className={cn(
				"relative flex flex-col h-full transition-all duration-200",
				"border-r border-gray-200",
				"bg-white dark:bg-gray-900",
				isCollapsed ? "w-16" : "w-20",
				// Ascuns pe mobile
				"hidden md:flex",
			)}>
			{/* Clean Header - Logo Only */}
			<div className='relative p-4 border-b border-gray-200 dark:border-gray-700'>
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
					className='h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg'>
					{isCollapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
				</Button>
			</div>

			{/* Navigation Menu - Icons Only */}
			<div className='flex-1 p-2 overflow-hidden'>
				<nav className='space-y-2'>
					{getNavigationItems(t, user?.role, tenant, user).map(
						(item) => {
							const isActive = pathname === item.url;
							return (
								<div key={item.title}>
									<Link
										href={item.url}
										className={cn(
											"group relative flex items-center justify-center rounded-lg transition-colors duration-200",
											"p-3",
											isActive && [
												"bg-gray-900 text-white",
											],
											!isActive &&
												"text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
										)}>
										<div className="flex items-center justify-center">
											<item.icon className='w-5 h-5' />
										</div>

										{/* Simple Tooltip */}
										<div className='absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200'>
											{item.title}
										</div>
									</Link>
								</div>
							);
						},
					)}
				</nav>
			</div>

			{/* Clean Footer - User Avatar Only */}
			<div className='p-3 border-t border-gray-200 dark:border-gray-700'>
				{session?.user && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="flex items-center justify-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group">
								<Avatar className='w-8 h-8'>
									<AvatarFallback className='bg-gradient-to-br from-primary to-primary/80 text-white font-semibold text-sm'>
										{session.user.firstName?.[0]}
										{session.user.lastName?.[0]}
									</AvatarFallback>
								</Avatar>
							</div>
						</DropdownMenuTrigger>

						<DropdownMenuContent
							align={isCollapsed ? "center" : "start"}
							className='w-44 sm:w-48'>
							<div className='p-3 sm:p-4 border-b border-gray-200'>
								<p className='font-medium text-gray-900 dark:text-white text-xs sm:text-sm'>
									{session.user.firstName} {session.user.lastName}
								</p>
								<p className='text-xs text-gray-500 dark:text-gray-400'>
									{session.user.email}
								</p>
								{user?.role && (
									<Badge
										variant='secondary'
										className='mt-1 text-xs bg-gray-100 text-gray-700'>
										{user.role}
									</Badge>
								)}
							</div>

							<DropdownMenuItem
								onClick={() => {
									const newTheme = currentTheme === "dark" ? "light" : "dark";
									setTheme(newTheme);
								}}
								className='cursor-pointer'>
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
								className='cursor-pointer'>
								<Home className='w-4 h-4 mr-2' />
								{t("ui.home")}
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							<DropdownMenuItem
								onClick={handleSignOut}
								className='cursor-pointer text-red-600 hover:bg-red-50'>
								<LogOut className='w-4 h-4 mr-2' />
								{t("ui.signOut")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
}
