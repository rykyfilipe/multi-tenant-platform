/** @format */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import AlertMessage from "@/components/alert";
import ErrorBoundary from "@/components/ErrorBoundary";

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
	title: "YDV - Customizable Data Dashboards & Multi-Tenant Database Platform",

	description:
		"Build customizable databases & dashboards with YDV. Multi-tenant SaaS platform for data control & visualization. Try YDV today!",
	icons: {
		icon: "/logo.png",
	},
	authors: [{ name: "YDV Platform", url: "https://ydv.digital" }],
	creator: "YDV Team",
	keywords: [
		"multi-tenant",
		"multi-tenant SaaS",
		"multi-tenant architecture",
		"multi-tenant platform",
		"custom database",
		"customizable dashboards",
		"dashboard builder",
		"dashboard builder online",
		"database management platform",
		"data management",
		"data visualization tools",
		"data control and visualization",
		"build your own dashboard",
		"create custom dashboards",
		"drag and drop dashboard builder",
		"custom database solution",
		"data analytics dashboard",
		"business intelligence dashboards",
		"dynamic dashboards for business",
		"real-time data dashboards",
		"data modeling tool",
		"no-code dashboard builder",
		"low-code SaaS platform",
		"SaaS platform",
		"SaaS for small businesses",
		"SaaS for enterprises",
		"data dashboard for startups",
		"custom reporting tool",
		"BI dashboards for companies",
		"business data management system",
		"enterprise dashboard platform",
		"custom KPI dashboards",
		"visualize your data your way",
		"custom dashboards without coding",
		"control your database structure",
		"secure multi-tenant architecture",
		"scalable SaaS dashboard",
		"build dashboards fast",
		"modern data visualization SaaS",
		"React dashboard builder",
		"Next.js dashboard platform",
		"JavaScript dashboard app",
		"React SaaS platform",
		"Tailwind dashboard UI",
		"Prisma database management",
		"PostgreSQL multi-tenant app",
		"API driven dashboard",
		"GraphQL data visualization",
		"REST API dashboard builder",
		"Customizable Dashboards for Your Data",
		"how to build a multi-tenant dashboard",
		"best multi-tenant SaaS platform",
		"custom database dashboard builder",
		"create your own BI dashboard",
		"best dashboard builder for startups",
		"how to create a data visualization dashboard",
		"multi-tenant SaaS for database management",
		"drag and drop dashboard SaaS",
		"build dashboards with React and Next.js",
		"customizable SaaS platform for data",
		"what is a multi-tenant architecture",
		"how to build a SaaS dashboard",
		"why multi-tenant SaaS is important",
		"top dashboard builders in 2025",
		"best database visualization tools",
		"advantages of customizable dashboards",
		"data analytics trends for 2025",
		"how to scale a SaaS app",
	],

	openGraph: {
		title: "YDV – Your Data. Your View.",
		description:
			"Build, manage, and visualize your data the way you want. YDV lets you create flexible database structures and dashboards with full control.",
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
			"A multi-tenant platform for custom databases and dashboards. Full control, full visibility.",
		images: ["/opengraph-image.png"],
		creator: "@ydvapp", // poți schimba când ai cont real Twitter
	},
	manifest: "/site.webmanifest", // opțional, dacă ai PWA setup
};
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
				suppressHydrationWarning>
				<Providers>
					<ErrorBoundary>
						<AppProvider>
							<AlertMessage />
							{children}
							<Analytics />
						</AppProvider>
					</ErrorBoundary>
				</Providers>
			</body>
		</html>
	);
}
