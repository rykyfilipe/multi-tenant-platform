/** @format */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
	Search, 
	BookOpen, 
	Video, 
	MessageCircle, 
	ExternalLink,
	ChevronRight,
	Star,
	Clock,
	Users,
	HelpCircle,
	Lightbulb,
	AlertCircle,
	CheckCircle,
	Play,
	Download,
	Mail,
	Phone
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApp } from "@/contexts/AppContext";
import { logger } from "@/lib/error-logger";

interface HelpArticle {
	id: string;
	title: string;
	content: string;
	category: string;
	tags: string[];
	popularity: number;
	lastUpdated: string;
	author: string;
	type: "article" | "video" | "tutorial" | "faq";
	difficulty: "beginner" | "intermediate" | "advanced";
	estimatedReadTime: number;
	relatedArticles?: string[];
}

interface HelpCategory {
	id: string;
	name: string;
	description: string;
	icon: React.ComponentType<any>;
	color: string;
	articleCount: number;
}

interface HelpSystemProps {
	onClose?: () => void;
	initialSearch?: string;
	initialCategory?: string;
}

/**
 * Comprehensive Help System Component
 * Provides searchable help articles, tutorials, and support options
 */
export function HelpSystem({ onClose, initialSearch, initialCategory }: HelpSystemProps) {
	const { t } = useLanguage();
	const { user, tenant } = useApp();
	const [searchQuery, setSearchQuery] = useState(initialSearch || "");
	const [selectedCategory, setSelectedCategory] = useState(initialCategory || "all");
	const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
	const [recentArticles, setRecentArticles] = useState<HelpArticle[]>([]);
	const [favoriteArticles, setFavoriteArticles] = useState<Set<string>>(new Set());

	// Help categories
	const categories: HelpCategory[] = [
		{
			id: "getting-started",
			name: "Getting Started",
			description: "Learn the basics of using the platform",
			icon: BookOpen,
			color: "text-blue-600",
			articleCount: 8,
		},
		{
			id: "databases",
			name: "Databases & Tables",
			description: "Managing your data structure",
			icon: Database,
			color: "text-green-600",
			articleCount: 12,
		},
		{
			id: "collaboration",
			name: "Team Collaboration",
			description: "Working with your team",
			icon: Users,
			color: "text-purple-600",
			articleCount: 6,
		},
		{
			id: "integrations",
			name: "Integrations & API",
			description: "Connect with external services",
			icon: ExternalLink,
			color: "text-orange-600",
			articleCount: 10,
		},
		{
			id: "billing",
			name: "Billing & Plans",
			description: "Manage your subscription",
			icon: CreditCard,
			color: "text-red-600",
			articleCount: 5,
		},
		{
			id: "troubleshooting",
			name: "Troubleshooting",
			description: "Common issues and solutions",
			icon: AlertCircle,
			color: "text-yellow-600",
			articleCount: 15,
		},
	];

	// Sample help articles (in production, this would come from a CMS or API)
	const helpArticles: HelpArticle[] = [
		{
			id: "getting-started-1",
			title: "Welcome to the Platform - Your First Steps",
			content: `
# Welcome to the Platform - Your First Steps

Welcome to our multi-tenant database management platform! This guide will help you get started with creating and managing your data.

## What You'll Learn
- How to create your first database
- Setting up tables and columns
- Adding and managing data
- Inviting team members

## Step 1: Create Your First Database
1. Click the "Create Database" button on your dashboard
2. Give your database a descriptive name
3. Add a description to help your team understand its purpose
4. Click "Create" to save

## Step 2: Add Tables
Tables are where you store your actual data. To create a table:
1. Open your database
2. Click "Create Table"
3. Define your columns with appropriate data types
4. Set up relationships between tables if needed

## Next Steps
- [Learn about data types](./data-types)
- [Import data from CSV](./import-csv)
- [Invite team members](./team-collaboration)
			`,
			category: "getting-started",
			tags: ["beginner", "database", "tutorial"],
			popularity: 95,
			lastUpdated: "2024-01-15",
			author: "Support Team",
			type: "tutorial",
			difficulty: "beginner",
			estimatedReadTime: 5,
			relatedArticles: ["data-types", "import-csv", "team-collaboration"],
		},
		{
			id: "database-1",
			title: "Understanding Data Types and Column Settings",
			content: `
# Understanding Data Types and Column Settings

Choosing the right data type for your columns is crucial for data integrity and performance.

## Available Data Types

### Text Types
- **TEXT**: For long text content (up to 65,535 characters)
- **VARCHAR**: For shorter text with a specified length
- **EMAIL**: Automatically validates email format
- **URL**: Validates and formats URLs

### Numeric Types
- **NUMBER**: For integers and decimal numbers
- **CURRENCY**: For monetary values with proper formatting

### Date and Time
- **DATE**: For dates only (YYYY-MM-DD)
- **DATETIME**: For dates with time (YYYY-MM-DD HH:MM:SS)
- **TIMESTAMP**: Automatically updated timestamps

### Other Types
- **BOOLEAN**: True/false values
- **PHONE**: Validates phone number format
- **JSON**: For structured data

## Best Practices
- Use the most specific data type possible
- Set appropriate length limits for text fields
- Use required fields sparingly
- Consider indexing frequently searched columns
			`,
			category: "databases",
			tags: ["data-types", "columns", "best-practices"],
			popularity: 87,
			lastUpdated: "2024-01-10",
			author: "Technical Team",
			type: "article",
			difficulty: "intermediate",
			estimatedReadTime: 8,
		},
		{
			id: "collaboration-1",
			title: "Managing Team Permissions and Roles",
			content: `
# Managing Team Permissions and Roles

Learn how to effectively manage your team's access to databases and data.

## User Roles

### Admin
- Full access to all databases and settings
- Can invite and remove users
- Can modify subscription and billing

### Editor
- Can create, edit, and delete data
- Can modify table structure
- Cannot access billing or user management

### Viewer
- Can view data and export reports
- Cannot modify data or structure
- Read-only access

## Setting Up Permissions
1. Go to User Management
2. Click "Invite User"
3. Enter email and select role
4. Choose specific database access if needed
5. Send invitation

## Best Practices
- Use the principle of least privilege
- Regularly review user access
- Remove access for former team members
- Use specific database permissions when possible
			`,
			category: "collaboration",
			tags: ["permissions", "roles", "team", "security"],
			popularity: 78,
			lastUpdated: "2024-01-12",
			author: "Security Team",
			type: "article",
			difficulty: "intermediate",
			estimatedReadTime: 6,
		},
		{
			id: "troubleshooting-1",
			title: "Common Import Issues and Solutions",
			content: `
# Common Import Issues and Solutions

Troubleshooting guide for data import problems.

## Common Issues

### CSV Import Fails
**Problem**: CSV file won't import
**Solutions**:
- Check file encoding (use UTF-8)
- Ensure proper column headers
- Verify data types match
- Check for special characters

### Data Type Mismatches
**Problem**: Data doesn't match column type
**Solutions**:
- Review your CSV data format
- Update column data types if needed
- Use data transformation tools
- Import in smaller batches

### Large File Uploads
**Problem**: Large files timeout or fail
**Solutions**:
- Split large files into smaller chunks
- Use the API for bulk imports
- Contact support for assistance
- Consider data compression

## Getting Help
If you're still having issues:
1. Check our [API documentation](./api-docs)
2. Contact support with error details
3. Join our community forum
4. Schedule a call with our team
			`,
			category: "troubleshooting",
			tags: ["import", "csv", "troubleshooting", "data"],
			popularity: 82,
			lastUpdated: "2024-01-08",
			author: "Support Team",
			type: "faq",
			difficulty: "beginner",
			estimatedReadTime: 7,
		},
	];

	// Filter articles based on search and category
	const filteredArticles = useMemo(() => {
		let filtered = helpArticles;

		// Filter by category
		if (selectedCategory !== "all") {
			filtered = filtered.filter(article => article.category === selectedCategory);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(article =>
				article.title.toLowerCase().includes(query) ||
				article.content.toLowerCase().includes(query) ||
				article.tags.some(tag => tag.toLowerCase().includes(query))
			);
		}

		// Sort by popularity
		return filtered.sort((a, b) => b.popularity - a.popularity);
	}, [searchQuery, selectedCategory]);

	// Load user preferences
	useEffect(() => {
		if (user?.id) {
			loadUserPreferences();
		}
	}, [user?.id]);

	const loadUserPreferences = () => {
		if (!user?.id) return;

		try {
			// Load recent articles
			const recent = localStorage.getItem(`help_recent_${user.id}`);
			if (recent) {
				const recentIds = JSON.parse(recent);
				setRecentArticles(helpArticles.filter(article => recentIds.includes(article.id)));
			}

			// Load favorite articles
			const favorites = localStorage.getItem(`help_favorites_${user.id}`);
			if (favorites) {
				setFavoriteArticles(new Set(JSON.parse(favorites)));
			}
		} catch (error) {
			logger.error("Failed to load help preferences", error as Error, {
				component: "HelpSystem",
				userId: user.id,
			});
		}
	};

	const saveUserPreferences = () => {
		if (!user?.id) return;

		try {
			// Save recent articles
			localStorage.setItem(`help_recent_${user.id}`, JSON.stringify(recentArticles.map(a => a.id)));
			
			// Save favorite articles
			localStorage.setItem(`help_favorites_${user.id}`, JSON.stringify(Array.from(favoriteArticles)));
		} catch (error) {
			logger.error("Failed to save help preferences", error as Error, {
				component: "HelpSystem",
				userId: user.id,
			});
		}
	};

	const openArticle = (article: HelpArticle) => {
		setSelectedArticle(article);
		
		// Add to recent articles
		const newRecent = [article, ...recentArticles.filter(a => a.id !== article.id)].slice(0, 5);
		setRecentArticles(newRecent);
		
		// Log article view
		logger.info("Help article viewed", {
			component: "HelpSystem",
			userId: user?.id,
			articleId: article.id,
			articleTitle: article.title,
		});
	};

	const toggleFavorite = (articleId: string) => {
		const newFavorites = new Set(favoriteArticles);
		if (newFavorites.has(articleId)) {
			newFavorites.delete(articleId);
		} else {
			newFavorites.add(articleId);
		}
		setFavoriteArticles(newFavorites);
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "beginner": return "bg-green-100 text-green-800";
			case "intermediate": return "bg-yellow-100 text-yellow-800";
			case "advanced": return "bg-red-100 text-red-800";
			default: return "bg-gray-100 text-gray-800";
		}
	};

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "video": return <Video className="h-4 w-4" />;
			case "tutorial": return <Play className="h-4 w-4" />;
			case "faq": return <HelpCircle className="h-4 w-4" />;
			default: return <BookOpen className="h-4 w-4" />;
		}
	};

	// Save preferences when they change
	useEffect(() => {
		saveUserPreferences();
	}, [recentArticles, favoriteArticles]);

	if (selectedArticle) {
		return (
			<ArticleView
				article={selectedArticle}
				onBack={() => setSelectedArticle(null)}
				onToggleFavorite={() => toggleFavorite(selectedArticle.id)}
				isFavorite={favoriteArticles.has(selectedArticle.id)}
			/>
		);
	}

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between p-6 border-b">
				<div className="flex items-center gap-3">
					<HelpCircle className="h-6 w-6 text-primary" />
					<h1 className="text-2xl font-bold">Help Center</h1>
				</div>
				{onClose && (
					<Button variant="ghost" onClick={onClose}>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>

			{/* Search */}
			<div className="p-6 border-b">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search help articles..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-hidden">
				<Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="h-full flex flex-col">
					<TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mx-6 mt-6">
						<TabsTrigger value="all">All</TabsTrigger>
						{categories.map((category) => (
							<TabsTrigger key={category.id} value={category.id}>
								{category.name}
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value={selectedCategory} className="flex-1 overflow-y-auto p-6">
						<div className="grid gap-4">
							{/* Recent Articles */}
							{recentArticles.length > 0 && selectedCategory === "all" && (
								<div className="mb-6">
									<h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
										<Clock className="h-5 w-5" />
										Recently Viewed
									</h3>
									<div className="grid gap-3 md:grid-cols-2">
										{recentArticles.map((article) => (
											<ArticleCard
												key={article.id}
												article={article}
												onClick={() => openArticle(article)}
												onToggleFavorite={() => toggleFavorite(article.id)}
												isFavorite={favoriteArticles.has(article.id)}
											/>
										))}
									</div>
								</div>
							)}

							{/* Search Results */}
							<div>
								<h3 className="text-lg font-semibold mb-3">
									{searchQuery ? `Search Results (${filteredArticles.length})` : "Help Articles"}
								</h3>
								
								{filteredArticles.length === 0 ? (
									<Card>
										<CardContent className="p-8 text-center">
											<HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
											<h4 className="text-lg font-medium mb-2">No articles found</h4>
											<p className="text-muted-foreground">
												Try adjusting your search terms or browse by category.
											</p>
										</CardContent>
									</Card>
								) : (
									<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
										{filteredArticles.map((article) => (
											<ArticleCard
												key={article.id}
												article={article}
												onClick={() => openArticle(article)}
												onToggleFavorite={() => toggleFavorite(article.id)}
												isFavorite={favoriteArticles.has(article.id)}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</div>

			{/* Support Options */}
			<div className="p-6 border-t bg-muted/50">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button variant="outline" size="sm">
							<MessageCircle className="h-4 w-4 mr-2" />
							Live Chat
						</Button>
						<Button variant="outline" size="sm">
							<Mail className="h-4 w-4 mr-2" />
							Email Support
						</Button>
						<Button variant="outline" size="sm">
							<Phone className="h-4 w-4 mr-2" />
							Schedule Call
						</Button>
					</div>
					<div className="text-sm text-muted-foreground">
						Need more help? We're here for you!
					</div>
				</div>
			</div>
		</div>
	);
}

// Article Card Component
function ArticleCard({ 
	article, 
	onClick, 
	onToggleFavorite, 
	isFavorite 
}: { 
	article: HelpArticle; 
	onClick: () => void; 
	onToggleFavorite: () => void;
	isFavorite: boolean;
}) {
	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "beginner": return "bg-green-100 text-green-800";
			case "intermediate": return "bg-yellow-100 text-yellow-800";
			case "advanced": return "bg-red-100 text-red-800";
			default: return "bg-gray-100 text-gray-800";
		}
	};

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "video": return <Video className="h-4 w-4" />;
			case "tutorial": return <Play className="h-4 w-4" />;
			case "faq": return <HelpCircle className="h-4 w-4" />;
			default: return <BookOpen className="h-4 w-4" />;
		}
	};

	return (
		<Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						{getTypeIcon(article.type)}
						<Badge className={getDifficultyColor(article.difficulty)}>
							{article.difficulty}
						</Badge>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							onToggleFavorite();
						}}
						className="h-6 w-6 p-0"
					>
						<Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
					</Button>
				</div>
				<CardTitle className="text-base">{article.title}</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<span className="flex items-center gap-1">
						<Clock className="h-3 w-3" />
						{article.estimatedReadTime} min read
					</span>
					<span className="flex items-center gap-1">
						<Star className="h-3 w-3" />
						{article.popularity}% helpful
					</span>
				</div>
			</CardContent>
		</Card>
	);
}

// Article View Component
function ArticleView({ 
	article, 
	onBack, 
	onToggleFavorite, 
	isFavorite 
}: { 
	article: HelpArticle; 
	onBack: () => void; 
	onToggleFavorite: () => void;
	isFavorite: boolean;
}) {
	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between p-6 border-b">
				<Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
					<ChevronLeft className="h-4 w-4" />
					Back to Help
				</Button>
				<Button variant="ghost" onClick={onToggleFavorite}>
					<Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
				</Button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-6">
				<div className="max-w-4xl mx-auto">
					<div className="mb-6">
						<div className="flex items-center gap-2 mb-2">
							<Badge variant="secondary">{article.type}</Badge>
							<Badge variant="outline">{article.difficulty}</Badge>
							<span className="text-sm text-muted-foreground">
								{article.estimatedReadTime} min read
							</span>
						</div>
						<h1 className="text-3xl font-bold mb-2">{article.title}</h1>
						<p className="text-muted-foreground">
							By {article.author} • Updated {new Date(article.lastUpdated).toLocaleDateString()}
						</p>
					</div>

					<div className="prose prose-gray max-w-none">
						<div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }} />
					</div>

					{/* Related Articles */}
					{article.relatedArticles && article.relatedArticles.length > 0 && (
						<div className="mt-8 pt-6 border-t">
							<h3 className="text-lg font-semibold mb-4">Related Articles</h3>
							<div className="grid gap-3 md:grid-cols-2">
								{article.relatedArticles.map((relatedId) => (
									<Card key={relatedId} className="cursor-pointer hover:shadow-md transition-shadow">
										<CardContent className="p-4">
											<h4 className="font-medium">Related Article</h4>
											<p className="text-sm text-muted-foreground">Learn more about this topic</p>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
