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
	Lock,
	Key,
	Server,
	Database,
	Globe,
	CheckCircle,
	AlertTriangle,
	Info,
	Clock,
	ArrowRight,
	Eye,
	FileText,
	Zap,
} from "lucide-react";

const EncryptionPage = () => {
	const { t } = useLanguage();

	const encryptionLayers = [
		{
			layer: "Data at Rest",
			icon: <Database className='w-6 h-6' />,
			description: "Your data is encrypted when stored in our databases",
			details: [
				"AES-256 encryption for all database files",
				"Encrypted database backups and snapshots",
				"Secure key management with rotation",
				"Compliance with industry standards",
			],
			technology: "AES-256-GCM",
			implementation: "Database-level encryption with AWS KMS",
		},
		{
			layer: "Data in Transit",
			icon: <Globe className='w-6 h-6' />,
			description: "All data transmission is protected with TLS encryption",
			details: [
				"TLS 1.3 for all API communications",
				"HTTPS-only policy for web interface",
				"Certificate pinning for mobile apps",
				"Perfect Forward Secrecy (PFS)",
			],
			technology: "TLS 1.3",
			implementation: "End-to-end encryption for all communications",
		},
		{
			layer: "Data in Processing",
			icon: <Server className='w-6 h-6' />,
			description: "Data remains protected during processing and computation",
			details: [
				"Memory encryption for active data",
				"Secure processing environments",
				"Minimal data exposure during operations",
				"Encrypted temporary files and caches",
			],
			technology: "Memory Encryption",
			implementation: "Hardware-assisted security features",
		},
		{
			layer: "User Authentication",
			icon: <Key className='w-6 h-6' />,
			description: "Authentication credentials are securely managed",
			details: [
				"Hashed API keys with salt",
				"JWT tokens with secure algorithms",
				"Regular token rotation policies",
				"Encrypted storage of secrets",
			],
			technology: "bcrypt + JWT",
			implementation: "Industry-standard authentication security",
		},
	];

	const complianceStandards = [
		{
			standard: "SOC 2 Type II",
			description: "Comprehensive security controls audit",
			status: "Compliant",
			details: [
				"Annual third-party security audits",
				"Continuous monitoring and reporting",
				"Documented security policies",
				"Incident response procedures",
			],
		},
		{
			standard: "GDPR",
			description: "European data protection regulation compliance",
			status: "Compliant",
			details: [
				"Data privacy by design",
				"Right to be forgotten implementation",
				"Data processing transparency",
				"Cross-border data transfer safeguards",
			],
		},
		{
			standard: "ISO 27001",
			description: "Information security management systems",
			status: "In Progress",
			details: [
				"Risk assessment frameworks",
				"Security control implementation",
				"Management system documentation",
				"Continuous improvement processes",
			],
		},
		{
			standard: "HIPAA",
			description: "Healthcare data protection requirements",
			status: "Available",
			details: [
				"Business Associate Agreements (BAA)",
				"Enhanced encryption for PHI",
				"Audit logging and monitoring",
				"Access controls and authentication",
			],
		},
	];

	const securityFeatures = [
		{
			feature: "Zero-Knowledge Architecture",
			icon: <Eye className='w-5 h-5' />,
			description: "Your data is encrypted with keys only you control",
			benefits: [
				"YDV staff cannot access your raw data",
				"End-to-end encryption for sensitive information",
				"Client-side encryption for additional security",
				"You maintain full control over encryption keys",
			],
		},
		{
			feature: "Advanced Access Controls",
			icon: <Lock className='w-5 h-5' />,
			description: "Multi-layered access control and authentication",
			benefits: [
				"Multi-factor authentication (MFA) support",
				"Role-based access control (RBAC)",
				"IP allowlisting and geo-restrictions",
				"Session management and timeout controls",
			],
		},
		{
			feature: "Audit & Monitoring",
			icon: <FileText className='w-5 h-5' />,
			description: "Comprehensive logging and monitoring of all activities",
			benefits: [
				"Real-time security monitoring",
				"Detailed audit logs for all operations",
				"Anomaly detection and alerting",
				"Compliance reporting and analytics",
			],
		},
		{
			feature: "Secure Infrastructure",
			icon: <Server className='w-5 h-5' />,
			description: "Enterprise-grade security infrastructure",
			benefits: [
				"Isolated tenant environments",
				"Regular security patches and updates",
				"DDoS protection and rate limiting",
				"24/7 security monitoring and response",
			],
		},
	];

	const bestPractices = [
		{
			title: "Use Strong Authentication",
			description:
				"Enable multi-factor authentication and use strong passwords",
			icon: <Key className='w-5 h-5' />,
			recommendations: [
				"Enable MFA for all admin accounts",
				"Use unique, complex passwords",
				"Implement SSO where possible",
				"Regular password rotation policies",
			],
		},
		{
			title: "Monitor Access Patterns",
			description: "Regularly review user access and activity logs",
			icon: <Eye className='w-5 h-5' />,
			recommendations: [
				"Review audit logs monthly",
				"Set up alerts for unusual activity",
				"Monitor failed login attempts",
				"Track data access patterns",
			],
		},
		{
			title: "Secure API Usage",
			description: "Follow best practices for API security",
			icon: <Shield className='w-5 h-5' />,
			recommendations: [
				"Rotate API keys regularly",
				"Use environment variables for secrets",
				"Implement proper error handling",
				"Monitor API usage and quotas",
			],
		},
		{
			title: "Data Classification",
			description: "Classify and protect data based on sensitivity",
			icon: <Database className='w-5 h-5' />,
			recommendations: [
				"Identify sensitive data types",
				"Apply appropriate access controls",
				"Use field-level encryption for PII",
				"Regular data protection audits",
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
					<span className='text-foreground'>Encryption</span>
				</div>

				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-foreground'>
						Data Encryption & Security
					</h1>
					<p className='text-lg text-muted-foreground'>
						Comprehensive overview of how YDV protects your data with
						enterprise-grade encryption and security measures.
					</p>
				</div>

				<div className='flex items-center space-x-4'>
					<Badge variant='secondary'>
						<Clock className='w-3 h-3 mr-1' />
						10 min read
					</Badge>
					<Badge variant='outline'>Security</Badge>
					<Badge variant='outline'>Encryption</Badge>
					<Badge variant='outline'>Compliance</Badge>
				</div>
			</div>

			<Separator />

			{/* Encryption Overview */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Multi-Layer Encryption
					</h2>
					<p className='text-muted-foreground'>
						Your data is protected by multiple layers of encryption throughout
						its lifecycle - at rest, in transit, and during processing.
					</p>
				</div>

				<div className='space-y-6'>
					{encryptionLayers.map((layer, index) => (
						<Card key={index} className='hover:shadow-md transition-shadow'>
							<CardHeader>
								<div className='flex items-start space-x-3'>
									<div className='p-2 bg-blue-500/10 text-blue-600 rounded-lg'>
										{layer.icon}
									</div>
									<div className='space-y-1 flex-1'>
										<div className='flex items-center justify-between'>
											<CardTitle className='text-lg'>{layer.layer}</CardTitle>
											<Badge variant='outline' className='ml-2'>
												{layer.technology}
											</Badge>
										</div>
										<CardDescription>{layer.description}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Security Features:
										</h4>
										<ul className='text-sm text-muted-foreground space-y-1'>
											{layer.details.map((detail, idx) => (
												<li key={idx} className='flex items-start'>
													<CheckCircle className='w-3 h-3 mr-2 text-green-600 mt-0.5 flex-shrink-0' />
													{detail}
												</li>
											))}
										</ul>
									</div>
									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Implementation:
										</h4>
										<p className='text-sm text-muted-foreground'>
											{layer.implementation}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Compliance Standards */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Compliance & Certifications
					</h2>
					<p className='text-muted-foreground'>
						YDV meets and exceeds industry standards for data protection and
						security compliance.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{complianceStandards.map((compliance, index) => (
						<Card key={index}>
							<CardContent className='p-6'>
								<div className='space-y-4'>
									<div className='flex items-start justify-between'>
										<div className='space-y-1'>
											<h3 className='font-semibold text-foreground'>
												{compliance.standard}
											</h3>
											<p className='text-sm text-muted-foreground'>
												{compliance.description}
											</p>
										</div>
										<Badge
											variant={
												compliance.status === "Compliant"
													? "default"
													: compliance.status === "In Progress"
													? "secondary"
													: "outline"
											}
											className='ml-2'>
											{compliance.status}
										</Badge>
									</div>

									<ul className='text-sm text-muted-foreground space-y-1'>
										{compliance.details.map((detail, idx) => (
											<li key={idx} className='flex items-start'>
												<span className='w-1 h-1 bg-muted-foreground rounded-full mr-2 mt-2' />
												{detail}
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

			{/* Security Features */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Advanced Security Features
					</h2>
					<p className='text-muted-foreground'>
						Additional security measures and features that protect your data and
						ensure platform integrity.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{securityFeatures.map((feature, index) => (
						<Card key={index}>
							<CardContent className='p-6'>
								<div className='space-y-4'>
									<div className='flex items-start space-x-3'>
										<div className='p-2 bg-green-500/10 text-green-600 rounded-lg'>
											{feature.icon}
										</div>
										<div className='space-y-1'>
											<h3 className='font-semibold text-foreground'>
												{feature.feature}
											</h3>
											<p className='text-sm text-muted-foreground'>
												{feature.description}
											</p>
										</div>
									</div>

									<ul className='text-sm text-muted-foreground space-y-1 ml-11'>
										{feature.benefits.map((benefit, idx) => (
											<li key={idx} className='flex items-start'>
												<CheckCircle className='w-3 h-3 mr-2 text-green-600 mt-0.5 flex-shrink-0' />
												{benefit}
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

			{/* Security Best Practices */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Security Best Practices
					</h2>
					<p className='text-muted-foreground'>
						Follow these recommendations to maximize the security of your YDV
						implementation.
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
										{practice.recommendations.map((rec, idx) => (
											<li key={idx} className='flex items-start'>
												<span className='w-1 h-1 bg-muted-foreground rounded-full mr-2 mt-2' />
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

			{/* Security Incident Response */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Security Incident Response
					</h2>
					<p className='text-muted-foreground'>
						Our approach to handling security incidents and maintaining system
						integrity.
					</p>
				</div>

				<Card>
					<CardContent className='p-6'>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-red-500/10 text-red-600 rounded-lg w-fit mx-auto'>
									<AlertTriangle className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>Detection</h3>
									<p className='text-sm text-muted-foreground'>
										24/7 monitoring and automated threat detection systems
									</p>
								</div>
							</div>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-amber-500/10 text-amber-600 rounded-lg w-fit mx-auto'>
									<Zap className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>Response</h3>
									<p className='text-sm text-muted-foreground'>
										Immediate containment and escalation procedures
									</p>
								</div>
							</div>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-green-500/10 text-green-600 rounded-lg w-fit mx-auto'>
									<CheckCircle className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>Recovery</h3>
									<p className='text-sm text-muted-foreground'>
										System restoration and post-incident analysis
									</p>
								</div>
							</div>
						</div>

						<div className='mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
							<div className='flex items-start space-x-2'>
								<Info className='w-5 h-5 text-blue-600 mt-0.5' />
								<div>
									<p className='font-medium text-blue-800 dark:text-blue-200'>
										Incident Communication
									</p>
									<p className='text-sm text-blue-700 dark:text-blue-300'>
										We maintain transparent communication during security
										incidents through our status page and direct customer
										notifications for affected accounts.
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
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

					<Link href='/docs/security/audit-logs'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>Audit Logs</h3>
										<p className='text-sm text-muted-foreground'>
											Monitor and track all system activities
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

export default EncryptionPage;
