/** @format */

"use client";

import { Database, Home, HousePlugIcon, Settings, Users } from "lucide-react";

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

const items = [
	{
		title: "Home",
		url: "/home/dashboard",
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
		title: "Settings",
		url: "/home/settings",
		icon: Settings,
	},
];

export function AppSidebar() {
	const { setToken, setUser } = useApp();
	const router = useRouter();

	const logout = async () => {
		try {
			const response = await fetch("/api/logout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Logout failed");
			}

			localStorage.removeItem("token");
			localStorage.removeItem("user");

			router.push("/");
		} catch (error) {
			console.error("Logout error:", error);
			alert("Logout failed. Please try again.");
		}
	};
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
				<Button onClick={logout}>Logout</Button>
			</SidebarFooter>
		</Sidebar>
	);
}
