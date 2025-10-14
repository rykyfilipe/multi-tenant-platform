/** @format */

"use client";

import { AppSidebar, MobileBottomNavbar } from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { EditModeProvider, useEditMode } from "@/contexts/EditModeContext";

function LayoutContent({ children }: { children: React.ReactNode }) {
	const { isEditMode } = useEditMode();

	return (
		<SidebarProvider>
			<div className='flex h-screen w-screen overflow-hidden'>
				{/* Sidebar always visible on desktop (hidden on mobile via AppSidebar's own classes) */}
				<AppSidebar />
				<main className={`flex-1 overflow-auto w-full relative ${isEditMode ? 'pb-0' : 'pb-24 sm:pb-20 md:pb-0'}`}>
					<div className='min-h-full'>
						{children}
					</div>
				</main>
				{/* Mobile navbar hidden in edit mode */}
				<div className={isEditMode ? 'hidden' : 'block md:hidden'}>
					<MobileBottomNavbar />
				</div>
			</div>
		</SidebarProvider>
	);
}

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<DatabaseProvider>
			<EditModeProvider>
				<LayoutContent>{children}</LayoutContent>
			</EditModeProvider>
		</DatabaseProvider>
	);
}

export default Layout;
