/** @format */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AlertMessage from "@/components/alert";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Fonturi Google
const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL("https://ydv.app"),
	title: "YDV - Multi-Tenant Database Platform",

	description:
		"Build customizable databases with YDV. Multi-tenant SaaS platform for data control & management. Try YDV today!",
	icons: {
		icon: "/logo.png",
	},
	authors: [
		{
			name: "YDV Team",
			url: "https://ydv.app",
		},
	],
	keywords: [
		"customizable platform",
		"multi-tenant SaaS",
		"database management",
		"data visualization",
		"business intelligence",
		"platform builder",
		"React platform",
		"Next.js platform",
		"database SaaS",
		"custom platform",
		"data analytics",
		"business platform",
		"startup platform",
		"enterprise platform",
		"data management platform",
		"visualize your data your way",
		"custom platform without coding",
		"control your database structure",
		"secure multi-tenant architecture",
		"scalable SaaS platform",
		"build platform fast",
		"modern data visualization SaaS",
		"React platform builder",
		"Next.js platform",
		"JavaScript platform app",
		"React SaaS platform",
		"Tailwind platform UI",
		"Prisma database management",
		"PostgreSQL multi-tenant app",
		"API driven platform",
		"GraphQL data visualization",
		"REST API platform builder",
		"Customizable Platform for Your Data",
		"how to build a multi-tenant platform",
		"best multi-tenant SaaS platform",
		"custom database platform builder",
		"create your own BI platform",
		"best platform builder for startups",
		"how to create a data visualization platform",
		"multi-tenant SaaS for database management",
		"drag and drop platform SaaS",
		"build platform with React and Next.js",
		"customizable SaaS platform for data",
		"what is a multi-tenant architecture",
		"how to build a SaaS platform",
		"why multi-tenant SaaS is important",
		"top platform builders in 2025",
		"best database visualization tools",
		"advantages of customizable platforms",
		"data analytics trends for 2025",
		"how to scale a SaaS app",
	],

	openGraph: {
		title: "YDV – Your Data. Your View.",
		description:
			"Build, manage, and control your data the way you want. YDV lets you create flexible database structures with full control.",
		url: "https://ydv.app",
		siteName: "YDV Platform",
		locale: "en_US",
		type: "website",
		images: [
			{
				url: "/opengraph-image.png", // Pune o imagine 1200x630 în /public
				width: 1200,
				height: 630,
				alt: "YDV – Your Data. Your View.",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "YDV – Your Data. Your View.",
		description:
			"A multi-tenant platform for custom databases. Full control, full visibility.",
		images: ["/opengraph-image.png"],
		creator: "@ydvapp", // poți schimba când ai cont real Twitter
	},
	manifest: "/site.webmanifest", // opțional, dacă ai PWA setup
};
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import CookieBanner from "@/components/CookieBanner";
import { PerformanceDashboard } from "@/components/dev/PerformanceDashboard";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								try {
									// Get theme from localStorage or default to light
									var theme = localStorage.getItem('theme') || 'light';
									var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
									
									// Apply theme immediately to prevent flickering
									if (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) {
										document.documentElement.classList.add('dark');
									} else {
										document.documentElement.classList.remove('dark');
									}
									
									// Set cursor based on theme
									var cursor = theme === 'dark' || (theme === 'system' && systemTheme === 'dark') 
										? 'url("/cursor-white.svg"), auto' 
										: 'url("/cursor-black.png"), auto';
									document.documentElement.style.setProperty('--cursor', cursor);
									
									// Listen for theme changes in localStorage
									window.addEventListener('storage', function(e) {
										if (e.key === 'theme') {
											var newTheme = e.newValue || 'light';
											var newSystemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
											
											if (newTheme === 'dark' || (newTheme === 'system' && newSystemTheme === 'dark')) {
												document.documentElement.classList.add('dark');
											} else {
												document.documentElement.classList.remove('dark');
											}
											
											var newCursor = newTheme === 'dark' || (newTheme === 'system' && newSystemTheme === 'dark') 
												? 'url("/cursor-white.svg"), auto' 
												: 'url("/cursor-black.png"), auto';
											document.documentElement.style.setProperty('--cursor', newCursor);
										}
									});
								} catch (e) {
									// Fallback to light theme if there's an error
									document.documentElement.classList.remove('dark');
									document.documentElement.style.setProperty('--cursor', 'url("/cursor-black.png"), auto');
								}
							})();
						`,
					}}
				/>
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden min-h-screen`}
				suppressHydrationWarning>
				<Providers>
					<ErrorBoundary>
						<AlertMessage />
						{children}
						<Analytics />
						<SpeedInsights />
						<CookieBanner />
					</ErrorBoundary>
				</Providers>
			</body>
		</html>
	);
}
