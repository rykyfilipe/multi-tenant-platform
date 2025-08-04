/** @format */

// app/providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<SessionProvider>
				<div className="dark">
					{children}
				</div>
			</SessionProvider>
		);
	}

	return (
		<SessionProvider>
			<ThemeProvider
				attribute='class'
				defaultTheme='light'
				enableSystem={false}
				disableTransitionOnChange>
				{children}
			</ThemeProvider>
		</SessionProvider>
	);
}
