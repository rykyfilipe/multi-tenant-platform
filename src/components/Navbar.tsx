/** @format */

"use client";

import {
	AppWindow,
	Database,
	DatabaseZapIcon,
	Home,
	HousePlugIcon,
	Settings,
	Users,
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
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useApp } from "@/contexts/AppContext";
import { signOut } from "next-auth/react";

const items = [
	{
		title: "Home",
		url: "/home",
		icon: Home,
	},
	{
		title: "Tenant",
		url: "/home/tenant",
		icon: HousePlugIcon,
	},

	{
		title: "Users",
		url: "/home/users",
		icon: Users,
	},
	{
		title: "Database",
		url: "/home/database",
		icon: Database,
	},
	{
		title: "Public API",
		url: "/home/public-api",
		icon: DatabaseZapIcon,
	},

	{
		title: "Settings",
		url: "/home/settings",
		icon: Settings,
	},
];

export function AppSidebar() {
	const { setToken, setUser } = useApp();
	const router = useRouter();

	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Application</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<Link href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<Button
					onClick={() => router.push("/")}
					className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium'>
					Go to Home Page
				</Button>
				<Button
					onClick={() => {
						signOut({ callbackUrl: "/" });
					}}>
					Logout
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}
