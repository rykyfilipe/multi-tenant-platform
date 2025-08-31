/** @format */

"use client";

import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	BookOpen,
	HelpCircle,
	Search,
	MessageCircle,
	Mail,
	FileText,
	Video,
	Users,
	Zap,
	Database,
	Settings,
	Shield,
	Globe,
	BarChart3,
	Filter,
	Upload,
	Download,
	Lock,
	Key,
	AlertTriangle,
	CheckCircle,
	Info,
} from "lucide-react";

const HelpDocsPage = () => {
	const { t } = useLanguage();
	const [searchQuery, setSearchQuery] = useState("");

	const helpCategories = [
		{
			title:
				t("docs.help.categories.gettingStarted.title") || "Getting Started",
			description:
				t("docs.help.categories.gettingStarted.description") ||
				"Learn the basics and set up your first database",
			icon: <Zap className='w-6 h-6' />,
			articles: [
				{
					title: "Creating Your First Database",
					description:
						"Step-by-step guide to create your first database and table",
					link: "/docs/getting-started/first-database",
					popular: true,
				},
				{
					title: "Understanding the Dashboard",
					description:
						"Navigate through the main dashboard and understand key features",
					link: "/docs/getting-started/dashboard",
				},
				{
					title: "User Management Basics",
					description: "Learn how to invite users and manage permissions",
					link: "/docs/getting-started/user-management",
				},
			],
		},
		{
			title: t("docs.help.categories.database.title") || "Database Management",
			description:
				t("docs.help.categories.database.description") ||
				"Create, manage, and optimize your databases",
			icon: <Database className='w-6 h-6' />,
			articles: [
				{
					title: "Table Schema Design",
					description: "Best practices for designing your table structure",
					link: "/docs/database/schema-design",
					popular: true,
				},
				{
					title: "Column Types and Options",
					description:
						"Understanding different column types and their configurations",
					link: "/docs/database/column-types",
				},
				{
					title: "Data Import and Export",
					description: "Import data from CSV/Excel and export your data",
					link: "/docs/database/import-export",
				},
			],
		},
		{
			title: t("docs.help.categories.api.title") || "API & Integrations",
			description:
				t("docs.help.categories.api.description") ||
				"Connect your applications and automate workflows",
			icon: <Globe className='w-6 h-6' />,
			articles: [
				{
					title: "API Authentication",
					description: "Set up JWT authentication for your API requests",
					link: "/docs/api/authentication",
					popular: true,
				},
				{
					title: "Webhook Integration",
					description: "Configure webhooks for real-time data updates",
					link: "/docs/api/webhooks",
				},
				{
					title: "SDK Examples",
					description:
						"Code examples in JavaScript, Python, and other languages",
					link: "/docs/api/sdk-examples",
				},
			],
		},
		{
			title:
				t("docs.help.categories.security.title") || "Security & Permissions",
			description:
				t("docs.help.categories.security.description") ||
				"Secure your data and manage user access",
			icon: <Shield className='w-6 h-6' />,
			articles: [
				{
					title: "Permission System",
					description: "Understand role-based access control and permissions",
					link: "/docs/security/permissions",
					popular: true,
				},
				{
					title: "Data Encryption",
					description: "Learn about data encryption and security measures",
					link: "/docs/security/encryption",
				},
				{
					title: "Audit Logs",
					description: "Track user activities and data changes",
					link: "/docs/security/audit-logs",
				},
			],
		},
		{
			title:
				t("docs.help.categories.performance.title") ||
				"Performance & Optimization",
			description:
				t("docs.help.categories.performance.description") ||
				"Optimize your database performance and queries",
			icon: <BarChart3 className='w-6 h-6' />,
			articles: [
				{
					title: "Query Optimization",
					description: "Best practices for fast and efficient queries",
					link: "/docs/performance/query-optimization",
					popular: true,
				},
				{
					title: "Caching Strategies",
					description: "Implement effective caching for better performance",
					link: "/docs/performance/caching",
				},
				{
					title: "Monitoring and Analytics",
					description: "Track performance metrics and usage patterns",
					link: "/docs/performance/monitoring",
				},
			],
		},
	];

	const quickActions = [
		{
			title: "Contact Support",
			description: "Get help from our support team",
			icon: <MessageCircle className='w-5 h-5' />,
			action: () => (window.location.href = "#contact"),
			variant: "default" as const,
		},
		{
			title: "Video Tutorials",
			description: "Watch step-by-step video guides",
			icon: <Video className='w-5 h-5' />,
			action: () => window.open("/docs/videos", "_blank"),
			variant: "outline" as const,
		},
		{
			title: "Community Forum",
			description: "Connect with other users",
			icon: <Users className='w-5 h-5' />,
			action: () => window.open("/community", "_blank"),
			variant: "outline" as const,
		},
		{
			title: "Feature Requests",
			description: "Suggest new features",
			icon: <FileText className='w-5 h-5' />,
			action: () => window.open("/feedback", "_blank"),
			variant: "outline" as const,
		},
	];

	const faqs = [
		{
			question: "How do I reset my password?",
			answer:
				"You can reset your password by clicking the 'Forgot Password' link on the login page. You'll receive an email with a reset link.",
		},
		{
			question: "Can I export my data?",
			answer:
				"Yes, you can export your data in various formats including CSV, Excel, and JSON. Use the export button in the table view or API endpoints.",
		},
		{
			question: "How do I invite team members?",
			answer:
				"Go to the Users section in your dashboard and click 'Invite User'. Enter their email address and select their role and permissions.",
		},
		{
			question: "What's the difference between databases and tables?",
			answer:
				"A database is a container that holds multiple tables. Tables are where your actual data is stored with defined columns and rows.",
		},
		{
			question: "How secure is my data?",
			answer:
				"Your data is protected with enterprise-grade security including encryption at rest and in transit, role-based access control, and audit logging.",
		},
		{
			question: "Can I use the API with my own applications?",
			answer:
				"Absolutely! We provide a comprehensive REST API with JWT authentication that you can use to integrate with any application or service.",
		},
	];

	const filteredCategories = helpCategories.filter(
		(category) =>
			category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			category.articles.some(
				(article) =>
					article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					article.description.toLowerCase().includes(searchQuery.toLowerCase()),
			),
	);

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<div className='border-b border-border/20 bg-card/90 backdrop-blur-2xl'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='text-center'>
						<h1 className='text-4xl md:text-5xl font-bold text-foreground mb-4'>
							{t("docs.help.title") || "Help Center"}
						</h1>
						<p className='text-xl text-muted-foreground max-w-3xl mx-auto mb-8'>
							{t("docs.help.subtitle") ||
								"Find answers to common questions, learn how to use our platform, and get the support you need."}
						</p>

						{/* Search Bar */}
						<div className='max-w-2xl mx-auto relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5' />
							<input
								type='text'
								placeholder={
									t("docs.help.searchPlaceholder") || "Search help articles..."
								}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Quick Actions */}
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
					{quickActions.map((action, index) => (
						<Card
							key={index}
							className='hover:shadow-lg transition-all duration-200 cursor-pointer'>
							<CardContent className='p-4 text-center' onClick={action.action}>
								<div className='flex justify-center mb-3'>
									<div className='p-2 bg-primary/10 rounded-lg'>
										{action.icon}
									</div>
								</div>
								<h3 className='font-semibold text-foreground mb-1'>
									{action.title}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{action.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Help Categories */}
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<h2 className='text-3xl font-bold text-foreground mb-8 text-center'>
					{t("docs.help.categoriesTitle") || "Browse Help by Category"}
				</h2>

				<div className='space-y-8'>
					{filteredCategories.map((category, index) => (
						<Card key={index} className='overflow-hidden'>
							<CardHeader className='bg-muted/30'>
								<div className='flex items-center gap-3'>
									<div className='p-2 bg-primary/10 rounded-lg'>
										{category.icon}
									</div>
									<div>
										<CardTitle className='text-xl'>{category.title}</CardTitle>
										<CardDescription className='text-base'>
											{category.description}
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='p-6'>
								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
									{category.articles.map((article, articleIndex) => (
										<div
											key={articleIndex}
											className='border rounded-lg p-4 hover:bg-muted/30 transition-colors'>
											<div className='flex items-start justify-between mb-2'>
												<h4 className='font-medium text-foreground'>
													{article.title}
												</h4>
												{article.popular && (
													<Badge variant='secondary' className='text-xs'>
														Popular
													</Badge>
												)}
											</div>
											<p className='text-sm text-muted-foreground mb-3'>
												{article.description}
											</p>
											<Button
												variant='ghost'
												size='sm'
												className='p-0 h-auto text-primary hover:text-primary/80'>
												Read more →
											</Button>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* FAQs */}
			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<h2 className='text-3xl font-bold text-foreground mb-8 text-center'>
					{t("docs.help.faqTitle") || "Frequently Asked Questions"}
				</h2>

				<Accordion type='single' collapsible className='w-full'>
					{faqs.map((faq, index) => (
						<AccordionItem key={index} value={`item-${index}`}>
							<AccordionTrigger className='text-left hover:no-underline'>
								<div className='flex items-center gap-3'>
									<HelpCircle className='w-5 h-5 text-primary flex-shrink-0' />
									<span className='font-medium'>{faq.question}</span>
								</div>
							</AccordionTrigger>
							<AccordionContent className='text-muted-foreground pl-8'>
								{faq.answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>

			{/* Contact Support */}
			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<Card className='bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20'>
					<CardContent className='p-8 text-center'>
						<div className='flex justify-center mb-4'>
							<div className='p-3 bg-primary/10 rounded-full'>
								<MessageCircle className='w-8 h-8 text-primary' />
							</div>
						</div>
						<h3 className='text-2xl font-bold text-foreground mb-2'>
							{t("docs.help.contactTitle") || "Still Need Help?"}
						</h3>
						<p className='text-muted-foreground mb-6'>
							{t("docs.help.contactDescription") ||
								"Can't find what you're looking for? Our support team is here to help you get the most out of our platform."}
						</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<Button
								size='lg'
								onClick={() => (window.location.href = "#contact")}>
								<Mail className='w-4 h-4 mr-2' />
								{t("docs.help.contactButton") || "Contact Support"}
							</Button>
							<Button
								variant='outline'
								size='lg'
								onClick={() => window.open("/docs/api", "_blank")}>
								<Globe className='w-4 h-4 mr-2' />
								{t("docs.help.apiDocsButton") || "API Documentation"}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default HelpDocsPage;
