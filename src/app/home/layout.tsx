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
					<div className='md:hidden fixed top-3 left-3 z-[9999]'>
						<SidebarTrigger className='h-9 w-9 sm:h-10 sm:w-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border border-border/50 shadow-lg hover:bg-background/90 transition-all duration-200' />
					</div>
					{children}
				</main>
			</div>
		</SidebarProvider>
	);
}

export default Layout;
