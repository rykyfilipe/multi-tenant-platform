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
	Users,
	UserPlus,
	Shield,
	Settings,
	Mail,
	CheckCircle,
	AlertTriangle,
	Info,
	ArrowRight,
	Lock,
	Eye,
	Edit,
	Trash2,
} from "lucide-react";

const UserManagementPage = () => {
	const { t } = useLanguage();

	const userRoles = [
		{
			role: "ADMIN",
			title: "Administrator",
			description: "Full access to all features and settings",
			permissions: [
				"Create and manage databases",
				"Invite and remove users",
				"Manage all user permissions",
				"Access billing and subscription",
				"Configure platform settings",
				"View system analytics",
			],
			icon: <Shield className='w-5 h-5' />,
			color: "text-red-600",
			bgColor: "bg-red-100",
			recommended: false,
		},
		{
			role: "MANAGER",
			title: "Manager",
			description: "Can manage data and users within assigned scope",
			permissions: [
				"Create and manage databases",
				"Invite users (limited permissions)",
				"Manage data and tables",
				"View analytics and reports",
				"Configure database settings",
			],
			icon: <Settings className='w-5 h-5' />,
			color: "text-blue-600",
			bgColor: "bg-blue-100",
			recommended: true,
		},
		{
			role: "EDITOR",
			title: "Editor",
			description: "Can edit data and manage tables",
			permissions: [
				"View and edit data in tables",
				"Create and modify tables",
				"Import and export data",
				"View basic analytics",
			],
			icon: <Edit className='w-5 h-5' />,
			color: "text-green-600",
			bgColor: "bg-green-100",
			recommended: true,
		},
		{
			role: "VIEWER",
			title: "Viewer",
			description: "Read-only access to assigned data",
			permissions: [
				"View data in tables",
				"Export data (if permitted)",
				"View basic reports",
			],
			icon: <Eye className='w-5 h-5' />,
			color: "text-gray-600",
			bgColor: "bg-gray-100",
			recommended: true,
		},
	];

	const invitationProcess = [
		{
			step: 1,
			title: "Send Invitation",
			description: "Invite users by email address",
			details: [
				"Go to the Users section in your dashboard",
				"Click 'Invite User' button",
				"Enter the user's email address",
				"Select their role and permissions",
				"Add a personal message (optional)",
				"Click 'Send Invitation'",
			],
			icon: <Mail className='w-6 h-6' />,
		},
		{
			step: 2,
			title: "User Accepts Invitation",
			description: "User receives and accepts the invitation",
			details: [
				"User receives invitation email",
				"User clicks the invitation link",
				"User creates their account",
				"User sets up their profile",
				"User gains access to the platform",
			],
			icon: <CheckCircle className='w-6 h-6' />,
		},
		{
			step: 3,
			title: "Access Management",
			description: "Manage user access and permissions",
			details: [
				"Monitor user activity",
				"Adjust permissions as needed",
				"Revoke access if necessary",
				"Update user roles",
				"Manage user groups",
			],
			icon: <Lock className='w-6 h-6' />,
		},
	];

	const bestPractices = [
		"Start with minimal permissions and increase as needed",
		"Use role-based access control for consistency",
		"Regularly review and update user permissions",
		"Document permission changes for audit purposes",
		"Use descriptive role names that reflect responsibilities",
		"Consider creating custom roles for specific needs",
	];

	const securityConsiderations = [
		"Never share admin credentials",
		"Use strong passwords for all accounts",
		"Enable two-factor authentication when available",
		"Regularly audit user access and permissions",
		"Remove access for users who leave the organization",
		"Monitor for suspicious activity",
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
						7 min read
					</Badge>
				</div>
				<h1 className='text-4xl font-bold text-foreground'>
					{t("docs.userManagement.title") || "User Management"}
				</h1>
				<p className='text-xl text-muted-foreground'>
					{t("docs.userManagement.subtitle") ||
						"Learn how to invite team members, assign roles, and manage permissions effectively. Build a secure and collaborative workspace for your team."}
				</p>
			</div>

			{/* Overview */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='w-5 h-5 text-primary' />
						{t("docs.userManagement.overview.title") ||
							"Why User Management Matters"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground mb-4'>
						{t("docs.userManagement.overview.description") ||
							"Effective user management is crucial for maintaining security, enabling collaboration, and ensuring that team members have the right access to perform their roles effectively."}
					</p>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='text-center p-4 bg-muted/30 rounded-lg'>
							<Shield className='w-8 h-8 text-green-600 mx-auto mb-2' />
							<h4 className='font-medium text-foreground mb-1'>Security</h4>
							<p className='text-sm text-muted-foreground'>
								Control access to sensitive data
							</p>
						</div>
						<div className='text-center p-4 bg-muted/30 rounded-lg'>
							<Users className='w-8 h-8 text-blue-600 mx-auto mb-2' />
							<h4 className='font-medium text-foreground mb-1'>
								Collaboration
							</h4>
							<p className='text-sm text-muted-foreground'>
								Enable team productivity
							</p>
						</div>
						<div className='text-center p-4 bg-muted/30 rounded-lg'>
							<Settings className='w-8 h-8 text-purple-600 mx-auto mb-2' />
							<h4 className='font-medium text-foreground mb-1'>Control</h4>
							<p className='text-sm text-muted-foreground'>
								Manage permissions efficiently
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* User Roles */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.userManagement.roles.title") || "Understanding User Roles"}
				</h2>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{userRoles.map((role, index) => (
						<Card key={index} className='overflow-hidden'>
							<CardHeader className='bg-muted/30'>
								<div className='flex items-center gap-3 mb-2'>
									<div className={`p-2 ${role.bgColor} rounded-lg`}>
										<div className={role.color}>{role.icon}</div>
									</div>
									<div className='flex-1'>
										<div className='flex items-center gap-2'>
											<h3 className='font-semibold text-foreground'>
												{role.title}
											</h3>
											<Badge variant='outline' className='text-xs font-mono'>
												{role.role}
											</Badge>
											{role.recommended && (
												<Badge variant='secondary' className='text-xs'>
													Recommended
												</Badge>
											)}
										</div>
										<p className='text-sm text-muted-foreground'>
											{role.description}
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent className='p-4'>
								<ul className='space-y-1'>
									{role.permissions.map((permission, permIndex) => (
										<li
											key={permIndex}
											className='flex items-start gap-2 text-sm'>
											<CheckCircle className='w-3 h-3 text-green-600 mt-0.5 flex-shrink-0' />
											<span>{permission}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Invitation Process */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.userManagement.invitation.title") ||
						"User Invitation Process"}
				</h2>

				<div className='space-y-6'>
					{invitationProcess.map((step, index) => (
						<Card key={index} className='overflow-hidden'>
							<CardHeader className='bg-muted/30'>
								<div className='flex items-center gap-4'>
									<div className='flex items-center justify-center w-12 h-12 bg-primary rounded-full text-primary-foreground font-bold text-lg'>
										{step.step}
									</div>
									<div className='flex-1'>
										<div className='flex items-center gap-3 mb-2'>
											{step.icon}
											<CardTitle className='text-xl'>{step.title}</CardTitle>
										</div>
										<CardDescription className='text-base'>
											{step.description}
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='p-6'>
								<ul className='space-y-2'>
									{step.details.map((detail, detailIndex) => (
										<li key={detailIndex} className='flex items-start gap-2'>
											<div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0' />
											<span className='text-sm'>{detail}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Best Practices */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.userManagement.bestPractices.title") || "Best Practices"}
				</h2>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Info className='w-5 h-5 text-blue-600' />
							{t("docs.userManagement.bestPractices.subtitle") ||
								"Follow These Guidelines"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{bestPractices.map((practice, index) => (
								<div key={index} className='flex items-start gap-2'>
									<CheckCircle className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
									<span className='text-sm'>{practice}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Security Considerations */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.userManagement.security.title") || "Security Considerations"}
				</h2>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertTriangle className='w-5 h-5 text-orange-600' />
							{t("docs.userManagement.security.subtitle") ||
								"Keep Your Platform Secure"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{securityConsiderations.map((consideration, index) => (
								<div key={index} className='flex items-start gap-2'>
									<div className='w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0' />
									<span className='text-sm'>{consideration}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Common Scenarios */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.userManagement.scenarios.title") || "Common Scenarios"}
				</h2>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>New Team Member</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-sm text-muted-foreground mb-3'>
								Invite a new team member with appropriate permissions
							</p>
							<ol className='text-sm space-y-1'>
								<li>1. Send invitation with VIEWER role</li>
								<li>2. User accepts and creates account</li>
								<li>3. Gradually increase permissions as needed</li>
							</ol>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Role Change</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-sm text-muted-foreground mb-3'>
								Update user role when responsibilities change
							</p>
							<ol className='text-sm space-y-1'>
								<li>1. Review current permissions</li>
								<li>2. Update role in user settings</li>
								<li>3. Communicate changes to user</li>
							</ol>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>User Departure</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-sm text-muted-foreground mb-3'>
								Properly handle when users leave the organization
							</p>
							<ol className='text-sm space-y-1'>
								<li>1. Revoke all access immediately</li>
								<li>2. Export user's data if needed</li>
								<li>3. Remove user account</li>
							</ol>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Bulk Operations</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-sm text-muted-foreground mb-3'>
								Manage multiple users efficiently
							</p>
							<ol className='text-sm space-y-1'>
								<li>1. Use bulk selection tools</li>
								<li>2. Apply role changes to groups</li>
								<li>3. Monitor changes in audit logs</li>
							</ol>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Next Steps */}
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("docs.userManagement.nextSteps.title") || "What's Next?"}
				</h2>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Link href='/docs/security/permissions'>
						<Card className='hover:shadow-lg transition-all duration-200 cursor-pointer group'>
							<CardContent className='p-6'>
								<div className='flex items-center gap-3 mb-3'>
									<Shield className='w-6 h-6 text-primary' />
									<ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
								</div>
								<h3 className='font-semibold text-foreground mb-1'>
									{t("docs.userManagement.nextSteps.permissions") ||
										"Advanced Permissions"}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{t("docs.userManagement.nextSteps.permissionsDesc") ||
										"Learn about granular permission controls"}
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link href='/docs/security/audit-logs'>
						<Card className='hover:shadow-lg transition-all duration-200 cursor-pointer group'>
							<CardContent className='p-6'>
								<div className='flex items-center gap-3 mb-3'>
									<Settings className='w-6 h-6 text-primary' />
									<ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors' />
								</div>
								<h3 className='font-semibold text-foreground mb-1'>
									{t("docs.userManagement.nextSteps.audit") || "Audit Logs"}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{t("docs.userManagement.nextSteps.auditDesc") ||
										"Track user activities and changes"}
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
						{t("docs.userManagement.help.title") || "Need Help?"}
					</h3>
					<p className='text-sm text-muted-foreground mb-4'>
						{t("docs.userManagement.help.description") ||
							"Have questions about user management? Our support team is here to help you set up the right permissions for your team."}
					</p>
					<div className='flex flex-col sm:flex-row gap-3 justify-center'>
						<Link href='/docs/help'>
							<Button variant='outline' size='sm'>
								{t("docs.userManagement.help.helpCenter") || "Help Center"}
							</Button>
						</Link>
						<Link href='/#contact'>
							<Button size='sm'>
								{t("docs.userManagement.help.contact") || "Contact Support"}
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default UserManagementPage;
