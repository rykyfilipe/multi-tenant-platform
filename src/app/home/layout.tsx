/** @format */

import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";

function Layout({ children }: { children: React.ReactNode }) {
	return <ResponsiveLayout>{children}</ResponsiveLayout>;
}

export default Layout;
