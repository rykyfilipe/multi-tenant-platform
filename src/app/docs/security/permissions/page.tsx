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
import { Separator } from "@/components/ui/separator";
import {
	Shield,
	Users,
	Key,
	Eye,
	Edit,
	Trash2,
	Settings,
	Database,
	UserPlus,
	Crown,
	Lock,
	Unlock,
	CheckCircle,
	AlertTriangle,
	Info,
	Clock,
	ArrowRight,
} from "lucide-react";

const PermissionsPage = () => {
	const { t } = useLanguage();

	const roles = [
		{
			role: "Admin",
			icon: <Crown className='w-6 h-6' />,
			description: "Full access to all platform features and settings",
			color: "bg-red-500/10 text-red-600",
			permissions: [
				"Manage user accounts and roles",
				"Control table and column access",
				"Set up data import/export permissions",
				"Access all data",
				"Configure organization settings",
		
				"View audit logs",
				"Export data",
			],
			bestFor: "Organization owners and technical leads",
			limitations: "None - full platform access",
		},
		{
			role: "Editor",
			icon: <Edit className='w-6 h-6' />,
			description: "Can create and modify data but not change system settings",
			color: "bg-blue-500/10 text-blue-600",
			permissions: [
				"Create and edit rows in assigned tables",
				"Import and export data",
				"Create new tables (if allowed)",
				"View table schemas",
				"Access assigned databases",
		
			],
			bestFor: "Content creators, data analysts, and team members",
			limitations:
				"Cannot modify schemas, manage users, or access admin settings",
		},
		{
			role: "Viewer",
			icon: <Eye className='w-6 h-6' />,
			description: "Read-only access to assigned data and tables",
			color: "bg-green-500/10 text-green-600",
			permissions: [
				"View data in assigned tables",
				"Export data (if allowed)",
				"View table schemas",
				"Access assigned databases",
		
			],
			bestFor: "Stakeholders, clients, and external collaborators",
			limitations: "Cannot create, edit, or delete any data",
		},
	];

	const permissionTypes = [
		{
			type: "Database Permissions",
			icon: <Database className='w-5 h-5' />,
			description:
				"Control access to specific databases within your organization",
			levels: ["No Access", "Read Only", "Read/Write", "Full Control"],
			examples: [
				"Grant read-only access to production database",
				"Allow full control over development database",
				"Restrict access to sensitive customer data",
			],
		},
		{
			type: "Table Permissions",
			icon: <Settings className='w-5 h-5' />,
			description:
				"Fine-grained control over individual tables and their operations",
			levels: ["No Access", "Read", "Write", "Schema Edit", "Delete"],
			examples: [
				"Allow editing customer records but not deleting",
				"Grant schema modification rights for specific tables",
				"Provide read-only access to financial data",
			],
		},
		{
			type: "API Permissions",
			icon: <Key className='w-5 h-5' />,
			description: "Control what operations are allowed for users",
			levels: ["No API Access", "Read Only", "Read/Write", "Full API"],
			examples: [
				"Create read-only tokens for reporting tools",
				"Generate full-access tokens for integrations",
				"Limit API access to specific endpoints",
			],
		},
		{
			type: "System Permissions",
			icon: <Shield className='w-5 h-5' />,
			description: "Administrative permissions for platform management",
			levels: ["No Access", "View Settings", "Manage Users", "Full Admin"],
			examples: [
				"Allow user invitation without admin rights",
				"Grant access to organization settings",
				"Provide full administrative control",
			],
		},
	];

	const bestPractices = [
		{
			title: "Principle of Least Privilege",
			description:
				"Grant users only the minimum permissions needed to perform their job functions",
			icon: <Lock className='w-5 h-5' />,
			tips: [
				"Start with the most restrictive role and add permissions as needed",
				"Regularly audit user permissions and remove unnecessary access",
				"Use time-limited access for temporary team members",
				"Separate development and production access",
			],
		},
		{
			title: "Regular Permission Audits",
			description:
				"Periodically review and update user permissions to maintain security",
			icon: <Eye className='w-5 h-5' />,
			tips: [
				"Review permissions quarterly or after role changes",
				"Document permission changes and reasons",
				"Remove access for departed team members immediately",
				"Monitor unusual access patterns in audit logs",
			],
		},
		{
			title: "Role-Based Organization",
			description:
				"Organize permissions around job functions rather than individual users",
			icon: <Users className='w-5 h-5' />,
			tips: [
				"Create role templates for common job functions",
				"Group related permissions together",
				"Use descriptive role names that reflect responsibilities",
				"Consider department-based permission groups",
			],
		},
		{
					title: "Secure User Management",
		description:
			"Properly manage users and their associated permissions",
			icon: <Key className='w-5 h-5' />,
			tips: [
				"Create separate tokens for different applications",
				"Use environment-specific tokens (dev, staging, prod)",
				"Rotate tokens regularly and when team members leave",
				"Monitor token usage and revoke unused tokens",
			],
		},
	];

	return (
		<div className='max-w-6xl mx-auto p-6 space-y-8'>
			{/* Header */}
			<div className='space-y-4'>
				<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
					<Link href='/docs' className='hover:text-foreground'>
						Documentation
					</Link>
					<span>/</span>
					<Link href='/docs/security' className='hover:text-foreground'>
						Security
					</Link>
					<span>/</span>
					<span className='text-foreground'>Permissions</span>
				</div>

				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-foreground'>
						Permission System & User Roles
					</h1>
					<p className='text-lg text-muted-foreground'>
						Understand how to manage user access and permissions with role-based
						access control to keep your data secure.
					</p>
				</div>

				<div className='flex items-center space-x-4'>
					<Badge variant='secondary'>
						<Clock className='w-3 h-3 mr-1' />
						12 min read
					</Badge>
					<Badge variant='outline'>Security</Badge>
					<Badge variant='outline'>Permissions</Badge>
					<Badge variant='outline'>Access Control</Badge>
				</div>
			</div>

			<Separator />

			{/* User Roles Overview */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						User Roles Overview
					</h2>
					<p className='text-muted-foreground'>
						YDV uses a role-based access control system to manage what users can
						see and do in your organization.
					</p>
				</div>

				<div className='space-y-6'>
					{roles.map((role, index) => (
						<Card key={index} className='hover:shadow-md transition-shadow'>
							<CardHeader>
								<div className='flex items-start space-x-3'>
									<div className={`p-2 rounded-lg ${role.color}`}>
										{role.icon}
									</div>
									<div className='space-y-1 flex-1'>
										<CardTitle className='text-lg'>{role.role}</CardTitle>
										<CardDescription>{role.description}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Key Permissions:
										</h4>
										<ul className='text-sm text-muted-foreground space-y-1'>
											{role.permissions.slice(0, 4).map((permission, idx) => (
												<li key={idx} className='flex items-start'>
													<CheckCircle className='w-3 h-3 mr-2 text-green-600 mt-0.5 flex-shrink-0' />
													{permission}
												</li>
											))}
											{role.permissions.length > 4 && (
												<li className='text-xs text-muted-foreground/70'>
													...and {role.permissions.length - 4} more
												</li>
											)}
										</ul>
									</div>
									<div className='space-y-3'>
										<div>
											<h4 className='font-medium text-sm text-foreground mb-1'>
												Best For:
											</h4>
											<p className='text-sm text-muted-foreground'>
												{role.bestFor}
											</p>
										</div>
										<div>
											<h4 className='font-medium text-sm text-foreground mb-1'>
												Limitations:
											</h4>
											<p className='text-sm text-muted-foreground'>
												{role.limitations}
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Permission Types */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Permission Types
					</h2>
					<p className='text-muted-foreground'>
						Understand the different types of permissions and how they control
						access to your platform.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{permissionTypes.map((type, index) => (
						<Card key={index}>
							<CardContent className='p-6'>
								<div className='space-y-4'>
									<div className='flex items-start space-x-3'>
										<div className='p-2 bg-primary/10 text-primary rounded-lg'>
											{type.icon}
										</div>
										<div className='space-y-1'>
											<h3 className='font-semibold text-foreground'>
												{type.type}
											</h3>
											<p className='text-sm text-muted-foreground'>
												{type.description}
											</p>
										</div>
									</div>

									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Permission Levels:
										</h4>
										<div className='flex flex-wrap gap-1'>
											{type.levels.map((level, idx) => (
												<Badge
													key={idx}
													variant='secondary'
													className='text-xs'>
													{level}
												</Badge>
											))}
										</div>
									</div>

									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Example Use Cases:
										</h4>
										<ul className='text-sm text-muted-foreground space-y-1'>
											{type.examples.map((example, idx) => (
												<li key={idx} className='flex items-start'>
													<span className='w-1 h-1 bg-muted-foreground rounded-full mr-2 mt-2' />
													{example}
												</li>
											))}
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* How to Manage Permissions */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						How to Manage Permissions
					</h2>
					<p className='text-muted-foreground'>
						Step-by-step guide to managing user permissions in your
						organization.
					</p>
				</div>

				<Card>
					<CardContent className='p-6'>
						<div className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div className='space-y-4'>
									<h3 className='font-semibold text-foreground flex items-center'>
										<UserPlus className='w-5 h-5 mr-2' />
										Adding New Users
									</h3>
									<ol className='space-y-2 text-sm text-muted-foreground'>
										<li className='flex items-start'>
											<span className='inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs mr-2 mt-0.5'>
												1
											</span>
											Go to User Management in your dashboard
										</li>
										<li className='flex items-start'>
											<span className='inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs mr-2 mt-0.5'>
												2
											</span>
											Click "Invite User" and enter their email
										</li>
										<li className='flex items-start'>
											<span className='inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs mr-2 mt-0.5'>
												3
											</span>
											Select their role and specific permissions
										</li>
										<li className='flex items-start'>
											<span className='inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs mr-2 mt-0.5'>
												4
											</span>
											Send the invitation and track acceptance
										</li>
									</ol>
								</div>

								<div className='space-y-4'>
									<h3 className='font-semibold text-foreground flex items-center'>
										<Settings className='w-5 h-5 mr-2' />
										Modifying Permissions
									</h3>
									<ol className='space-y-2 text-sm text-muted-foreground'>
										<li className='flex items-start'>
											<span className='inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs mr-2 mt-0.5'>
												1
											</span>
											Navigate to the user's profile page
										</li>
										<li className='flex items-start'>
											<span className='inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs mr-2 mt-0.5'>
												2
											</span>
											Click "Edit Permissions" button
										</li>
										<li className='flex items-start'>
											<span className='inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs mr-2 mt-0.5'>
												3
											</span>
											Adjust role or individual permissions
										</li>
										<li className='flex items-start'>
											<span className='inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs mr-2 mt-0.5'>
												4
											</span>
											Save changes and notify the user
										</li>
									</ol>
								</div>
							</div>

							<div className='p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
								<div className='flex items-start space-x-2'>
									<AlertTriangle className='w-5 h-5 text-amber-600 mt-0.5' />
									<div>
										<p className='font-medium text-amber-800 dark:text-amber-200'>
											Important Security Note
										</p>
										<p className='text-sm text-amber-700 dark:text-amber-300'>
											Permission changes take effect immediately. Always verify
											permissions after making changes, especially for admin
											roles.
										</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Separator />

			{/* Best Practices */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Security Best Practices
					</h2>
					<p className='text-muted-foreground'>
						Follow these guidelines to maintain a secure and well-organized
						permission system.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{bestPractices.map((practice, index) => (
						<Card key={index}>
							<CardContent className='p-6'>
								<div className='space-y-4'>
									<div className='flex items-start space-x-3'>
										<div className='p-2 bg-primary/10 text-primary rounded-lg'>
											{practice.icon}
										</div>
										<div className='space-y-1'>
											<h3 className='font-semibold text-foreground'>
												{practice.title}
											</h3>
											<p className='text-sm text-muted-foreground'>
												{practice.description}
											</p>
										</div>
									</div>

									<ul className='text-sm text-muted-foreground space-y-1 ml-11'>
										{practice.tips.map((tip, idx) => (
											<li key={idx} className='flex items-start'>
												<span className='w-1 h-1 bg-muted-foreground rounded-full mr-2 mt-2' />
												{tip}
											</li>
										))}
									</ul>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Next Steps */}
			<div className='space-y-4'>
				<h2 className='text-2xl font-semibold text-foreground'>Next Steps</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Link href='/docs/security/encryption'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											Data Encryption
										</h3>
										<p className='text-sm text-muted-foreground'>
											Learn about data encryption and security measures
										</p>
									</div>
									<ArrowRight className='w-5 h-5 text-muted-foreground' />
								</div>
							</CardContent>
						</Card>
					</Link>

					<Link href='/docs/security/audit-logs'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>Audit Logs</h3>
										<p className='text-sm text-muted-foreground'>
											Track user activities and data changes
										</p>
									</div>
									<ArrowRight className='w-5 h-5 text-muted-foreground' />
								</div>
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default PermissionsPage;
