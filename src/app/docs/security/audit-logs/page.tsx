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
	FileText,
	Eye,
	User,
	Database,
	Settings,
	Download,
	Filter,
	Calendar,
	Clock,
	ArrowRight,
	Search,
	AlertTriangle,
	CheckCircle,
	Info,
	Shield,
} from "lucide-react";

const AuditLogsPage = () => {
	const { t } = useLanguage();

	const logTypes = [
		{
			type: "Authentication Events",
			icon: <User className='w-6 h-6' />,
			description: "Track user login, logout, and authentication activities",
			events: [
				"User login attempts (successful/failed)",
				"Password changes and resets",
				"MFA setup and verification",
				"Session timeouts and logouts",
				"API key generation and usage",
			],
			retention: "2 years",
			compliance: "SOC 2, GDPR",
		},
		{
			type: "Data Operations",
			icon: <Database className='w-6 h-6' />,
			description:
				"Monitor all data creation, modification, and deletion activities",
			events: [
				"Row creation, updates, and deletions",
				"Table schema modifications",
				"Database creation and configuration",
				"Data import and export operations",
				"Bulk operations and API calls",
			],
			retention: "5 years",
			compliance: "SOC 2, HIPAA",
		},
		{
			type: "Administrative Actions",
			icon: <Settings className='w-6 h-6' />,
			description: "Track administrative and configuration changes",
			events: [
				"User invitations and role changes",
				"Permission modifications",
				"Organization settings updates",
				"Webhook configuration changes",
			],
			retention: "7 years",
			compliance: "SOC 2, ISO 27001",
		},
		{
			type: "Security Events",
			icon: <Shield className='w-6 h-6' />,
			description: "Monitor security-related activities and potential threats",
			events: [
				"Failed login attempts and suspicious activity",
				"Permission escalation attempts",
				"Unusual data access patterns",
				"API rate limit violations",
				"Security configuration changes",
			],
			retention: "10 years",
			compliance: "SOC 2, ISO 27001",
		},
	];

	const logFields = [
		{
			field: "Timestamp",
			description: "Exact date and time when the event occurred",
			example: "2024-01-15T14:30:25.123Z",
			searchable: true,
		},
		{
			field: "User ID",
			description: "Unique identifier of the user who performed the action",
			example: "user_abc123",
			searchable: true,
		},
		{
			field: "Event Type",
			description: "Category and specific type of action performed",
			example: "data.row.created",
			searchable: true,
		},
		{
			field: "Resource",
			description: "The specific resource that was affected",
			example: "database/customers/table/contacts",
			searchable: true,
		},
		{
			field: "IP Address",
			description: "Source IP address of the request",
			example: "192.168.1.100",
			searchable: true,
		},
		{
			field: "User Agent",
			description: "Browser or application that made the request",
			example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
			searchable: false,
		},
		{
			field: "Result",
			description: "Success or failure status of the operation",
			example: "success | failure",
			searchable: true,
		},
		{
			field: "Changes",
			description: "Detailed information about what was modified",
			example: "{ old_value: 'John', new_value: 'Jane' }",
			searchable: false,
		},
	];

	const useCases = [
		{
			title: "Compliance Reporting",
			icon: <FileText className='w-5 h-5' />,
			description: "Generate audit reports for regulatory compliance",
			examples: [
				"SOC 2 audit trail documentation",
				"GDPR data processing records",
				"HIPAA access logs for PHI",
				"ISO 27001 security event reports",
			],
		},
		{
			title: "Security Monitoring",
			icon: <Eye className='w-5 h-5' />,
			description: "Detect and investigate suspicious activities",
			examples: [
				"Multiple failed login attempts",
				"Unusual data access patterns",
				"Permission changes outside business hours",
				"Large-scale data exports",
			],
		},
		{
			title: "Troubleshooting",
			icon: <Search className='w-5 h-5' />,
			description: "Debug issues and understand system behavior",
			examples: [
				"Track down data modification sources",
				"Investigate API errors and failures",
				"Understand user workflow patterns",
				"Debug permission-related issues",
			],
		},
		{
			title: "Change Management",
			icon: <Settings className='w-5 h-5' />,
			description: "Track and document system changes",
			examples: [
				"Schema evolution tracking",
				"Configuration change history",
				"User permission audit trails",
				"API integration monitoring",
			],
		},
	];

	const bestPractices = [
		{
			title: "Regular Log Review",
			description: "Establish a routine for reviewing audit logs",
			recommendations: [
				"Weekly review of security events",
				"Monthly compliance reporting",
				"Real-time alerts for critical events",
				"Quarterly comprehensive audit reviews",
			],
		},
		{
			title: "Retention Policies",
			description: "Implement appropriate log retention policies",
			recommendations: [
				"Follow regulatory requirements for your industry",
				"Balance storage costs with compliance needs",
				"Implement automated archival processes",
				"Document retention policy decisions",
			],
		},
		{
			title: "Access Control",
			description: "Restrict access to audit logs appropriately",
			recommendations: [
				"Limit log access to authorized personnel",
				"Use separate audit administrator roles",
				"Log access to audit logs themselves",
				"Implement multi-person authorization",
			],
		},
		{
			title: "Alerting and Monitoring",
			description: "Set up proactive monitoring and alerts",
			recommendations: [
				"Configure alerts for security events",
				"Monitor for unusual activity patterns",
				"Set up compliance violation notifications",
				"Implement automated incident response",
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
					<span className='text-foreground'>Audit Logs</span>
				</div>

				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-foreground'>
						Audit Logs & Activity Tracking
					</h1>
					<p className='text-lg text-muted-foreground'>
						Comprehensive logging and monitoring of all activities in your YDV
						platform for security, compliance, and troubleshooting.
					</p>
				</div>

				<div className='flex items-center space-x-4'>
					<Badge variant='secondary'>
						<Clock className='w-3 h-3 mr-1' />8 min read
					</Badge>
					<Badge variant='outline'>Security</Badge>
					<Badge variant='outline'>Audit Logs</Badge>
					<Badge variant='outline'>Compliance</Badge>
				</div>
			</div>

			<Separator />

			{/* What Are Audit Logs */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						What Are Audit Logs?
					</h2>
					<p className='text-muted-foreground'>
						Audit logs are detailed records of all activities and events that
						occur in your YDV platform, providing a complete trail of who did
						what, when, and from where.
					</p>
				</div>

				<Card>
					<CardContent className='p-6'>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-blue-500/10 text-blue-600 rounded-lg w-fit mx-auto'>
									<Eye className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>
										Complete Visibility
									</h3>
									<p className='text-sm text-muted-foreground'>
										Track every action across all platform features and APIs
									</p>
								</div>
							</div>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-green-500/10 text-green-600 rounded-lg w-fit mx-auto'>
									<Shield className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>
										Security Monitoring
									</h3>
									<p className='text-sm text-muted-foreground'>
										Detect suspicious activities and security threats
									</p>
								</div>
							</div>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-purple-500/10 text-purple-600 rounded-lg w-fit mx-auto'>
									<FileText className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>
										Compliance Ready
									</h3>
									<p className='text-sm text-muted-foreground'>
										Meet regulatory requirements with detailed audit trails
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Separator />

			{/* Types of Audit Logs */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Types of Audit Logs
					</h2>
					<p className='text-muted-foreground'>
						YDV captures comprehensive audit logs across all major activity
						categories.
					</p>
				</div>

				<div className='space-y-6'>
					{logTypes.map((type, index) => (
						<Card key={index} className='hover:shadow-md transition-shadow'>
							<CardHeader>
								<div className='flex items-start space-x-3'>
									<div className='p-2 bg-blue-500/10 text-blue-600 rounded-lg'>
										{type.icon}
									</div>
									<div className='space-y-1 flex-1'>
										<CardTitle className='text-lg'>{type.type}</CardTitle>
										<CardDescription>{type.description}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
									<div className='md:col-span-2'>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Logged Events:
										</h4>
										<ul className='text-sm text-muted-foreground space-y-1'>
											{type.events.map((event, idx) => (
												<li key={idx} className='flex items-start'>
													<CheckCircle className='w-3 h-3 mr-2 text-green-600 mt-0.5 flex-shrink-0' />
													{event}
												</li>
											))}
										</ul>
									</div>
									<div className='space-y-3'>
										<div>
											<h4 className='font-medium text-sm text-foreground mb-1'>
												Retention Period:
											</h4>
											<Badge variant='secondary'>{type.retention}</Badge>
										</div>
										<div>
											<h4 className='font-medium text-sm text-foreground mb-1'>
												Compliance:
											</h4>
											<p className='text-sm text-muted-foreground'>
												{type.compliance}
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

			{/* Log Structure */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Audit Log Structure
					</h2>
					<p className='text-muted-foreground'>
						Each audit log entry contains detailed information about the event,
						including context and metadata.
					</p>
				</div>

				<Card>
					<CardContent className='p-6'>
						<div className='space-y-4'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								{logFields.map((field, index) => (
									<div key={index} className='space-y-2'>
										<div className='flex items-center justify-between'>
											<h4 className='font-medium text-foreground'>
												{field.field}
											</h4>
											{field.searchable && (
												<Badge variant='outline' className='text-xs'>
													Searchable
												</Badge>
											)}
										</div>
										<p className='text-sm text-muted-foreground'>
											{field.description}
										</p>
										<code className='text-xs bg-muted px-2 py-1 rounded font-mono block'>
											{field.example}
										</code>
									</div>
								))}
							</div>

							<div className='mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
								<div className='flex items-start space-x-2'>
									<Info className='w-5 h-5 text-amber-600 mt-0.5' />
									<div>
										<p className='font-medium text-amber-800 dark:text-amber-200'>
											Data Privacy
										</p>
										<p className='text-sm text-amber-700 dark:text-amber-300'>
											Audit logs may contain sensitive information. Access is
											restricted to authorized users and follows strict privacy
											guidelines.
										</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Separator />

			{/* Use Cases */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Common Use Cases
					</h2>
					<p className='text-muted-foreground'>
						Audit logs serve multiple purposes from security monitoring to
						compliance reporting.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{useCases.map((useCase, index) => (
						<Card key={index}>
							<CardContent className='p-6'>
								<div className='space-y-4'>
									<div className='flex items-start space-x-3'>
										<div className='p-2 bg-primary/10 text-primary rounded-lg'>
											{useCase.icon}
										</div>
										<div className='space-y-1'>
											<h3 className='font-semibold text-foreground'>
												{useCase.title}
											</h3>
											<p className='text-sm text-muted-foreground'>
												{useCase.description}
											</p>
										</div>
									</div>

									<ul className='text-sm text-muted-foreground space-y-1 ml-11'>
										{useCase.examples.map((example, idx) => (
											<li key={idx} className='flex items-start'>
												<span className='w-1 h-1 bg-muted-foreground rounded-full mr-2 mt-2' />
												{example}
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

			{/* Accessing Audit Logs */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Accessing Audit Logs
					</h2>
					<p className='text-muted-foreground'>
						Multiple ways to access and analyze your audit log data.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					<Card>
						<CardContent className='p-6 text-center space-y-4'>
							<div className='p-3 bg-blue-500/10 text-blue-600 rounded-lg w-fit mx-auto'>
								<Eye className='w-8 h-8' />
							</div>
							<div>
								<h3 className='font-semibold text-foreground'>
									Dashboard Interface
								</h3>
								<p className='text-sm text-muted-foreground'>
									View and search logs through the web interface with filters
									and real-time updates
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6 text-center space-y-4'>
							<div className='p-3 bg-green-500/10 text-green-600 rounded-lg w-fit mx-auto'>
								<Download className='w-8 h-8' />
							</div>
							<div>
								<h3 className='font-semibold text-foreground'>
									Export & Download
								</h3>
								<p className='text-sm text-muted-foreground'>
									Export audit logs in CSV or JSON format for external analysis
									and reporting
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6 text-center space-y-4'>
							<div className='p-3 bg-purple-500/10 text-purple-600 rounded-lg w-fit mx-auto'>
								<Database className='w-8 h-8' />
							</div>
							<div>
								<h3 className='font-semibold text-foreground'>API Access</h3>
								<p className='text-sm text-muted-foreground'>
									Programmatic access to audit logs via REST API for integration
									with SIEM tools
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<Separator />

			{/* Best Practices */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Best Practices
					</h2>
					<p className='text-muted-foreground'>
						Recommendations for effectively using audit logs in your security
						and compliance programs.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{bestPractices.map((practice, index) => (
						<Card key={index}>
							<CardContent className='p-6'>
								<div className='space-y-4'>
									<div>
										<h3 className='font-semibold text-foreground'>
											{practice.title}
										</h3>
										<p className='text-sm text-muted-foreground'>
											{practice.description}
										</p>
									</div>

									<ul className='text-sm text-muted-foreground space-y-1'>
										{practice.recommendations.map((rec, idx) => (
											<li key={idx} className='flex items-start'>
												<CheckCircle className='w-3 h-3 mr-2 text-green-600 mt-0.5 flex-shrink-0' />
												{rec}
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
					<Link href='/docs/security/permissions'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											Permission System
										</h3>
										<p className='text-sm text-muted-foreground'>
											Learn about user roles and access control
										</p>
									</div>
									<ArrowRight className='w-5 h-5 text-muted-foreground' />
								</div>
							</CardContent>
						</Card>
					</Link>

					<Link href='/docs/security/encryption'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											Data Encryption
										</h3>
										<p className='text-sm text-muted-foreground'>
											Understand how your data is protected
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

export default AuditLogsPage;
