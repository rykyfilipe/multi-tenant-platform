/** @format */

"use client";

import { AppSidebar, MobileBottomNavbar } from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DatabaseProvider } from "@/contexts/DatabaseContext";

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<DatabaseProvider>
			<SidebarProvider>
				<div className='flex h-screen w-screen overflow-hidden'>
					<AppSidebar />
					<main className='flex-1 overflow-auto w-full relative pb-20 sm:pb-16 md:pb-0'>
						<div className='min-h-full'>
							{children}
						</div>
					</main>
					<MobileBottomNavbar />
				</div>
			</SidebarProvider>
		</DatabaseProvider>
	);
}

export default Layout;
