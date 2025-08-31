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
	LayoutDashboard,
	Database,
	Users,
	Settings,
	BarChart3,
	FileText,
	Globe,
	Bell,
	Search,
	Plus,
	ArrowRight,
	CheckCircle,
	Info,
	Lightbulb,
} from "lucide-react";

const DashboardPage = () => {
	const { t } = useLanguage();

	const dashboardSections = [
		{
			title: "Overview & Analytics",
			description: "Get a quick snapshot of your data and platform usage",
			icon: <BarChart3 className='w-6 h-6' />,
			features: [
				"Data usage statistics and storage information",
				"Recent activity and system notifications",
				"Quick access to frequently used databases",
				"Performance metrics and insights",
			],
			iconBg: "from-blue-500/10 to-cyan-500/10",
			iconColor: "text-blue-600",
		},
		{
			title: "Database Management",
			description: "Create, organize, and manage your databases and tables",
			icon: <Database className='w-6 h-6' />,
			features: [
				"View all your databases in one place",
				"Create new databases and tables",
				"Manage table schemas and columns",
				"Import and export data",
			],
			iconBg: "from-green-500/10 to-emerald-500/10",
			iconColor: "text-green-600",
		},
		{
			title: "User Management",
			description: "Manage team members, roles, and permissions",
			icon: <Users className='w-6 h-6' />,
			features: [
				"Invite new team members",
				"Assign roles and permissions",
				"Manage user access levels",
				"View user activity logs",
			],
			iconBg: "from-purple-500/10 to-violet-500/10",
			iconColor: "text-purple-600",
		},
		{
			title: "API & Integrations",
			description: "Access your data through APIs and external integrations",
			icon: <Globe className='w-6 h-6' />,
			features: [
				"View API documentation",
				"Monitor API usage",
				"Configure webhooks",
			],
			iconBg: "from-orange-500/10 to-amber-500/10",
			iconColor: "text-orange-600",
		},
		{
			title: "Settings & Configuration",
			description: "Customize your platform settings and preferences",
			icon: <Settings className='w-6 h-6' />,
			features: [
				"Account and profile settings",
				"Tenant configuration",
				"Security and privacy settings",
				"Billing and subscription management",
			],
			iconBg: "from-red-500/10 to-rose-500/10",
			iconColor: "text-red-600",
		},
	];

	const quickActions = [
		{
			title: "Create Database",
			description: "Start a new database project",
			icon: <Plus className='w-5 h-5' />,
			href: "/home/database",
			color: "text-green-600",
			bgColor: "bg-green-100",
		},
		{
			title: "Invite Users",
			description: "Add team members to your workspace",
			icon: <Users className='w-5 h-5' />,
			href: "/home/users",
			color: "text-blue-600",
			bgColor: "bg-blue-100",
		},

		{
			title: "View Analytics",
			description: "Check your data usage and performance",
			icon: <BarChart3 className='w-5 h-5' />,
			href: "/home/dashboard",
			color: "text-orange-600",
			bgColor: "bg-orange-100",
		},
	];

	const navigationTips = [
		"Use the sidebar navigation to quickly switch between sections",
		"The top bar shows your current location and provides quick actions",
		"Use the search functionality to find specific databases or tables",
		"Click on breadcrumbs to navigate back to previous levels",
		"Use keyboard shortcuts for faster navigation (Ctrl/Cmd + K for search)",
	];

	const productivityFeatures = [
		"Quick access to recently used databases and tables",
		"Favorites system to bookmark important items",
		"Bulk operations for managing multiple items at once",
		"Keyboard shortcuts for common actions",
		"Responsive design that works on all devices",
	];

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='space-y-4'>
				<div className='flex items-center gap-3'>
					<Badge variant='secondary' className='text-sm'>
						Getting Started
					</Badge>
					<Badge variant='outline' className='text-sm'>
						3 min read
					</Badge>
				</div>
				<h1 className='text-4xl font-bold text-foreground'>
					{t("docs.dashboard.title") || "Dashboard Overview"}
				</h1>
				<p className='text-xl text-muted-foreground'>
					{t("docs.dashboard.subtitle") ||
						"Learn how to navigate and use the main dashboard effectively. Discover all the features and tools available to manage your data."}
				</p>
			</div>

			{/* Dashboard Overview */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<LayoutDashboard className='w-5 h-5 text-primary' />
						{t("docs.dashboard.overview.title") || "What is the Dashboard?"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground mb-4'>
						{t("docs.dashboard.overview.description") ||
							"The dashboard is your central command center for managing all aspects of your multi-tenant platform. It provides quick access to your databases, user management, analytics, and platform settings."}
					</p>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<h4 className='font-medium text-foreground'>Key Benefits:</h4>
							<ul className='space-y-1 text-sm text-muted-foreground'>
								<li>• Centralized data management</li>
								<li>• Real-time analytics and insights</li>
								<li>• Team collaboration tools</li>
								<li>• Secure access control</li>
							</ul>
						</div>
						<div className='space-y-2'>
							<h4 className='font-medium text-foreground'>Main Features:</h4>
							<ul className='space-y-1 text-sm text-muted-foreground'>
								<li>• Database creation and management</li>
								<li>• User and permission management</li>
								<li>• API access and integrations</li>
								<li>• Performance monitoring</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Dashboard Sections */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.dashboard.sections.title") || "Dashboard Sections"}
				</h2>

				<div className='space-y-6'>
					{dashboardSections.map((section, index) => (
						<Card key={index} className='overflow-hidden'>
							<CardHeader className='bg-muted/30'>
								<div className='flex items-center gap-4'>
									<div
										className={`p-3 bg-gradient-to-br ${section.iconBg} rounded-xl`}>
										<div className={section.iconColor}>{section.icon}</div>
									</div>
									<div>
										<CardTitle className='text-xl'>{section.title}</CardTitle>
										<CardDescription className='text-base'>
											{section.description}
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='p-6'>
								<ul className='space-y-2'>
									{section.features.map((feature, featureIndex) => (
										<li key={featureIndex} className='flex items-start gap-2'>
											<CheckCircle className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
											<span className='text-sm'>{feature}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Quick Actions */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.dashboard.quickActions.title") || "Quick Actions"}
				</h2>

				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
					{quickActions.map((action, index) => (
						<Link key={index} href={action.href}>
							<Card className='hover:shadow-lg transition-all duration-200 cursor-pointer group'>
								<CardContent className='p-4 text-center'>
									<div className={`flex justify-center mb-3`}>
										<div
											className={`p-2 ${action.bgColor} rounded-lg group-hover:scale-110 transition-transform`}>
											<div className={action.color}>{action.icon}</div>
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
						</Link>
					))}
				</div>
			</div>

			{/* Navigation Tips */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.dashboard.navigation.title") || "Navigation Tips"}
				</h2>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Lightbulb className='w-5 h-5 text-yellow-600' />
							{t("docs.dashboard.navigation.subtitle") ||
								"Efficient Navigation"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{navigationTips.map((tip, index) => (
								<div key={index} className='flex items-start gap-2'>
									<CheckCircle className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
									<span className='text-sm'>{tip}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Productivity Features */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.dashboard.productivity.title") || "Productivity Features"}
				</h2>

				<Card>
					<CardContent className='p-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{productivityFeatures.map((feature, index) => (
								<div key={index} className='flex items-start gap-2'>
									<CheckCircle className='w-4 h-4 text-primary mt-0.5 flex-shrink-0' />
									<span className='text-sm'>{feature}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Next Steps */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.dashboard.nextSteps.title") || "What's Next?"}
				</h2>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Link href='/docs/getting-started/first-database'>
						<Card className='hover:shadow-lg transition-all duration-200 cursor-pointer group'>
							<CardContent className='p-6'>
								<div className='flex items-center gap-3 mb-3'>
									<Database className='w-6 h-6 text-primary' />
									<ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
								</div>
								<h3 className='font-semibold text-foreground mb-1'>
									{t("docs.dashboard.nextSteps.database") ||
										"Create Your First Database"}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{t("docs.dashboard.nextSteps.databaseDesc") ||
										"Learn how to create and manage your first database"}
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link href='/docs/getting-started/user-management'>
						<Card className='hover:shadow-lg transition-all duration-200 cursor-pointer group'>
							<CardContent className='p-6'>
								<div className='flex items-center gap-3 mb-3'>
									<Users className='w-6 h-6 text-primary' />
									<ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
								</div>
								<h3 className='font-semibold text-foreground mb-1'>
									{t("docs.dashboard.nextSteps.users") || "User Management"}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{t("docs.dashboard.nextSteps.usersDesc") ||
										"Invite team members and set up permissions"}
								</p>
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>

			{/* Help Section */}
			<Card className='bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20'>
				<CardContent className='p-6 text-center'>
					<h3 className='text-lg font-semibold text-foreground mb-2'>
						{t("docs.dashboard.help.title") || "Need Help?"}
					</h3>
					<p className='text-sm text-muted-foreground mb-4'>
						{t("docs.dashboard.help.description") ||
							"Have questions about the dashboard? Our support team is here to help you get the most out of the platform."}
					</p>
					<div className='flex flex-col sm:flex-row gap-3 justify-center'>
						<Link href='/docs/help'>
							<Button variant='outline' size='sm'>
								{t("docs.dashboard.help.helpCenter") || "Help Center"}
							</Button>
						</Link>
						<Link href='/#contact'>
							<Button size='sm'>
								{t("docs.dashboard.help.contact") || "Contact Support"}
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default DashboardPage;
