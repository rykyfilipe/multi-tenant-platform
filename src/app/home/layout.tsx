/** @format */

import { AppSidebar } from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className=''>
			<SidebarProvider>
				<AppSidebar />
				<main className=' max-w-screen-lg w-screen  md:min-w-[calc(100%-16rem)] '>
					<SidebarTrigger className='block md:hidden fixed  z-50' />
					{children}
				</main>
			</SidebarProvider>
		</div>
	);
}

export default Layout;
