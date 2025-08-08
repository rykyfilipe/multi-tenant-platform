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
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarHeader,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { useApp } from "@/contexts/AppContext";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useTheme } from "next-themes";

const getNavigationItems = (userRole?: string) => [
	{
		title: "Analytics",
		url: "/home/dashboard",
		icon: BarChart3,
		description: "Detailed analytics and charts",
	},
	{
		title: "Organization Management",
		url: "/home/tenant",
		icon: Building2,
		description: "Manage your organization",
	},
	{
		title: userRole === "ADMIN" ? "User Management" : "Team Members",
		url: "/home/users",
		icon: Users,
		description:
			userRole === "ADMIN"
				? "Team members and permissions"
				: "View your team members",
	},
	{
		title: "Database",
		url: "/home/database",
		icon: Database,
		description: "Data tables and schemas",
	},
	{
		title: "Public API",
		url: "/home/public-api",
		icon: Zap,
		description: "API tokens and documentation",
	},
	{
		title: "Settings",
		url: "/home/settings",
		icon: Settings,
		description: "Application configuration",
	},
];

export function AppSidebar() {
	const { setToken, setUser, user } = useApp();
	const router = useRouter();
	const pathname = usePathname();
	const { data: session } = useSession();
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	const handleSignOut = async () => {
		await signOut({ callbackUrl: "/" });
		setToken(null);
		setUser(null);
	};

	return (
		<Sidebar className='border-r border-border/20 bg-background'>
			<SidebarHeader className='p-4 sm:p-6 border-b border-border/20'>
				<div className='flex items-center space-x-2 sm:space-x-3'>
					<div className='w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center'>
						<Database className='w-3 h-3 sm:w-4 sm:h-4 text-primary' />
					</div>
					<span className='text-base sm:text-lg font-semibold text-foreground'>
						YDV
					</span>
				</div>
			</SidebarHeader>

			<SidebarContent className='p-2 sm:p-4'>
				<SidebarMenu>
					{getNavigationItems(user?.role).map((item) => {
						const isActive = pathname === item.url;
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									className={`w-full ${
										isActive
											? "bg-primary/10 text-primary border-r-2 border-primary"
											: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
									}`}>
									<Link
										href={item.url}
										className='flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors'>
										<item.icon className='w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0' />
										<span className='text-xs sm:text-sm font-medium truncate'>
											{item.title}
										</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarContent>

			<SidebarFooter className='p-2 sm:p-4 border-t border-border/20'>
				<div className='space-y-2 sm:space-y-3'>
					{/* User Profile */}
					{session?.user && (
						<div className='flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-muted/30 rounded-lg'>
							<Avatar className='w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0'>
								<AvatarImage src={session.user.image || undefined} />
								<AvatarFallback className='text-xs font-medium'>
									{session.user.firstName?.[0]}
									{session.user.lastName?.[0]}
								</AvatarFallback>
							</Avatar>
							<div className='flex-1 min-w-0'>
								<p className='text-xs sm:text-sm font-medium text-foreground truncate'>
									{session.user.firstName} {session.user.lastName}
								</p>
								<p className='text-xs text-muted-foreground truncate hidden sm:block'>
									{session.user.email}
								</p>
							</div>
						</div>
					)}

					{/* Actions */}
					<div className='flex space-x-1 sm:space-x-2'>
						<Button
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							variant='ghost'
							size='sm'
							className='flex-1 h-8 sm:h-9'>
							{theme === "dark" ? (
								<Sun className='w-3 h-3 sm:w-4 sm:h-4' />
							) : (
								<Moon className='w-3 h-3 sm:w-4 sm:h-4' />
							)}
						</Button>
						<Button
							onClick={() => (window.location.href = "/")}
							variant='ghost'
							size='sm'
							className='flex-1 h-8 sm:h-9'>
							<LogOut className='w-3 h-3 sm:w-4 sm:h-4' />
						</Button>
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
