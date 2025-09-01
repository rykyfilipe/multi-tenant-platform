/** @format */
"use client";

import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	FileText,
	Shield,
	Cookie,
	Eye,
	AlertTriangle,
	CreditCard,
	Scale,
} from "lucide-react";

export default function LegalDocumentsPage() {
	const legalDocuments = [
		{
			title: "Terms & Conditions",
			description: "Our terms of service and user agreement",
			href: "/docs/legal/terms",
			icon: FileText,
			category: "Core Legal",
		},
		{
			title: "Privacy Policy",
			description: "How we collect, use, and protect your data",
			href: "/docs/legal/privacy",
			icon: Shield,
			category: "Core Legal",
		},
		{
			title: "Cookie Policy",
			description: "Information about cookies and tracking technologies",
			href: "/docs/legal/cookies",
			icon: Cookie,
			category: "Core Legal",
		},
		{
			title: "Data Processing Agreement",
			description: "GDPR-compliant data processing terms",
			href: "/docs/legal/dpa",
			icon: Eye,
			category: "GDPR Compliance",
		},
		{
			title: "Refund Policy",
			description: "Our subscription refund and cancellation terms",
			href: "/docs/legal/refund",
			icon: CreditCard,
			category: "Billing",
		},
		{
			title: "Acceptable Use Policy",
			description: "Guidelines for acceptable platform usage",
			href: "/docs/legal/acceptable-use",
			icon: AlertTriangle,
			category: "Usage",
		},
		{
			title: "Service Level Agreement",
			description: "Uptime guarantees and service commitments",
			href: "/docs/legal/sla",
			icon: Scale,
			category: "Service",
		},
	];

	const categories = [...new Set(legalDocuments.map((doc) => doc.category))];

	return (
		<div className='container mx-auto px-4 py-8 max-w-4xl'>
			<div className='text-center mb-12'>
				<h1 className='text-4xl font-bold text-foreground mb-4'>
					Legal Documents
				</h1>
				<p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
					Complete legal documentation for our multi-tenant SaaS platform. These
					documents ensure compliance with international laws and protect both
					our users and our platform.
				</p>
			</div>

			{categories.map((category) => (
				<div key={category} className='mb-12'>
					<h2 className='text-2xl font-semibold text-foreground mb-6'>
						{category}
					</h2>
					<div className='grid gap-6 md:grid-cols-2'>
						{legalDocuments
							.filter((doc) => doc.category === category)
							.map((document) => {
								const Icon = document.icon;
								return (
									<Link key={document.href} href={document.href}>
										<Card className='h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-border bg-card'>
											<CardHeader className='pb-3'>
												<div className='flex items-center gap-3'>
													<div className='p-2 rounded-lg bg-primary/10'>
														<Icon className='h-5 w-5 text-primary' />
													</div>
													<CardTitle className='text-lg'>
														{document.title}
													</CardTitle>
												</div>
											</CardHeader>
											<CardContent>
												<CardDescription className='text-muted-foreground'>
													{document.description}
												</CardDescription>
											</CardContent>
										</Card>
									</Link>
								);
							})}
					</div>
				</div>
			))}

			<div className='mt-16 p-6 bg-muted/50 rounded-lg border border-border'>
				<h3 className='text-lg font-semibold text-foreground mb-3'>
					Important Notice
				</h3>
				<p className='text-muted-foreground text-sm mb-4'>
					These legal documents are designed to provide comprehensive coverage
					for our multi-tenant SaaS platform. However, we recommend consulting
					with a qualified legal professional to ensure these documents meet
					your specific business requirements and jurisdiction. The documents
					contain TODO placeholders that should be customized with your
					company-specific information before deployment.
				</p>
				<div className='flex justify-center'>
					<a
						href='/docs/legal/configure'
						className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'>
						Configure Company Information
					</a>
				</div>
			</div>
		</div>
	);
}
