/** @format */

import { AppSidebar } from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<div className='flex h-screen w-screen'>
				<AppSidebar />
				<main className='flex-1 overflow-auto w-full'>{children}</main>
			</div>
		</SidebarProvider>
	);
}

export default Layout;
