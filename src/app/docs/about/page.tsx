/** @format */

import React from "react";
import { Database, Users, Shield, Zap, Globe, Settings } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
	const team = [
		{
			name: "Development Team",
			role: "Core Development",
			description: "Building the future of multi-tenant database management",
		},
		{
			name: "Product Team",
			role: "Product & Design",
			description: "Creating intuitive user experiences and powerful features",
		},
		{
			name: "Support Team",
			role: "Customer Success",
			description: "Ensuring your success with YDV platform",
		},
	];

	const values = [
		{
			icon: <Shield className='w-6 h-6' />,
			title: "Security First",
			description:
				"Enterprise-grade security with SOC 2 compliance and end-to-end encryption",
		},
		{
			icon: <Zap className='w-6 h-6' />,
			title: "Performance",
			description: "Lightning-fast operations and real-time data processing",
		},
		{
			icon: <Users className='w-6 h-6' />,
			title: "User-Centric",
			description:
				"Built for developers and teams who need powerful, easy-to-use tools",
		},
		{
			icon: <Globe className='w-6 h-6' />,
			title: "Global Access",
			description:
				"Access your data from anywhere, anytime with our cloud platform",
		},
		{
			icon: <Settings className='w-6 h-6' />,
			title: "Simplicity",
			description: "No coding required - get started in minutes, not days",
		},
		{
			icon: <Database className='w-6 h-6' />,
			title: "Flexibility",
			description:
				"Multi-tenant architecture that scales with your business needs",
		},
	];

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4'>
				<Badge variant='secondary' className='px-4 py-2'>
					About YDV
				</Badge>
				<h1 className='text-4xl font-bold text-foreground'>
					Your Data Your View
				</h1>
				<p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
					We're building the future of multi-tenant database management, making
					it easier for teams to create, manage, and share data across multiple
					projects and clients.
				</p>
			</div>

			{/* Mission */}
			<Card>
				<CardHeader>
					<CardTitle className='text-2xl'>Our Mission</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<p className='text-muted-foreground leading-relaxed'>
						YDV was born from the need to simplify complex database management
						for teams working with multiple clients and projects. Traditional
						database solutions were either too complex for non-technical users
						or too limited for enterprise needs.
					</p>
					<p className='text-muted-foreground leading-relaxed'>
						We believe that data management should be accessible to everyone,
						regardless of technical expertise. Our platform combines the power
						of enterprise-grade databases with the simplicity of no-code tools,
						enabling teams to focus on what matters most - their data and their
						business.
					</p>
				</CardContent>
			</Card>

			{/* Values */}
			<div className='space-y-6'>
				<h2 className='text-3xl font-bold text-foreground text-center'>
					Our Values
				</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					{values.map((value, index) => (
						<Card key={index} className='hover:shadow-lg transition-shadow'>
							<CardHeader>
								<div className='p-3 bg-primary/10 rounded-lg w-fit'>
									{value.icon}
								</div>
								<CardTitle className='text-lg'>{value.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className='text-sm leading-relaxed'>
									{value.description}
								</CardDescription>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Team */}
			<div className='space-y-6'>
				<h2 className='text-3xl font-bold text-foreground text-center'>
					Our Team
				</h2>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					{team.map((member, index) => (
						<Card key={index} className='text-center'>
							<CardHeader>
								<CardTitle className='text-lg'>{member.name}</CardTitle>
								<Badge variant='outline'>{member.role}</Badge>
							</CardHeader>
							<CardContent>
								<CardDescription className='text-sm'>
									{member.description}
								</CardDescription>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Contact */}
			<Card>
				<CardHeader>
					<CardTitle className='text-2xl'>Get in Touch</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground mb-4'>
						Have questions, feedback, or want to learn more about YDV? We'd love
						to hear from you.
					</p>
					<div className='space-y-2'>
						<p className='text-sm'>
							<strong>Email:</strong>{" "}
							<a
								href='mailto:contact@ydv.com'
								className='text-primary hover:underline'>
								contact@ydv.com
							</a>
						</p>
						<p className='text-sm'>
							<strong>Support:</strong>{" "}
							<a href='/docs/help' className='text-primary hover:underline'>
								Help Center
							</a>
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
