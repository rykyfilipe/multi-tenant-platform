/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
	BarChart3, 
	PieChart, 
	TrendingUp, 
	Activity,
	Database,
	Users,
	HardDrive,
	MemoryStick
} from "lucide-react";
import { PREMIUM_CHART_COLORS, CHART_STYLES } from "@/lib/chart-colors";

/**
 * Premium Chart Demo Component
 * Showcases the luxury black & white design system
 */
export function PremiumChartDemo() {
	const sampleData = [
		{ name: "Jan", value: 400, users: 240, storage: 120 },
		{ name: "Feb", value: 300, users: 139, storage: 98 },
		{ name: "Mar", value: 200, users: 980, storage: 200 },
		{ name: "Apr", value: 278, users: 390, storage: 150 },
		{ name: "May", value: 189, users: 480, storage: 180 },
		{ name: "Jun", value: 239, users: 380, storage: 220 },
	];

	const distributionData = [
		{ name: "Databases", value: 45, percentage: 45 },
		{ name: "Tables", value: 30, percentage: 30 },
		{ name: "Users", value: 15, percentage: 15 },
		{ name: "Storage", value: 10, percentage: 10 },
	];

	const resourceData = [
		{ resource: "CPU", used: 75, total: 100, percentage: 75 },
		{ resource: "Memory", used: 60, total: 100, percentage: 60 },
		{ resource: "Storage", used: 45, total: 100, percentage: 45 },
		{ resource: "Network", used: 30, total: 100, percentage: 30 },
	];

	return (
		<div className="space-y-8 p-6">
			{/* Header */}
			<div className="text-center space-y-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}>
					<h1 className="text-4xl font-bold bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
						Premium Analytics Design
					</h1>
					<p className="text-lg text-muted-foreground mt-2">
						Luxury black & white chart system with elegant animations
					</p>
				</motion.div>
			</div>

			{/* Color Palette Showcase */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.1 }}>
				<Card className="shadow-xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-3 text-lg font-semibold">
							<div className="p-2 rounded-lg bg-gradient-to-br from-black to-gray-800 text-white">
								<BarChart3 className="w-5 h-5" />
							</div>
							Premium Color Palette
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{Object.entries(PREMIUM_CHART_COLORS.data).map(([key, color]) => (
								<div key={key} className="text-center space-y-2">
									<div 
										className="w-16 h-16 rounded-lg mx-auto shadow-lg"
										style={{ backgroundColor: color }}
									/>
									<p className="text-sm font-medium capitalize">{key}</p>
									<p className="text-xs text-muted-foreground font-mono">{color}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Chart Examples Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Line Chart Example */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					whileHover={{ y: -4, transition: { duration: 0.2 } }}>
					<Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-3 text-lg font-semibold">
								<div className="p-2 rounded-lg bg-gradient-to-br from-black to-gray-800 text-white">
									<TrendingUp className="w-5 h-5" />
								</div>
								Growth Trends
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
								<div className="text-center space-y-2">
									<BarChart3 className="w-12 h-12 mx-auto text-gray-400" />
									<p className="text-sm text-muted-foreground">Interactive Line Chart</p>
									<Badge variant="outline" className="bg-black text-white border-black">
										Premium Design
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Pie Chart Example */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.3 }}
					whileHover={{ y: -4, transition: { duration: 0.2 } }}>
					<Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-3 text-lg font-semibold">
								<div className="p-2 rounded-lg bg-gradient-to-br from-black to-gray-800 text-white">
									<PieChart className="w-5 h-5" />
								</div>
								Data Distribution
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
								<div className="text-center space-y-2">
									<PieChart className="w-12 h-12 mx-auto text-gray-400" />
									<p className="text-sm text-muted-foreground">Interactive Pie Chart</p>
									<Badge variant="outline" className="bg-black text-white border-black">
										Elegant Design
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Bar Chart Example */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.4 }}
					whileHover={{ y: -4, transition: { duration: 0.2 } }}>
					<Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-3 text-lg font-semibold">
								<div className="p-2 rounded-lg bg-gradient-to-br from-black to-gray-800 text-white">
									<Activity className="w-5 h-5" />
								</div>
								Resource Usage
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
								<div className="text-center space-y-2">
									<BarChart3 className="w-12 h-12 mx-auto text-gray-400" />
									<p className="text-sm text-muted-foreground">Interactive Bar Chart</p>
									<Badge variant="outline" className="bg-black text-white border-black">
										Luxury Style
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Area Chart Example */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.5 }}
					whileHover={{ y: -4, transition: { duration: 0.2 } }}>
					<Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-3 text-lg font-semibold">
								<div className="p-2 rounded-lg bg-gradient-to-br from-black to-gray-800 text-white">
									<MemoryStick className="w-5 h-5" />
								</div>
								Performance Metrics
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
								<div className="text-center space-y-2">
									<TrendingUp className="w-12 h-12 mx-auto text-gray-400" />
									<p className="text-sm text-muted-foreground">Interactive Area Chart</p>
									<Badge variant="outline" className="bg-black text-white border-black">
										Sophisticated
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</div>

			{/* Features Showcase */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.6 }}>
				<Card className="shadow-xl">
					<CardHeader>
						<CardTitle className="text-center text-xl font-bold">
							Premium Design Features
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="text-center space-y-3">
								<div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
									<Database className="w-8 h-8 text-white" />
								</div>
								<h3 className="font-semibold">Monochrome Palette</h3>
								<p className="text-sm text-muted-foreground">
									Sophisticated black, white, and gray tones for a luxury feel
								</p>
							</div>
							<div className="text-center space-y-3">
								<div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
									<Activity className="w-8 h-8 text-white" />
								</div>
								<h3 className="font-semibold">Smooth Animations</h3>
								<p className="text-sm text-muted-foreground">
									Elegant transitions and hover effects for premium UX
								</p>
							</div>
							<div className="text-center space-y-3">
								<div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
									<HardDrive className="w-8 h-8 text-white" />
								</div>
								<h3 className="font-semibold">Clean Design</h3>
								<p className="text-sm text-muted-foreground">
									Minimalist approach with focus on data clarity
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
