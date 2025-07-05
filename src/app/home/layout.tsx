/** @format */

import { AppSidebar } from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className=''>
			<SidebarProvider>
				<AppSidebar />
				<main>
					<SidebarTrigger className='block md:hidden fixed top-4 left-4 z-50' />
					{children}
				</main>
			</SidebarProvider>
		</div>
	);
}

export default Layout;
