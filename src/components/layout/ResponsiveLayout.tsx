/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/Navbar";
import { MobileBottomNavigation } from "@/components/layout/MobileBottomNavigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, Bell, User } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";

interface ResponsiveLayoutProps {
	children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isTabletSidebarOpen, setIsTabletSidebarOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const pathname = usePathname();
	const { user, tenant } = useApp();
	const { t } = useLanguage();
	const { data: session } = useSession();

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		// Close mobile menu when route changes
		setIsMobileMenuOpen(false);
		setIsTabletSidebarOpen(false);
	}, [pathname]);

	if (!mounted) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	const handleSignOut = () => {
		signOut({ callbackUrl: "/" });
	};

	return (
		<SidebarProvider>
			<div className="min-h-screen bg-background">
				{/* Mobile Header */}
				<header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/20 md:hidden">
					<div className="flex items-center justify-between px-4 py-3">
						{/* Mobile Menu Button */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="h-10 w-10 p-0 mobile-touch-feedback"
						>
							{isMobileMenuOpen ? (
								<X className="h-5 w-5" />
							) : (
								<Menu className="h-5 w-5" />
							)}
						</Button>

						{/* Logo */}
						<div className="flex items-center space-x-2">
							<div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center border border-border/20">
								<svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
								</svg>
							</div>
							<span className="text-lg font-bold text-foreground">YDV</span>
						</div>

						{/* Mobile Actions */}
						<div className="flex items-center space-x-2">
							<Button variant="ghost" size="sm" className="h-10 w-10 p-0 mobile-touch-feedback">
								<Search className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="sm" className="h-10 w-10 p-0 mobile-touch-feedback">
								<Bell className="h-4 w-4" />
							</Button>
							{session?.user && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" className="h-10 w-10 p-0 mobile-touch-feedback">
											<Avatar className="h-8 w-8">
												<AvatarImage src={session.user?.image || undefined} alt="User" />
												<AvatarFallback className="text-xs">
													{(session.user as any)?.firstName?.[0] || session.user?.name?.[0] || "U"}
												</AvatarFallback>
											</Avatar>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56">
										<div className="flex items-center justify-start gap-2 p-2">
											<div className="flex flex-col space-y-1 leading-none">
												<p className="font-medium">
													{(session.user as any)?.firstName && (session.user as any)?.lastName
														? `${(session.user as any).firstName} ${(session.user as any).lastName}`
														: session.user?.name || "User"}
												</p>
												{session.user?.email && (
													<p className="w-[200px] truncate text-sm text-muted-foreground">
														{session.user.email}
													</p>
												)}
											</div>
										</div>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={() => setIsMobileMenuOpen(false)}>
											<User className="mr-2 h-4 w-4" />
											<span>Profile</span>
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
				</header>

				{/* Tablet Header */}
				<header className="hidden md:block lg:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/20">
					<div className="flex items-center justify-between px-6 py-4">
						{/* Tablet Menu Button */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsTabletSidebarOpen(!isTabletSidebarOpen)}
							className="h-10 w-10 p-0"
						>
							{isTabletSidebarOpen ? (
								<X className="h-5 w-5" />
							) : (
								<Menu className="h-5 w-5" />
							)}
						</Button>

						{/* Logo */}
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center border border-border/20">
								<svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
								</svg>
							</div>
							<span className="text-xl font-bold text-foreground">YDV</span>
						</div>

						{/* Tablet Actions */}
						<div className="flex items-center space-x-3">
							<Button variant="ghost" size="sm" className="h-10 px-4">
								<Search className="h-4 w-4 mr-2" />
								Search
							</Button>
							<Button variant="ghost" size="sm" className="h-10 w-10 p-0">
								<Bell className="h-4 w-4" />
							</Button>
							{session?.user && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" className="h-10 px-3">
											<Avatar className="h-8 w-8 mr-2">
												<AvatarImage src={session.user?.image || undefined} alt="User" />
												<AvatarFallback className="text-xs">
													{(session.user as any)?.firstName?.[0] || session.user?.name?.[0] || "U"}
												</AvatarFallback>
											</Avatar>
											<span className="text-sm font-medium">
												{(session.user as any)?.firstName || session.user?.name || "User"}
											</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56">
										<div className="flex items-center justify-start gap-2 p-2">
											<div className="flex flex-col space-y-1 leading-none">
												<p className="font-medium">
													{(session.user as any)?.firstName && (session.user as any)?.lastName
														? `${(session.user as any).firstName} ${(session.user as any).lastName}`
														: session.user?.name || "User"}
												</p>
												{session.user?.email && (
													<p className="w-[200px] truncate text-sm text-muted-foreground">
														{session.user.email}
													</p>
												)}
											</div>
										</div>
										<DropdownMenuSeparator />
										<DropdownMenuItem>
											<User className="mr-2 h-4 w-4" />
											<span>Profile</span>
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
				</header>

				{/* Desktop Header */}
				<header className="hidden lg:block sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/20">
					<div className="flex items-center justify-between px-8 py-4">
						{/* Desktop Logo */}
						<div className="flex items-center space-x-4">
							<div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center border border-border/20">
								<svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
								</svg>
							</div>
							<div>
								<h1 className="text-xl font-bold text-foreground">YDV Platform</h1>
								<p className="text-sm text-muted-foreground">Your Data, Your View</p>
							</div>
						</div>

						{/* Desktop Search */}
						<div className="flex-1 max-w-md mx-8">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<input
									type="text"
									placeholder="Search databases, tables, users..."
									className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
								/>
							</div>
						</div>

						{/* Desktop Actions */}
						<div className="flex items-center space-x-4">
							<Button variant="ghost" size="sm" className="h-10 w-10 p-0">
								<Bell className="h-4 w-4" />
							</Button>
							{session?.user && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" className="h-10 px-3">
											<Avatar className="h-8 w-8 mr-2">
												<AvatarImage src={session.user?.image || undefined} alt="User" />
												<AvatarFallback className="text-xs">
													{(session.user as any)?.firstName?.[0] || session.user?.name?.[0] || "U"}
												</AvatarFallback>
											</Avatar>
											<div className="text-left">
												<p className="text-sm font-medium">
													{(session.user as any)?.firstName || session.user?.name || "User"}
												</p>
												<p className="text-xs text-muted-foreground">
													{tenant?.name || "Organization"}
												</p>
											</div>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-64">
										<div className="flex items-center justify-start gap-3 p-3">
											<Avatar className="h-10 w-10">
												<AvatarImage src={session.user?.image || undefined} alt="User" />
												<AvatarFallback>
													{(session.user as any)?.firstName?.[0] || session.user?.name?.[0] || "U"}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col space-y-1 leading-none">
												<p className="font-medium">
													{(session.user as any)?.firstName && (session.user as any)?.lastName
														? `${(session.user as any).firstName} ${(session.user as any).lastName}`
														: session.user?.name || "User"}
												</p>
												<p className="text-sm text-muted-foreground">
													{session.user?.email}
												</p>
												<p className="text-xs text-muted-foreground">
													{tenant?.name || "Organization"}
												</p>
											</div>
										</div>
										<DropdownMenuSeparator />
										<DropdownMenuItem>
											<User className="mr-2 h-4 w-4" />
											<span>Profile Settings</span>
										</DropdownMenuItem>
										<DropdownMenuItem>
											<Bell className="mr-2 h-4 w-4" />
											<span>Notifications</span>
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
				</header>

				{/* Main Layout */}
				<div className="flex h-screen overflow-hidden">
					{/* Desktop Sidebar */}
					<div className="hidden lg:block">
						<AppSidebar />
					</div>

					{/* Tablet Sidebar Overlay */}
					<AnimatePresence>
						{isTabletSidebarOpen && (
							<>
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="fixed inset-0 z-50 bg-black/50 lg:hidden"
									onClick={() => setIsTabletSidebarOpen(false)}
								/>
								<motion.div
									initial={{ x: -300 }}
									animate={{ x: 0 }}
									exit={{ x: -300 }}
									transition={{ type: "spring", damping: 25, stiffness: 200 }}
									className="fixed left-0 top-0 z-50 h-full w-80 bg-card border-r border-border/20 shadow-xl lg:hidden"
								>
									<AppSidebar />
								</motion.div>
							</>
						)}
					</AnimatePresence>

					{/* Mobile Sidebar Overlay */}
					<AnimatePresence>
						{isMobileMenuOpen && (
							<>
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="fixed inset-0 z-50 bg-black/50 md:hidden"
									onClick={() => setIsMobileMenuOpen(false)}
								/>
								<motion.div
									initial={{ x: -300 }}
									animate={{ x: 0 }}
									exit={{ x: -300 }}
									transition={{ type: "spring", damping: 25, stiffness: 200 }}
									className="fixed left-0 top-0 z-50 h-full w-80 bg-card border-r border-border/20 shadow-xl md:hidden"
								>
									<AppSidebar />
								</motion.div>
							</>
						)}
					</AnimatePresence>

					{/* Main Content */}
					<main className="flex-1 overflow-auto relative">
						<div className="min-h-full">
							{/* Mobile Content Padding */}
							<div className="p-4 md:p-6 lg:p-8">
								{children}
							</div>
						</div>
					</main>
				</div>

				{/* Mobile Bottom Navigation */}
				<div className="md:hidden">
					<MobileBottomNavigation />
				</div>
			</div>
		</SidebarProvider>
	);
}
