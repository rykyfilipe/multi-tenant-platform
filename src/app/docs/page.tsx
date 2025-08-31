/** @format */

"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	BookOpen,
	HelpCircle,
	Globe,
	Database,
	Shield,
	BarChart3,
	Zap,
	Users,
	FileText,
	Search,
	ArrowRight,
	Star,
	Clock,
	CheckCircle,
} from "lucide-react";

const DocsIndexPage = () => {
	const { t } = useLanguage();

	const docSections = [
		{
			title: t("docs.index.gettingStarted.title"),
			description: t("docs.index.gettingStarted.description"),
			icon: <Zap className='w-8 h-8' />,
			iconBg: "from-blue-500/10 to-cyan-500/10",
			iconColor: "text-blue-600",
			articles: [
				{
					title: t("docs.articles.firstDatabase.title"),
					description: t("docs.articles.firstDatabase.description"),
					href: "/docs/getting-started/first-database",
					popular: true,
					estimatedTime: `7 ${t("docs.common.estimatedTime")}`,
				},
				{
					title: t("docs.articles.dashboardOverview.title"),
					description: t("docs.articles.dashboardOverview.description"),
					href: "/docs/getting-started/dashboard",
					estimatedTime: `5 ${t("docs.common.estimatedTime")}`,
				},
				{
					title: t("docs.articles.userManagement.title"),
					description: t("docs.articles.userManagement.description"),
					href: "/docs/getting-started/user-management",
					estimatedTime: `8 ${t("docs.common.estimatedTime")}`,
				},
			],
		},
		{
			title: t("docs.index.database.title"),
			description: t("docs.index.database.description"),
			icon: <Database className='w-8 h-8' />,
			iconBg: "from-green-500/10 to-emerald-500/10",
			iconColor: "text-green-600",
			articles: [
				{
					title: t("docs.articles.tableSchemaDesign.title"),
					description: t("docs.articles.tableSchemaDesign.description"),
					href: "/docs/database/schema-design",
					popular: true,
					estimatedTime: `10 ${t("docs.common.estimatedTime")}`,
				},
				{
					title: t("docs.articles.columnTypesAndOptions.title"),
					description: t("docs.articles.columnTypesAndOptions.description"),
					href: "/docs/database/column-types",
					estimatedTime: `8 ${t("docs.common.estimatedTime")}`,
				},
				{
					title: t("docs.articles.dataImportExport.title"),
					description: t("docs.articles.dataImportExport.description"),
					href: "/docs/database/import-export",
					estimatedTime: `6 ${t("docs.common.estimatedTime")}`,
				},
			],
		},
		{
			title: t("docs.index.security.title"),
			description: t("docs.index.security.description"),
			icon: <Shield className='w-8 h-8' />,
			iconBg: "from-red-500/10 to-rose-500/10",
			iconColor: "text-red-600",
			articles: [
				{
					title: t("docs.articles.permissions.title"),
					description: t("docs.articles.permissions.description"),
					href: "/docs/security/permissions",
					popular: true,
					estimatedTime: `6 ${t("docs.common.estimatedTime")}`,
				},
				{
					title: t("docs.articles.encryption.title"),
					description: t("docs.articles.encryption.description"),
					href: "/docs/security/encryption",
					estimatedTime: `4 ${t("docs.common.estimatedTime")}`,
				},
				{
					title: t("docs.articles.auditLogs.title"),
					description: t("docs.articles.auditLogs.description"),
					href: "/docs/security/audit-logs",
					estimatedTime: `5 ${t("docs.common.estimatedTime")}`,
				},
			],
		},
		{
			title: t("docs.index.performance.title"),
			description: t("docs.index.performance.description"),
			icon: <BarChart3 className='w-8 h-8' />,
			iconBg: "from-orange-500/10 to-amber-500/10",
			iconColor: "text-orange-600",
			articles: [
				{
					title: t("docs.articles.queryOptimization.title"),
					description: t("docs.articles.queryOptimization.description"),
					href: "/docs/performance/query-optimization",
					popular: true,
					estimatedTime: `12 ${t("docs.common.estimatedTime")}`,
				},
				{
					title: t("docs.articles.caching.title"),
					description: t("docs.articles.caching.description"),
					href: "/docs/performance/caching",
					estimatedTime: `8 ${t("docs.common.estimatedTime")}`,
				},
				{
					title: t("docs.articles.monitoring.title"),
					description: t("docs.articles.monitoring.description"),
					href: "/docs/performance/monitoring",
					estimatedTime: `6 ${t("docs.common.estimatedTime")}`,
				},
			],
		},
		{
			title: t("docs.index.help.title"),
			description: t("docs.index.help.description"),
			icon: <HelpCircle className='w-8 h-8' />,
			iconBg: "from-purple-500/10 to-violet-500/10",
			iconColor: "text-purple-600",
			articles: [
				{
					title: t("docs.articles.helpCenter.title"),
					description: t("docs.articles.helpCenter.description"),
					href: "/docs/help",
					popular: true,
					estimatedTime: `3 ${t("docs.common.estimatedTime")}`,
				},
				{
					title: t("docs.articles.faq.title"),
					description: t("docs.articles.faq.description"),
					href: "/docs/help#faq",
					estimatedTime: `5 ${t("docs.common.estimatedTime")}`,
				},
				{
					title: t("docs.articles.contactSupport.title"),
					description: t("docs.articles.contactSupport.description"),
					href: "/#contact",
					estimatedTime: `2 ${t("docs.common.estimatedTime")}`,
				},
			],
		},
	];

	const quickStart = [
		{
			title: t("docs.articles.createFirstDatabase.title"),
			description: t("docs.index.quickStart.subtitle"),
			href: "/docs/getting-started/first-database",
			icon: <Database className='w-5 h-5' />,
		},
		{
			title: t("docs.articles.apiAuthentication.title"),
			description: t("docs.articles.apiAuthentication.description"),
			href: "/docs/api",
			icon: <Globe className='w-5 h-5' />,
		},
		{
			title: t("docs.articles.userManagementBasics.title"),
			description: t("docs.articles.userManagementBasics.description"),
			href: "/docs/getting-started/user-management",
			icon: <Users className='w-5 h-5' />,
		},
		{
			title: "Legal Documents",
			description: "Terms, Privacy Policy, and Compliance",
			href: "/docs/legal",
			icon: <Shield className='w-5 h-5' />,
		},
	];

	return (
		<div className='space-y-12'>
			{/* Hero Section */}
			<div className='text-center space-y-6'>
				<div className='flex justify-center mb-6'>
					<div className='p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl'>
						<BookOpen className='w-12 h-12 text-primary' />
					</div>
				</div>
				<h1 className='text-4xl md:text-5xl font-bold text-foreground'>
					{t("docs.index.title")}
				</h1>
				<p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
					{t("docs.index.subtitle")}
				</p>
			</div>

			{/* Quick Start */}
			<div>
				<h2 className='text-2xl font-bold text-foreground mb-6'>
					{t("docs.index.quickStart.title") || "Quick Start"}
				</h2>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
					{quickStart.map((item, index) => (
						<Link key={index} href={item.href}>
							<Card className='hover:shadow-lg transition-all duration-200 cursor-pointer group'>
								<CardContent className='p-6'>
									<div className='flex items-center gap-3 mb-3'>
										<div className='p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors'>
											{item.icon}
										</div>
										<ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
									</div>
									<h3 className='font-semibold text-foreground mb-1'>
										{item.title}
									</h3>
									<p className='text-sm text-muted-foreground'>
										{item.description}
									</p>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</div>

			{/* Documentation Sections */}
			<div className='space-y-8'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.index.title")}
				</h2>

				<div className='space-y-8'>
					{docSections.map((section, sectionIndex) => (
						<Card key={sectionIndex} className='overflow-hidden'>
							<CardHeader className='bg-muted/30'>
								<div className='flex items-center gap-4'>
									<div
										className={`p-3 bg-gradient-to-br ${section.iconBg} rounded-xl`}>
										<div className={section.iconColor}>{section.icon}</div>
									</div>
									<div>
										<CardTitle className='text-2xl'>{section.title}</CardTitle>
										<CardDescription className='text-base'>
											{section.description}
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='p-6'>
								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
									{section.articles.map((article, articleIndex) => (
										<Link key={articleIndex} href={article.href}>
											<Card className='hover:shadow-md transition-all duration-200 cursor-pointer border-border/50 hover:border-border'>
												<CardContent className='p-4'>
													<div className='flex items-start justify-between mb-2'>
														<h4 className='font-medium text-foreground'>
															{article.title}
														</h4>
														{article.popular && (
															<Badge variant='secondary' className='text-xs'>
																<Star className='w-3 h-3 mr-1' />
																{t("docs.common.popular")}
															</Badge>
														)}
													</div>
													<p className='text-sm text-muted-foreground mb-3'>
														{article.description}
													</p>
													<div className='flex items-center justify-between'>
														<div className='flex items-center gap-1 text-xs text-muted-foreground'>
															<Clock className='w-3 h-3' />
															{article.estimatedTime}
														</div>
														<Button
															variant='ghost'
															size='sm'
															className='p-0 h-auto text-primary hover:text-primary/80'>
															{t("docs.common.viewAll")} →
														</Button>
													</div>
												</CardContent>
											</Card>
										</Link>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Help & Support */}
			<div className='text-center'>
				<Card className='bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20'>
					<CardContent className='p-8'>
						<div className='flex justify-center mb-4'>
							<div className='p-3 bg-primary/10 rounded-full'>
								<HelpCircle className='w-8 h-8 text-primary' />
							</div>
						</div>
						<h3 className='text-2xl font-bold text-foreground mb-2'>
							{t("docs.common.needHelp")}
						</h3>
						<p className='text-muted-foreground mb-6'>
							{t("docs.index.subtitle")}
						</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<Link href='/docs/help'>
								<Button size='lg'>
									<HelpCircle className='w-4 h-4 mr-2' />
									{t("docs.common.contactSupport")}
								</Button>
							</Link>
							<Link href='/#contact'>
								<Button variant='outline' size='lg'>
									<FileText className='w-4 h-4 mr-2' />
									{t("docs.common.contactSupport")}
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default DocsIndexPage;
