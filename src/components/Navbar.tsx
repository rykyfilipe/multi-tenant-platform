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
		url: "/home/dashboard",
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

// Navigation items pentru mobile (mai puține pentru spațiu limitat)
const getMobileNavigationItems = (
	t: (key: string) => string,
	userRole?: string,
	tenant?: any,
	user?: any,
) => [
	{
		title: t("nav.analytics"),
		url: "/home/dashboard",
		icon: BarChart3,
	},
	{
		title: t("nav.organization"),
		url: "/home/tenant",
		icon: Building2,
	},
	{
		title: t("nav.database"),
		url: "/home/database",
		icon: Database,
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
	// Development tools for admins
	...(user?.role === "ADMIN" && process.env.NODE_ENV === "development"
		? [
				{
					title: "Dev Tools",
					url: "/home/dev",
					icon: Code,
				},
		  ]
		: []),
];

// Mobile Bottom Navigation Bar
export function MobileBottomNavbar() {
	const { user, tenant, token, setTenant } = useApp();
	const { t } = useLanguage();
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
			{/* Background with premium glass effect */}
			<div className='premium-glass border-t border-border shadow-2xl'>
				{/* Main navigation */}
				<div className='flex items-center justify-around px-2 py-2'>
					{getMobileNavigationItems(t, user?.role, tenant, user).map((item) => {
						const isActive = pathname === item.url;
						return (
							<Link
								key={item.title}
								href={item.url}
								className={cn(
									"flex items-center justify-center p-2.5 rounded-xl premium-interaction",
									"hover:bg-primary/10 active:scale-95",
									isActive
										? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
										: "text-muted-foreground hover:text-foreground",
								)}>
								<item.icon className='w-5 h-5' />
							</Link>
						);
					})}

					{/* User Profile Menu */}
					{session?.user && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className='flex items-center justify-center p-2.5 rounded-xl premium-interaction hover:bg-primary/10 active:scale-95 text-muted-foreground hover:text-foreground'>
									<Avatar className='w-5 h-5'>
										<AvatarImage src={session.user.image || undefined} />
										<AvatarFallback className='bg-primary text-primary-foreground text-xs'>
											{session.user.firstName?.[0]}
											{session.user.lastName?.[0]}
										</AvatarFallback>
									</Avatar>
								</button>
							</DropdownMenuTrigger>

							<DropdownMenuContent
								align='end'
								side='top'
								className='mb-2 professional-card shadow-xl'>
								<div className='premium-padding-sm border-b border-border'>
									<p className='font-medium text-foreground text-sm'>
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
									onClick={async () => {
										const newTheme = currentTheme === "dark" ? "light" : "dark";

										// Update localStorage immediately for instant feedback
										if (typeof window !== "undefined") {
											localStorage.setItem("theme", newTheme);
										}

										setTheme(newTheme);

										// Update tenant theme in database if user is admin
										if (user?.role === "ADMIN" && tenant?.id) {
											try {
												const response = await fetch(
													`/api/tenants/${tenant.id}`,
													{
														method: "PATCH",
														headers: {
															"Content-Type": "application/json",
															Authorization: `Bearer ${token}`,
														},
														body: JSON.stringify({ theme: newTheme }),
													},
												);

												if (response.ok) {
													const updatedTenant = await response.json();
													// Update local tenant state
													setTenant(updatedTenant);
												}
											} catch (error) {
												console.error("Failed to update tenant theme:", error);
											}
										}
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
									onClick={handleSignOut}
									className='cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 premium-interaction'>
									<LogOut className='w-4 h-4 mr-2' />
									{t("ui.signOut")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
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

	const handleSignOut = async () => {
		router.push("/");
	};

	const toggleSidebar = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<div
			className={cn(
				"relative flex flex-col h-full transition-all duration-300 ease-in-out",
				"border-r shadow-xl",
				// Light theme
				"bg-white border-black/10 shadow-black/10",
				// Dark theme
				"dark:bg-black dark:border-white/10 dark:shadow-white/5",
				isCollapsed ? "w-16" : "w-64",
				// Ascuns pe mobile
				"hidden md:flex",
			)}>
			{/* Premium Header */}
			<div className='relative p-4 border-b border-black/10 dark:border-white/10'>
				<div
					className={cn(
						"flex items-center transition-all duration-300",
						isCollapsed ? "justify-center" : "justify-between",
					)}>
					<div
						className={cn(
							"flex items-center transition-all duration-300",
							isCollapsed ? "space-x-0" : "space-x-3",
						)}>
						<TenantLogo size='lg' showText={false} />
						{!isCollapsed && (
							<p className='text-xs text-gray-600 dark:text-gray-300 mt-0.5'>
								{tenant?.name}
							</p>
						)}
					</div>

					{/* Toggle Button */}
					{!isCollapsed && (
						<Button
							onClick={toggleSidebar}
							variant='ghost'
							size='sm'
							className='h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white premium-hover-subtle rounded-lg'>
							<ChevronLeft className='h-4 w-4' />
						</Button>
					)}
				</div>
			</div>

			{/* Expand Button when collapsed */}
			{isCollapsed && (
				<div className='flex justify-center pt-2 pb-1'>
					<Button
						onClick={toggleSidebar}
						variant='ghost'
						size='sm'
						className='h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white premium-hover-subtle rounded-lg'>
						<ChevronRight className='h-4 w-4' />
					</Button>
				</div>
			)}

			{/* Navigation Menu */}
			<div className='flex-1 p-2 overflow-hidden'>
				<nav className='premium-spacing-xs'>
					{getNavigationItems(t, user?.role, tenant, user).map((item) => {
						const isActive = pathname === item.url;
						return (
							<Link
								key={item.title}
								href={item.url}
								className={cn(
									"group relative flex items-center rounded-xl premium-interaction",
									"hover:bg-black/5 dark:hover:bg-white/10 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5",
									isCollapsed ? "p-2 justify-center" : "p-2 space-x-2",
									isActive && [
										"bg-gradient-to-r from-black/10 via-black/8 to-black/5 dark:from-white/20 dark:via-white/15 dark:to-white/10",
										"border-l-2 border-gray-900 dark:border-white shadow-lg shadow-black/10 dark:shadow-white/10",
										"text-gray-900 dark:text-white",
									],
									!isActive &&
										"text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
								)}>
								<div
									className={cn(
										"flex-shrink-0 p-1.5 rounded-lg premium-interaction",
										isActive &&
											"bg-gray-900/10 dark:bg-white/20 text-gray-900 dark:text-white shadow-sm",
										!isActive &&
											"group-hover:bg-black/5 dark:group-hover:bg-white/10",
									)}>
									<item.icon className='w-4 h-4' />
								</div>

								{!isCollapsed && (
									<div className='flex-1 min-w-0'>
										<p className='font-medium text-sm truncate'>{item.title}</p>
										<p className='text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 leading-tight'>
											{item.description}
										</p>
									</div>
								)}

								{/* Tooltip for collapsed state */}
								{isCollapsed && (
									<div className='absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 premium-interaction pointer-events-none whitespace-nowrap z-50 border border-gray-700 dark:border-gray-600'>
										<div className='font-medium text-sm'>{item.title}</div>
										<div className='text-xs text-gray-300 dark:text-gray-400 mt-1'>
											{item.description}
										</div>
										<div className='absolute top-1/2 -left-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-b border-gray-700 dark:border-gray-600 rotate-45 transform -translate-y-1/2'></div>
									</div>
								)}
							</Link>
						);
					})}
				</nav>
			</div>

			{/* Premium Footer - Interactive User Menu */}
			<div className='p-3 border-t border-black/10 dark:border-white/10'>
				{session?.user && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div
								className={cn(
									"flex items-center cursor-pointer p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200",
									isCollapsed ? "justify-center" : "space-x-3",
								)}>
								<Avatar className='w-8 h-8 flex-shrink-0'>
									<AvatarImage src={session.user.image || undefined} />
									<AvatarFallback className='bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 text-white dark:text-gray-900 font-semibold text-xs'>
										{session.user.firstName?.[0]}
										{session.user.lastName?.[0]}
									</AvatarFallback>
								</Avatar>
								{!isCollapsed && (
									<div className='flex-1 min-w-0'>
										<p className='font-medium text-gray-900 dark:text-white truncate text-xs leading-tight'>
											{session.user.firstName} {session.user.lastName}
										</p>
										<p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
											{user?.role === "ADMIN"
												? t("common.admin")
												: t("common.user")}
										</p>
									</div>
								)}
							</div>
						</DropdownMenuTrigger>

						<DropdownMenuContent
							align={isCollapsed ? "center" : "start"}
							className='w-48 professional-card shadow-xl'>
							<div className='premium-padding-sm border-b border-black/5 dark:border-white/10'>
								<p className='font-medium text-gray-900 dark:text-white text-sm'>
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
								onClick={async () => {
									const newTheme = currentTheme === "dark" ? "light" : "dark";

									// Update localStorage immediately for instant feedback
									if (typeof window !== "undefined") {
										localStorage.setItem("theme", newTheme);
									}

									setTheme(newTheme);

									// Update tenant theme in database if user is admin
									if (user?.role === "ADMIN" && tenant?.id) {
										try {
											const response = await fetch(
												`/api/tenants/${tenant.id}`,
												{
													method: "PATCH",
													headers: {
														"Content-Type": "application/json",
														Authorization: `Bearer ${token}`,
													},
													body: JSON.stringify({ theme: newTheme }),
												},
											);

											if (response.ok) {
												const updatedTenant = await response.json();
												// Update local tenant state
												setTenant(updatedTenant);
											}
										} catch (error) {
											console.error("Failed to update tenant theme:", error);
										}
									}
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
								onClick={handleSignOut}
								className='cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 focus:text-red-700 dark:focus:text-red-300 premium-interaction'>
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
