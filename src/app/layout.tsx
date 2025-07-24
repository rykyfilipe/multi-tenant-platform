/** @format */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import AlertMessage from "@/components/alert";

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
	title: "YDV – Your Data. Your View.",
	description:
		"YDV is a powerful multi-tenant platform for building customizable databases and dashboards. Control your data structure and visualize it your way.",
	icons: {
		icon: "/logo.png",
	},
	authors: [{ name: "YDV Platform", url: "https://ydv.app" }],
	creator: "YDV Team",
	keywords: [
		"multi-tenant",
		"custom database",
		"dashboard builder",
		"data management",
		"react",
		"next.js",
		"SaaS platform",
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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
				<AppProvider>
					<AlertMessage />
					{children}
				</AppProvider>
			</body>
		</html>
	);
}
