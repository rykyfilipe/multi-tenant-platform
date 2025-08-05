/** @format */

import { AppSidebar } from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<div className='flex h-screen w-screen'>
				<AppSidebar />
				<main className='flex-1 overflow-auto w-full relative'>
					{/* Mobile trigger button - elegant and visible */}
					<div className='md:hidden fixed top-4 left-4 z-[9999]'>
						<SidebarTrigger className='h-10 w-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200' />
					</div>
					{children}
				</main>
			</div>
		</SidebarProvider>
	);
}

export default Layout;
