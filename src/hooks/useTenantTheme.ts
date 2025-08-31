/** @format */

import { useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useTenantTheme } from "@/contexts/ThemeContext";

export function useTenantThemeEffect() {
	const { tenant } = useApp();
	const { setTheme } = useTenantTheme();

	useEffect(() => {
		if (tenant?.theme) {
			setTheme(tenant.theme as "light" | "dark" | "system");
		}
	}, [tenant?.theme, setTheme]);
}
