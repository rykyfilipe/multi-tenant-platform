/** @format */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useApp } from "./AppContext";

type TenantTheme = "light" | "dark" | "system";

interface ThemeContextType {
	currentTheme: TenantTheme;
	setTheme: (theme: TenantTheme) => void;
	isSystemTheme: boolean;
	isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const { tenant, token } = useApp();
	const {
		theme,
		setTheme: setNextTheme,
		systemTheme,
		resolvedTheme,
	} = useTheme();
	const [currentTheme, setCurrentTheme] = useState<TenantTheme>("light");
	const [isSystemTheme, setIsSystemTheme] = useState(true);
	const [isInitialized, setIsInitialized] = useState(false);

	// Initialize theme from localStorage first to prevent flickering
	useEffect(() => {
		if (typeof window !== "undefined" && !isInitialized) {
			const savedTheme =
				(localStorage.getItem("theme") as TenantTheme) || "light";
			setCurrentTheme(savedTheme);
			setIsInitialized(true);
		}
	}, [isInitialized]);

	// Sync theme with database and update if different
	useEffect(() => {
		if (!isInitialized || !tenant?.theme || !token) return;

		const localStorageTheme =
			(localStorage.getItem("theme") as TenantTheme) || "light";
		const databaseTheme = tenant.theme as TenantTheme;

		// If localStorage theme is different from database theme, update database
		if (localStorageTheme !== databaseTheme) {
			updateDatabaseTheme(localStorageTheme);
		}

		// Only apply theme if it's different from current theme to avoid unnecessary updates
		if (localStorageTheme !== currentTheme) {
			setCurrentTheme(localStorageTheme);

			if (localStorageTheme === "system") {
				setIsSystemTheme(true);
				setNextTheme("system");
			} else {
				setIsSystemTheme(false);
				setNextTheme(localStorageTheme);
			}
		}
	}, [tenant?.theme, setNextTheme, isInitialized, token, currentTheme]);

	// Update database theme
	const updateDatabaseTheme = async (newTheme: TenantTheme) => {
		if (!tenant?.id || !token) return;

		try {
			const response = await fetch(`/api/tenants/${tenant.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ theme: newTheme }),
			});

			if (!response.ok) {
				console.warn("Failed to update theme in database");
			}
		} catch (error) {
			console.error("Error updating theme in database:", error);
		}
	};

	const setTheme = (newTheme: TenantTheme) => {
		// Save to localStorage immediately
		if (typeof window !== "undefined") {
			localStorage.setItem("theme", newTheme);
		}

		setCurrentTheme(newTheme);

		if (newTheme === "system") {
			setIsSystemTheme(true);
			setNextTheme("system");
		} else {
			setIsSystemTheme(false);
			setNextTheme(newTheme);
		}

		// Update database theme if user is admin
		if (tenant && token) {
			updateDatabaseTheme(newTheme);
		}
	};

	// Determine if we're in dark mode using resolvedTheme for better accuracy
	const isDarkMode = resolvedTheme === "dark";

	const value: ThemeContextType = {
		currentTheme,
		setTheme,
		isSystemTheme,
		isDarkMode,
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTenantTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTenantTheme must be used within a ThemeProvider");
	}
	return context;
}
