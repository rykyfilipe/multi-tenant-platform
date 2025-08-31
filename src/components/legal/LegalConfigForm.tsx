/** @format */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Copy, Download } from "lucide-react";
import { legalConfig } from "@/lib/legal-config";

export default function LegalConfigForm() {
	const [config, setConfig] = useState(legalConfig);
	const [copied, setCopied] = useState(false);
	const [saved, setSaved] = useState(false);

	const handleInputChange = (section: string, field: string, value: string) => {
		setConfig((prev) => ({
			...prev,
			[section]: {
				...prev[section as keyof typeof prev],
				[field]: value,
			},
		}));
	};

	const handleNestedInputChange = (
		section: string,
		subsection: string,
		field: string,
		value: string,
	) => {
		setConfig((prev) => ({
			...prev,
			[section]: {
				...prev[section as keyof typeof prev],
				[subsection]: {
					...(prev[section as keyof typeof prev] as any)[subsection],
					[field]: value,
				},
			},
		}));
	};

	const handleArrayInputChange = (
		section: string,
		field: string,
		value: string,
	) => {
		const arrayValue = value.split("\n").filter((item) => item.trim());
		setConfig((prev) => ({
			...prev,
			[section]: {
				...prev[section as keyof typeof prev],
				[field]: arrayValue,
			},
		}));
	};

	const copyConfig = () => {
		const configText = `// Legal Documents Configuration
// Copy this configuration and replace the content in src/lib/legal-config.ts

export const legalConfig = ${JSON.stringify(config, null, 2)}

// Helper function to get formatted company address
export const getCompanyAddress = () => {
  const { address } = legalConfig.company
  return \`\${address.street}, \${address.city}, \${address.state} \${address.postalCode}, \${address.country}\`
}

// Helper function to get full company name with legal name
export const getFullCompanyName = () => {
  if (legalConfig.company.legalName !== legalConfig.company.name) {
    return \`\${legalConfig.company.name} (\${legalConfig.company.legalName})\`
  }
  return legalConfig.company.name
}`;

		navigator.clipboard.writeText(configText);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const downloadConfig = () => {
		const configText = `// Legal Documents Configuration
// Copy this configuration and replace the content in src/lib/legal-config.ts

export const legalConfig = ${JSON.stringify(config, null, 2)}

// Helper function to get formatted company address
export const getCompanyAddress = () => {
  const { address } = legalConfig.company
  return \`\${address.street}, \${address.city}, \${address.state} \${address.postalCode}, \${address.country}\`
}

// Helper function to get full company name with legal name
export const getFullCompanyName = () => {
  if (legalConfig.company.legalName !== legalConfig.company.name) {
    return \`\${legalConfig.company.name} (\${legalConfig.company.legalName})\`
  }
  return legalConfig.company.name
}`;

		const blob = new Blob([configText], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "legal-config.ts";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const saveToLocalStorage = () => {
		localStorage.setItem("legalConfig", JSON.stringify(config));
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	return (
		<div className='container mx-auto px-4 py-8 max-w-6xl'>
			<div className='text-center mb-8'>
				<h1 className='text-4xl font-bold text-foreground mb-4'>
					Legal Documents Configuration
				</h1>
				<p className='text-lg text-muted-foreground max-w-3xl mx-auto'>
					Update your company information below to automatically populate all
					legal documents. This form will help you customize the TODO
					placeholders in your legal documents.
				</p>
			</div>

			{saved && (
				<Alert className='mb-6 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800'>
					<CheckCircle className='h-4 w-4 text-green-600' />
					<AlertDescription className='text-green-800 dark:text-green-200'>
						Configuration saved to local storage successfully!
					</AlertDescription>
				</Alert>
			)}

			<div className='mb-6 flex gap-4 justify-center'>
				<Button
					onClick={copyConfig}
					variant='outline'
					className='flex items-center gap-2'>
					<Copy className='h-4 w-4' />
					{copied ? "Copied!" : "Copy Configuration"}
				</Button>
				<Button
					onClick={downloadConfig}
					variant='outline'
					className='flex items-center gap-2'>
					<Download className='h-4 w-4' />
					Download Config
				</Button>
				<Button
					onClick={saveToLocalStorage}
					className='flex items-center gap-2'>
					<CheckCircle className='h-4 w-4' />
					Save to Local Storage
				</Button>
			</div>

			<Tabs defaultValue='company' className='space-y-6'>
				<TabsList className='grid w-full grid-cols-6'>
					<TabsTrigger value='company'>Company</TabsTrigger>
					<TabsTrigger value='legal'>Legal</TabsTrigger>
					<TabsTrigger value='services'>Services</TabsTrigger>
					<TabsTrigger value='policies'>Policies</TabsTrigger>
					<TabsTrigger value='dates'>Dates</TabsTrigger>
					<TabsTrigger value='platform'>Platform</TabsTrigger>
				</TabsList>

				<TabsContent value='company' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Company Information</CardTitle>
							<CardDescription>
								Basic company details and contact information
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='companyName'>Company Name</Label>
									<Input
										id='companyName'
										value={config.company.name}
										onChange={(e) =>
											handleInputChange("company", "name", e.target.value)
										}
										placeholder='Your Company Name'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='legalName'>Legal Company Name</Label>
									<Input
										id='legalName'
										value={config.company.legalName}
										onChange={(e) =>
											handleInputChange("company", "legalName", e.target.value)
										}
										placeholder='Legal Company Name (if different)'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='website'>Website</Label>
									<Input
										id='website'
										value={config.company.website}
										onChange={(e) =>
											handleInputChange("company", "website", e.target.value)
										}
										placeholder='https://yourcompany.com'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='phone'>Phone Number</Label>
									<Input
										id='phone'
										value={config.company.phone}
										onChange={(e) =>
											handleInputChange("company", "phone", e.target.value)
										}
										placeholder='+1-XXX-XXX-XXXX'
									/>
								</div>
							</div>

							<div className='space-y-4'>
								<h4 className='font-semibold'>Email Addresses</h4>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='legalEmail'>Legal Email</Label>
										<Input
											id='legalEmail'
											value={config.company.email.legal}
											onChange={(e) =>
												handleNestedInputChange(
													"company",
													"email",
													"legal",
													e.target.value,
												)
											}
											placeholder='legal@yourcompany.com'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='supportEmail'>Support Email</Label>
										<Input
											id='supportEmail'
											value={config.company.email.support}
											onChange={(e) =>
												handleNestedInputChange(
													"company",
													"email",
													"support",
													e.target.value,
												)
											}
											placeholder='support@yourcompany.com'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='privacyEmail'>Privacy Email</Label>
										<Input
											id='privacyEmail'
											value={config.company.email.privacy}
											onChange={(e) =>
												handleNestedInputChange(
													"company",
													"email",
													"privacy",
													e.target.value,
												)
											}
											placeholder='privacy@yourcompany.com'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='generalEmail'>General Email</Label>
										<Input
											id='generalEmail'
											value={config.company.email.general}
											onChange={(e) =>
												handleNestedInputChange(
													"company",
													"email",
													"general",
													e.target.value,
												)
											}
											placeholder='info@yourcompany.com'
										/>
									</div>
								</div>
							</div>

							<div className='space-y-4'>
								<h4 className='font-semibold'>Company Address</h4>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='street'>Street Address</Label>
										<Input
											id='street'
											value={config.company.address.street}
											onChange={(e) =>
												handleNestedInputChange(
													"company",
													"address",
													"street",
													e.target.value,
												)
											}
											placeholder='123 Business Street'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='city'>City</Label>
										<Input
											id='city'
											value={config.company.address.city}
											onChange={(e) =>
												handleNestedInputChange(
													"company",
													"address",
													"city",
													e.target.value,
												)
											}
											placeholder='City'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='state'>State/Province</Label>
										<Input
											id='state'
											value={config.company.address.state}
											onChange={(e) =>
												handleNestedInputChange(
													"company",
													"address",
													"state",
													e.target.value,
												)
											}
											placeholder='State/Province'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='postalCode'>Postal Code</Label>
										<Input
											id='postalCode'
											value={config.company.address.postalCode}
											onChange={(e) =>
												handleNestedInputChange(
													"company",
													"address",
													"postalCode",
													e.target.value,
												)
											}
											placeholder='12345'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='country'>Country</Label>
										<Input
											id='country'
											value={config.company.address.country}
											onChange={(e) =>
												handleNestedInputChange(
													"company",
													"address",
													"country",
													e.target.value,
												)
											}
											placeholder='Country'
										/>
									</div>
								</div>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='taxId'>Tax ID Number</Label>
									<Input
										id='taxId'
										value={config.company.taxId}
										onChange={(e) =>
											handleInputChange("company", "taxId", e.target.value)
										}
										placeholder='Tax ID Number'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='registrationNumber'>
										Business Registration Number
									</Label>
									<Input
										id='registrationNumber'
										value={config.company.registrationNumber}
										onChange={(e) =>
											handleInputChange(
												"company",
												"registrationNumber",
												e.target.value,
											)
										}
										placeholder='Business Registration Number'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='jurisdiction'>Jurisdiction</Label>
									<Input
										id='jurisdiction'
										value={config.company.jurisdiction}
										onChange={(e) =>
											handleInputChange(
												"company",
												"jurisdiction",
												e.target.value,
											)
										}
										placeholder='e.g., Delaware, United States'
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='legal' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Legal and Compliance</CardTitle>
							<CardDescription>
								Legal jurisdiction and dispute resolution information
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='governingLaw'>Governing Law</Label>
									<Input
										id='governingLaw'
										value={config.legal.governingLaw}
										onChange={(e) =>
											handleInputChange("legal", "governingLaw", e.target.value)
										}
										placeholder='e.g., Delaware, United States'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='arbitrationOrganization'>
										Arbitration Organization
									</Label>
									<Input
										id='arbitrationOrganization'
										value={config.legal.arbitrationOrganization}
										onChange={(e) =>
											handleInputChange(
												"legal",
												"arbitrationOrganization",
												e.target.value,
											)
										}
										placeholder='e.g., American Arbitration Association'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='arbitrationLocation'>
										Arbitration Location
									</Label>
									<Input
										id='arbitrationLocation'
										value={config.legal.arbitrationLocation}
										onChange={(e) =>
											handleInputChange(
												"legal",
												"arbitrationLocation",
												e.target.value,
											)
										}
										placeholder='e.g., New York, United States'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='dataProtectionOfficer'>
										Data Protection Officer
									</Label>
									<Input
										id='dataProtectionOfficer'
										value={config.legal.dataProtectionOfficer}
										onChange={(e) =>
											handleInputChange(
												"legal",
												"dataProtectionOfficer",
												e.target.value,
											)
										}
										placeholder='Data Protection Officer Name'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='representativeEU'>
										EU Representative (if applicable)
									</Label>
									<Input
										id='representativeEU'
										value={config.legal.representativeEU}
										onChange={(e) =>
											handleInputChange(
												"legal",
												"representativeEU",
												e.target.value,
											)
										}
										placeholder='EU Representative if applicable'
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='services' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Service Providers</CardTitle>
							<CardDescription>
								Third-party services and infrastructure providers
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='cloudProvider'>Cloud Provider</Label>
									<Input
										id='cloudProvider'
										value={config.services.cloudProvider}
										onChange={(e) =>
											handleInputChange(
												"services",
												"cloudProvider",
												e.target.value,
											)
										}
										placeholder='e.g., AWS, Google Cloud, Azure'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='emailProvider'>Email Provider</Label>
									<Input
										id='emailProvider'
										value={config.services.emailProvider}
										onChange={(e) =>
											handleInputChange(
												"services",
												"emailProvider",
												e.target.value,
											)
										}
										placeholder='e.g., SendGrid, Mailgun'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='analyticsProvider'>Analytics Provider</Label>
									<Input
										id='analyticsProvider'
										value={config.services.analyticsProvider}
										onChange={(e) =>
											handleInputChange(
												"services",
												"analyticsProvider",
												e.target.value,
											)
										}
										placeholder='e.g., Google Analytics, Mixpanel'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='hostingProvider'>Hosting Provider</Label>
									<Input
										id='hostingProvider'
										value={config.services.hostingProvider}
										onChange={(e) =>
											handleInputChange(
												"services",
												"hostingProvider",
												e.target.value,
											)
										}
										placeholder='e.g., Vercel, Netlify'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='supportProvider'>Support Provider</Label>
									<Input
										id='supportProvider'
										value={config.services.supportProvider}
										onChange={(e) =>
											handleInputChange(
												"services",
												"supportProvider",
												e.target.value,
											)
										}
										placeholder='e.g., Zendesk, Intercom'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='monitoringProvider'>
										Monitoring Provider
									</Label>
									<Input
										id='monitoringProvider'
										value={config.services.monitoringProvider}
										onChange={(e) =>
											handleInputChange(
												"services",
												"monitoringProvider",
												e.target.value,
											)
										}
										placeholder='e.g., DataDog, New Relic'
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='policies' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Business Policies</CardTitle>
							<CardDescription>
								Refund, cancellation, and service level policies
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='refundPeriod'>Refund Period</Label>
									<Input
										id='refundPeriod'
										value={config.policies.refundPeriod}
										onChange={(e) =>
											handleInputChange(
												"policies",
												"refundPeriod",
												e.target.value,
											)
										}
										placeholder='e.g., 30 days'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='cancellationNotice'>
										Cancellation Notice Period
									</Label>
									<Input
										id='cancellationNotice'
										value={config.policies.cancellationNotice}
										onChange={(e) =>
											handleInputChange(
												"policies",
												"cancellationNotice",
												e.target.value,
											)
										}
										placeholder='e.g., 30 days'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='dataRetentionPeriod'>
										Data Retention Period
									</Label>
									<Input
										id='dataRetentionPeriod'
										value={config.policies.dataRetentionPeriod}
										onChange={(e) =>
											handleInputChange(
												"policies",
												"dataRetentionPeriod",
												e.target.value,
											)
										}
										placeholder='e.g., 90 days after cancellation'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='uptimeGuarantee'>Uptime Guarantee</Label>
									<Input
										id='uptimeGuarantee'
										value={config.policies.uptimeGuarantee}
										onChange={(e) =>
											handleInputChange(
												"policies",
												"uptimeGuarantee",
												e.target.value,
											)
										}
										placeholder='e.g., 99.9%'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='supportResponseTime'>
										Support Response Time
									</Label>
									<Input
										id='supportResponseTime'
										value={config.policies.supportResponseTime}
										onChange={(e) =>
											handleInputChange(
												"policies",
												"supportResponseTime",
												e.target.value,
											)
										}
										placeholder='e.g., 24 hours'
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='dates' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Dates and Versioning</CardTitle>
							<CardDescription>
								Effective dates and document versioning
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='effectiveDate'>Effective Date</Label>
									<Input
										id='effectiveDate'
										value={config.dates.effectiveDate}
										onChange={(e) =>
											handleInputChange(
												"dates",
												"effectiveDate",
												e.target.value,
											)
										}
										placeholder='e.g., January 1, 2025'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='lastUpdated'>Last Updated Date</Label>
									<Input
										id='lastUpdated'
										value={config.dates.lastUpdated}
										onChange={(e) =>
											handleInputChange("dates", "lastUpdated", e.target.value)
										}
										placeholder='e.g., January 1, 2025'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='version'>Version Number</Label>
									<Input
										id='version'
										value={config.dates.version}
										onChange={(e) =>
											handleInputChange("dates", "version", e.target.value)
										}
										placeholder='e.g., 1.0'
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='platform' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Platform Information</CardTitle>
							<CardDescription>
								Service description and platform features
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='space-y-2'>
								<Label htmlFor='serviceDescription'>Service Description</Label>
								<Input
									id='serviceDescription'
									value={config.platform.serviceDescription}
									onChange={(e) =>
										handleInputChange(
											"platform",
											"serviceDescription",
											e.target.value,
										)
									}
									placeholder='e.g., multi-tenant SaaS database management platform'
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='mainFeatures'>
									Main Features (one per line)
								</Label>
								<Textarea
									id='mainFeatures'
									value={config.platform.mainFeatures.join("\n")}
									onChange={(e) =>
										handleArrayInputChange(
											"platform",
											"mainFeatures",
											e.target.value,
										)
									}
									placeholder='Create and manage custom databases and tables&#10;Store, organize, and analyze business data&#10;Manage user permissions and access controls'
									rows={6}
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='dataTypes'>Data Types (one per line)</Label>
								<Textarea
									id='dataTypes'
									value={config.platform.dataTypes.join("\n")}
									onChange={(e) =>
										handleArrayInputChange(
											"platform",
											"dataTypes",
											e.target.value,
										)
									}
									placeholder='Database structures and table schemas&#10;Business records and transactional data&#10;User permissions and access controls'
									rows={6}
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Alert className='mt-8 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800'>
				<AlertCircle className='h-4 w-4 text-blue-600' />
				<AlertDescription className='text-blue-800 dark:text-blue-200'>
					<strong>Next Steps:</strong> After filling out this form, copy the
					generated configuration and replace the content in{" "}
					<code>src/lib/legal-config.ts</code>. All your legal documents will
					automatically use this information instead of the TODO placeholders.
				</AlertDescription>
			</Alert>
		</div>
	);
}
