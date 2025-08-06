/** @format */

import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, ArrowRight, Tag } from "lucide-react";

export default function BlogPage() {
	const blogPosts = [
		{
			id: 1,
			title: "Introducing YDV: The Future of Multi-Tenant Database Management",
			excerpt:
				"We're excited to announce the launch of YDV, a revolutionary platform that makes multi-tenant database management accessible to everyone. Learn about our vision and what makes YDV different.",
			author: "YDV Team",
			date: "2025-01-15",
			readTime: "5 min read",
			tags: ["Announcement", "Product Launch"],
			featured: true,
		},
		{
			id: 2,
			title: "Building Secure Multi-Tenant Applications: Best Practices",
			excerpt:
				"Security is paramount when dealing with multiple clients' data. Discover the best practices we've implemented in YDV to ensure your data remains secure and isolated.",
			author: "Security Team",
			date: "2025-01-10",
			readTime: "8 min read",
			tags: ["Security", "Best Practices"],
			featured: false,
		},
		{
			id: 3,
			title: "Getting Started with YDV API: A Complete Guide",
			excerpt:
				"Learn how to integrate YDV into your applications using our comprehensive REST API. From authentication to advanced queries, we cover everything you need to know.",
			author: "Developer Relations",
			date: "2025-01-05",
			readTime: "12 min read",
			tags: ["API", "Tutorial"],
			featured: false,
		},
		{
			id: 4,
			title:
				"The Evolution of Database Management: From Traditional to Multi-Tenant",
			excerpt:
				"Explore how database management has evolved over the years and why multi-tenant architectures are becoming the standard for modern applications.",
			author: "Product Team",
			date: "2024-12-28",
			readTime: "6 min read",
			tags: ["Database", "Architecture"],
			featured: false,
		},
		{
			id: 5,
			title: "Performance Optimization in Multi-Tenant Environments",
			excerpt:
				"Discover the techniques and strategies we use to ensure optimal performance across multiple tenants while maintaining data isolation and security.",
			author: "Engineering Team",
			date: "2024-12-20",
			readTime: "10 min read",
			tags: ["Performance", "Engineering"],
			featured: false,
		},
		{
			id: 6,
			title: "User Management and Permissions: A Deep Dive",
			excerpt:
				"Learn about YDV's advanced user management system and how granular permissions help you control access to your data across different teams and clients.",
			author: "Product Team",
			date: "2024-12-15",
			readTime: "7 min read",
			tags: ["User Management", "Permissions"],
			featured: false,
		},
	];

	const categories = [
		{ name: "All", count: blogPosts.length },
		{ name: "Product Updates", count: 1 },
		{ name: "Security", count: 1 },
		{ name: "API", count: 1 },
		{ name: "Best Practices", count: 2 },
		{ name: "Engineering", count: 1 },
	];

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4'>
				<Badge variant='secondary' className='px-4 py-2'>
					YDV Blog
				</Badge>
				<h1 className='text-4xl font-bold text-foreground'>
					Latest Updates & Insights
				</h1>
				<p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
					Stay up to date with the latest features, best practices, and insights
					from the YDV team. Learn how to make the most of your multi-tenant
					database platform.
				</p>
			</div>

			{/* Categories */}
			<div className='flex flex-wrap gap-2 justify-center'>
				{categories.map((category, index) => (
					<Button
						key={index}
						variant={index === 0 ? "default" : "outline"}
						size='sm'
						className='rounded-full'>
						{category.name}
						<Badge variant='secondary' className='ml-2 text-xs'>
							{category.count}
						</Badge>
					</Button>
				))}
			</div>

			{/* Featured Post */}
			{blogPosts
				.filter((post) => post.featured)
				.map((post) => (
					<Card key={post.id} className='border-2 border-primary/20'>
						<CardHeader>
							<div className='flex items-center gap-2 mb-2'>
								<Badge variant='default'>Featured</Badge>
								{post.tags.map((tag, index) => (
									<Badge key={index} variant='outline' className='text-xs'>
										{tag}
									</Badge>
								))}
							</div>
							<CardTitle className='text-2xl'>{post.title}</CardTitle>
							<CardDescription className='text-base leading-relaxed'>
								{post.excerpt}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-4 text-sm text-muted-foreground'>
									<div className='flex items-center gap-1'>
										<User className='w-4 h-4' />
										{post.author}
									</div>
									<div className='flex items-center gap-1'>
										<Calendar className='w-4 h-4' />
										{new Date(post.date).toLocaleDateString()}
									</div>
									<div className='flex items-center gap-1'>
										<Clock className='w-4 h-4' />
										{post.readTime}
									</div>
								</div>
								<Button>
									Read More
									<ArrowRight className='w-4 h-4 ml-2' />
								</Button>
							</div>
						</CardContent>
					</Card>
				))}

			{/* Blog Posts Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{blogPosts
					.filter((post) => !post.featured)
					.map((post) => (
						<Card key={post.id} className='hover:shadow-lg transition-shadow'>
							<CardHeader>
								<div className='flex items-center gap-2 mb-2'>
									{post.tags.map((tag, index) => (
										<Badge key={index} variant='outline' className='text-xs'>
											{tag}
										</Badge>
									))}
								</div>
								<CardTitle className='text-lg line-clamp-2'>
									{post.title}
								</CardTitle>
								<CardDescription className='line-clamp-3'>
									{post.excerpt}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-4 text-xs text-muted-foreground'>
										<div className='flex items-center gap-1'>
											<User className='w-3 h-3' />
											{post.author}
										</div>
										<div className='flex items-center gap-1'>
											<Calendar className='w-3 h-3' />
											{new Date(post.date).toLocaleDateString()}
										</div>
									</div>
									<Button variant='ghost' size='sm'>
										<ArrowRight className='w-4 h-4' />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
			</div>

			{/* Newsletter Signup */}
			<Card className='bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20'>
				<CardHeader className='text-center'>
					<CardTitle className='text-2xl'>Stay Updated</CardTitle>
					<CardDescription className='text-base'>
						Get the latest updates, tutorials, and insights delivered to your
						inbox.
					</CardDescription>
				</CardHeader>
				<CardContent className='text-center'>
					<div className='flex flex-col sm:flex-row gap-4 max-w-md mx-auto'>
						<input
							type='email'
							placeholder='Enter your email'
							className='flex-1 px-4 py-2 border border-border rounded-lg bg-background'
						/>
						<Button>Subscribe</Button>
					</div>
					<p className='text-xs text-muted-foreground mt-2'>
						No spam, unsubscribe at any time.
					</p>
				</CardContent>
			</Card>

			{/* Coming Soon */}
			<Card className='border-dashed'>
				<CardHeader className='text-center'>
					<CardTitle className='text-xl'>More Content Coming Soon</CardTitle>
					<CardDescription>
						We're working on more articles, tutorials, and insights. Follow us
						to stay updated!
					</CardDescription>
				</CardHeader>
				<CardContent className='text-center'>
					<div className='space-y-2 text-sm text-muted-foreground'>
						<p>• Advanced API tutorials</p>
						<p>• Security best practices</p>
						<p>• Performance optimization guides</p>
						<p>• Case studies and success stories</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
