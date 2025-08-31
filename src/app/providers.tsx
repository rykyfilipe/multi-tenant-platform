/** @format */

// app/providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState } from "react";
import { AppProvider } from "@/contexts/AppContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Theme sync wrapper to prevent flickering
function ThemeSyncWrapper({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// Small delay to ensure theme is applied from the script
		const timer = setTimeout(() => {
			setMounted(true);
		}, 50);

		return () => clearTimeout(timer);
	}, []);

	// Don't render children until theme is synced
	if (!mounted) {
		return (
			<div className='min-h-screen bg-background text-foreground'>
				{/* Loading placeholder that matches the theme */}
			</div>
		);
	}

	return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<NextThemesProvider
				attribute='class'
				defaultTheme='system'
				enableSystem={true}
				disableTransitionOnChange={true}
				storageKey='theme'>
				<AppProvider>
					<LanguageProvider>
						<ThemeProvider>
							<ThemeSyncWrapper>{children}</ThemeSyncWrapper>
						</ThemeProvider>
					</LanguageProvider>
				</AppProvider>
			</NextThemesProvider>
		</SessionProvider>
	);
}
