/** @format */

"use client";

import { DatabaseProvider } from "@/contexts/DatabaseContext";

function DatabaseLayout({ children }: { children: React.ReactNode }) {
	return <DatabaseProvider>{children}</DatabaseProvider>;
}

export default DatabaseLayout;
