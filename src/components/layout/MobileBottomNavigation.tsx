/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "next-auth/react";
import {
	Database,
	BarChart3,
	Users,
	Settings,
	FileText,
	Plus,
	Home,
	Building2,
	Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

// Navigation items for mobile (essential only for limited space)
const getMobileNavigationItems = (
	t: (key: string) => string,
	userRole?: string,
	tenant?: any,
	user?: any,
) => [
	{
		title: t("nav.home"),
		url: "/home/analytics",
		icon: Home,
		description: t("nav.home.description"),
	},
	{
		title: t("nav.database"),
		url: "/home/database",
		icon: Database,
		description: t("nav.database.description"),
	},
	{
		title: t("nav.analytics"),
		url: "/home/analytics",
		icon: BarChart3,
		description: t("nav.analytics.description"),
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
					title: "Dev",
					url: "/home/dev",
					icon: Code,
					description: "Development tools",
				},
		  ]
		: []),
];

export function MobileBottomNavigation() {
	const { user, tenant } = useApp();
	const { t } = useLanguage();
	const pathname = usePathname();
	const { data: session } = useSession();
	const [mounted, setMounted] = useState(false);
	const [showFAB, setShowFAB] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		// Show FAB on scroll
		const handleScroll = () => {
			setShowFAB(window.scrollY > 100);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	if (!mounted) {
		return null;
	}

	const handleSignOut = () => {
		signOut({ callbackUrl: "/" });
	};

	const navigationItems = getMobileNavigationItems(t, user?.role, tenant, user);

	// Limit to 5 items for mobile bottom nav
	const visibleItems = navigationItems.slice(0, 5);
	const hasMoreItems = navigationItems.length > 5;

	return (
		<>
			{/* Mobile Bottom Navigation */}
			<div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
				{/* Background with blur effect */}
				<div className="bg-card/95 backdrop-blur-xl border-t border-border/20 shadow-lg">
					{/* Main navigation */}
					<div className="flex items-center justify-around px-2 py-2">
						{visibleItems.map((item) => {
							const isActive = pathname === item.url;
							return (
								<div key={item.title} className="flex-shrink-0">
									<Link
										href={item.url}
										className={cn(
											"flex flex-col items-center justify-center p-2 rounded-xl min-w-0 transition-all duration-200",
											"w-16 h-16", // Fixed size for consistency
											isActive
												? "bg-primary text-primary-foreground shadow-lg scale-105"
												: "text-muted-foreground hover:text-foreground hover:bg-muted/50",
											"mobile-touch-feedback"
										)}
									>
										<div className="flex items-center justify-center mb-1">
											<item.icon className="w-5 h-5" />
										</div>
										<span className="text-xs font-medium truncate max-w-full">
											{item.title}
										</span>
									</Link>
								</div>
							);
						})}

						{/* More Menu */}
						{hasMoreItems && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="flex flex-col items-center justify-center p-2 rounded-xl w-16 h-16 mobile-touch-feedback"
									>
										<div className="flex items-center justify-center mb-1">
											<Settings className="w-5 h-5" />
										</div>
										<span className="text-xs font-medium">More</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="center"
									side="top"
									className="w-56 mb-2"
								>
									{navigationItems.slice(5).map((item) => (
										<DropdownMenuItem key={item.title} asChild>
											<Link
												href={item.url}
												className="flex items-center w-full"
											>
												<item.icon className="mr-2 h-4 w-4" />
												<span>{item.title}</span>
											</Link>
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						)}

						{/* User Profile Menu */}
						{session?.user && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="flex flex-col items-center justify-center p-2 rounded-xl w-16 h-16 mobile-touch-feedback"
									>
										<div className="flex items-center justify-center mb-1">
											<Avatar className="h-6 w-6">
												<AvatarImage
													src={session.user?.image || undefined}
													alt="User"
												/>
												<AvatarFallback className="text-xs">
													{(session.user as any)?.firstName?.[0] ||
														session.user?.name?.[0] ||
														"U"}
												</AvatarFallback>
											</Avatar>
										</div>
										<span className="text-xs font-medium">Profile</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="center"
									side="top"
									className="w-64 mb-2"
								>
									<div className="flex items-center justify-start gap-3 p-3">
										<Avatar className="h-10 w-10">
											<AvatarImage
												src={session.user?.image || undefined}
												alt="User"
											/>
											<AvatarFallback>
												{(session.user as any)?.firstName?.[0] ||
													session.user?.name?.[0] ||
													"U"}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col space-y-1 leading-none">
											<p className="font-medium">
												{(session.user as any)?.firstName &&
												(session.user as any)?.lastName
													? `${(session.user as any).firstName} ${
															(session.user as any).lastName
													  }`
													: session.user?.name || "User"}
											</p>
											<p className="text-sm text-muted-foreground">
												{session.user?.email}
											</p>
											{tenant?.name && (
												<p className="text-xs text-muted-foreground">
													{tenant.name}
												</p>
											)}
										</div>
									</div>
									<DropdownMenuSeparator />
									<DropdownMenuItem>
										<Settings className="mr-2 h-4 w-4" />
										<span>Settings</span>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Building2 className="mr-2 h-4 w-4" />
										<span>Organization</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleSignOut}>
										<span>Sign Out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
			</div>

			{/* Floating Action Button */}
			<AnimatePresence>
				{showFAB && (
					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						transition={{ type: "spring", damping: 20, stiffness: 300 }}
						className="fixed bottom-20 right-4 z-40 md:hidden"
					>
						<Button
							size="lg"
							className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl mobile-touch-feedback"
						>
							<Plus className="h-6 w-6" />
						</Button>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Bottom padding for mobile navigation */}
			<div className="h-20 md:hidden" />
		</>
	);
}
