/** @format */

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	BookOpen,
	HelpCircle,
	Globe,
	ArrowLeft,
	Search,
	Database,
	Shield,
	BarChart3,
	Settings,
	Users,
	Zap,
	FileText,
} from "lucide-react";

const DocsLayout = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname();
	const { t } = useLanguage();

	const navigation = [
		{
			title: t("docs.nav.gettingStarted.title") || "Getting Started",
			icon: <Zap className='w-4 h-4' />,
			items: [
				{
					title: "First Database",
					href: "/docs/getting-started/first-database",
					description: "Create your first database and table",
				},
				{
					title: "Dashboard Overview",
					href: "/docs/getting-started/dashboard",
					description: "Navigate the main dashboard",
				},
				{
					title: "User Management",
					href: "/docs/getting-started/user-management",
					description: "Invite users and manage roles",
				},
			],
		},
		{
			title: t("docs.nav.database.title") || "Database",
			icon: <Database className='w-4 h-4' />,
			items: [
				{
					title: "Schema Design",
					href: "/docs/database/schema-design",
					description: "Design efficient table structures",
				},
				{
					title: "Column Types",
					href: "/docs/database/column-types",
					description: "Understanding column configurations",
				},
				{
					title: "Import/Export",
					href: "/docs/database/import-export",
					description: "Data import and export guides",
				},
			],
		},
		{
			title: t("docs.nav.security.title") || "Security",
			icon: <Shield className='w-4 h-4' />,
			items: [
				{
					title: "Permissions",
					href: "/docs/security/permissions",
					description: "Role-based access control",
				},
				{
					title: "Encryption",
					href: "/docs/security/encryption",
					description: "Data security measures",
				},
				{
					title: "Audit Logs",
					href: "/docs/security/audit-logs",
					description: "Track user activities",
				},
			],
		},
		{
			title: t("docs.nav.performance.title") || "Performance",
			icon: <BarChart3 className='w-4 h-4' />,
			items: [
				{
					title: "Query Optimization",
					href: "/docs/performance/query-optimization",
					description: "Optimize database queries",
				},
				{
					title: "Caching",
					href: "/docs/performance/caching",
					description: "Implement caching strategies",
				},
				{
					title: "Monitoring",
					href: "/docs/performance/monitoring",
					description: "Track performance metrics",
				},
			],
		},
		{
			title: t("docs.nav.help.title") || "Help & Support",
			icon: <HelpCircle className='w-4 h-4' />,
			items: [
				{
					title: "Help Center",
					href: "/docs/help",
					description: "Find answers and support",
				},
				{
					title: "FAQ",
					href: "/docs/help#faq",
					description: "Frequently asked questions",
				},
				{
					title: "Contact Support",
					href: "/#contact",
					description: "Get help from our team",
				},
			],
		},
	];

	const isActive = (href: string) => {
		if (href === "/docs" && pathname === "/docs") return true;
		if (href !== "/docs" && pathname.startsWith(href)) return true;
		return false;
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<div className='border-b border-border/20 bg-card/90 backdrop-blur-2xl sticky top-0 z-40'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between h-16'>
						<div className='flex items-center space-x-4'>
							<Link href='/'>
								<Button
									variant='ghost'
									size='sm'
									className='flex items-center gap-2'>
									<ArrowLeft className='w-4 h-4' />
									{t("docs.nav.backToHome") || "Back to Home"}
								</Button>
							</Link>
							<div className='h-6 w-px bg-border' />
							<div className='flex items-center space-x-2'>
								<BookOpen className='w-5 h-5 text-primary' />
								<span className='text-lg font-semibold text-foreground'>
									{t("docs.nav.title") || "Documentation"}
								</span>
							</div>
						</div>

						<div className='flex items-center space-x-4'>
							<Link href='/docs/help'>
								<Button variant='ghost' size='sm'>
									<HelpCircle className='w-4 h-4 mr-2' />
									{t("docs.nav.help") || "Help"}
								</Button>
							</Link>
							<Link href='/docs/api'>
								<Button variant='ghost' size='sm'>
									<Globe className='w-4 h-4 mr-2' />
									{t("docs.nav.api") || "API"}
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
					{/* Sidebar Navigation */}
					<aside className='lg:col-span-1'>
						<div className='sticky top-24 space-y-6'>
							<Card>
								<CardContent className='p-4'>
									<div className='space-y-4'>
										{navigation.map((section, sectionIndex) => (
											<div key={sectionIndex} className='space-y-2'>
												<div className='flex items-center gap-2 text-sm font-semibold text-foreground'>
													{section.icon}
													{section.title}
												</div>
												<div className='ml-6 space-y-1'>
													{section.items.map((item, itemIndex) => (
														<Link
															key={itemIndex}
															href={item.href}
															className={`block text-sm transition-colors hover:text-foreground ${
																isActive(item.href)
																	? "text-primary font-medium"
																	: "text-muted-foreground"
															}`}>
															<div className='truncate'>{item.title}</div>
															<div className='text-xs text-muted-foreground truncate'>
																{item.description}
															</div>
														</Link>
													))}
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							{/* Quick Links */}
							<Card>
								<CardContent className='p-4'>
									<h3 className='font-semibold text-foreground mb-3'>
										{t("docs.nav.quickLinks") || "Quick Links"}
									</h3>
									<div className='space-y-2'>
										<Link
											href='/docs/help'
											className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'>
											<HelpCircle className='w-4 h-4' />
											{t("docs.nav.helpCenter") || "Help Center"}
										</Link>
										<Link
											href='/docs/api'
											className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'>
											<Globe className='w-4 h-4' />
											{t("docs.nav.apiDocs") || "API Documentation"}
										</Link>
										<Link
											href='/#contact'
											className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'>
											<FileText className='w-4 h-4' />
											{t("docs.nav.contact") || "Contact Support"}
										</Link>
									</div>
								</CardContent>
							</Card>
						</div>
					</aside>

					{/* Main Content */}
					<main className='lg:col-span-3'>{children}</main>
				</div>
			</div>
		</div>
	);
};

export default DocsLayout;
