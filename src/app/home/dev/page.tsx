/** @format */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Code,
	Database,
	Monitor,
	Settings,
	Bug,
	Zap,
} from "lucide-react";
import ThemeTester from "@/components/dev/ThemeTester";
import { PerformanceDashboard } from "@/components/dev/PerformanceDashboard";

function DevPage() {
	const { data: session } = useSession();
	const { user, loading } = useApp();
	const { t } = useLanguage();
	const [activeTab, setActiveTab] = useState("theme");

	// Show loading state if session is not available, user data is not available, or still loading
	if (!session || loading || !user) {
		return (
			<div className='h-full bg-background flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-muted-foreground'>Loading development tools...</p>
				</div>
			</div>
		);
	}

	// Only show for admins in development mode
	if (user.role !== "ADMIN" || process.env.NODE_ENV !== "development") {
		return (
			<div className='h-full bg-background flex items-center justify-center'>
				<div className='text-center'>
					<div className='w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
						<Bug className='w-10 h-10 text-red-600 dark:text-red-400' />
					</div>
					<h3 className='text-xl font-bold tracking-tight mb-2'>
						Access Restricted
					</h3>
					<p className='text-muted-foreground'>
						Development tools are only available to administrators in development mode.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto px-4 py-8 space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4'>
				<div className='w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto shadow-lg'>
					<Code className='w-10 h-10 text-blue-600 dark:text-blue-400' />
				</div>
				<h1 className='text-3xl font-bold tracking-tight'>Development Tools</h1>
				<p className='text-muted-foreground max-w-2xl mx-auto'>
					Advanced development and debugging tools for administrators. 
					Use these tools to test features, monitor performance, and debug issues.
				</p>
				<div className='flex items-center justify-center gap-2'>
					<Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
						Development Mode
					</Badge>
					<Badge variant="outline">
						Admin Access
					</Badge>
				</div>
			</div>

			{/* Development Tools Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-6">
					<TabsTrigger value="theme" className="flex items-center gap-2">
						<Monitor className="w-4 h-4" />
						Theme
					</TabsTrigger>
					<TabsTrigger value="performance" className="flex items-center gap-2">
						<Zap className="w-4 h-4" />
						Performance
					</TabsTrigger>
					<TabsTrigger value="database" className="flex items-center gap-2">
						<Database className="w-4 h-4" />
						Database
					</TabsTrigger>
					<TabsTrigger value="settings" className="flex items-center gap-2">
						<Settings className="w-4 h-4" />
						Settings
					</TabsTrigger>
					<TabsTrigger value="debug" className="flex items-center gap-2">
						<Bug className="w-4 h-4" />
						Debug
					</TabsTrigger>
					<TabsTrigger value="api" className="flex items-center gap-2">
						<Code className="w-4 h-4" />
						API
					</TabsTrigger>
				</TabsList>

				<TabsContent value="theme" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Monitor className="w-5 h-5" />
								Theme Synchronization Testing
							</CardTitle>
							<CardDescription>
								Test and debug theme synchronization between localStorage, database, and active theme.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ThemeTester />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="performance" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Zap className="w-5 h-5" />
								Performance Monitoring
							</CardTitle>
							<CardDescription>
								Monitor application performance, memory usage, and system metrics.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<PerformanceDashboard />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="database" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Database className="w-5 h-5" />
								Database Tools
							</CardTitle>
							<CardDescription>
								Database connection testing, query performance, and schema inspection tools.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-center py-12">
								<Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">
									Database development tools coming soon...
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="settings" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Settings className="w-5 h-5" />
								Development Settings
							</CardTitle>
							<CardDescription>
								Configure development environment, debugging options, and testing parameters.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-center py-12">
								<Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">
									Development settings configuration coming soon...
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="debug" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Bug className="w-5 h-5" />
								Debug Console
							</CardTitle>
							<CardDescription>
								Real-time logging, error tracking, and debugging information.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-center py-12">
								<Bug className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">
									Debug console coming soon...
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="api" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Code className="w-5 h-5" />
								API Testing
							</CardTitle>
							<CardDescription>
								Test API endpoints, inspect requests/responses, and validate data formats.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-center py-12">
								<Code className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">
									API testing tools coming soon...
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default DevPage;
