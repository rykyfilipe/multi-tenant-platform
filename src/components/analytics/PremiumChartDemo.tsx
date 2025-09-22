/**
 * Premium Chart Demo Component
 * Showcase of advanced chart features and styling
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown, Star } from "lucide-react";

interface PremiumChartDemoProps {
	title?: string;
	description?: string;
	delay?: number;
	onUpgrade?: () => void;
}

export const PremiumChartDemo: React.FC<PremiumChartDemoProps> = ({
	title = "Premium Analytics",
	description = "Unlock advanced analytics features with premium charts and insights",
	delay = 0,
	onUpgrade,
}) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
		>
			<Card className="relative overflow-hidden border-2 border-gradient-to-r from-purple-500 to-pink-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
				<div className="absolute top-0 right-0 p-2">
					<Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
						<Crown className="h-3 w-3 mr-1" />
						Premium
					</Badge>
				</div>
				
				<CardHeader>
					<CardTitle className="text-lg font-semibold flex items-center space-x-2">
						<Sparkles className="h-5 w-5 text-purple-500" />
						<span>{title}</span>
					</CardTitle>
					<p className="text-sm text-muted-foreground">{description}</p>
				</CardHeader>
				
				<CardContent>
					<div className="space-y-4">
						{/* Demo Chart Placeholder */}
						<div className="h-64 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg flex items-center justify-center relative overflow-hidden">
							<div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse" />
							<div className="text-center z-10">
								<Star className="h-12 w-12 text-purple-500 mx-auto mb-2" />
								<p className="text-sm font-medium text-purple-700 dark:text-purple-300">
									Advanced Chart Visualization
								</p>
								<p className="text-xs text-purple-600 dark:text-purple-400">
									Interactive, animated, and customizable
								</p>
							</div>
						</div>
						
						{/* Features List */}
						<div className="space-y-2">
							<div className="flex items-center space-x-2 text-sm">
								<div className="w-2 h-2 bg-purple-500 rounded-full" />
								<span>Real-time data streaming</span>
							</div>
							<div className="flex items-center space-x-2 text-sm">
								<div className="w-2 h-2 bg-purple-500 rounded-full" />
								<span>Advanced filtering and drill-down</span>
							</div>
							<div className="flex items-center space-x-2 text-sm">
								<div className="w-2 h-2 bg-purple-500 rounded-full" />
								<span>Custom chart themes and styling</span>
							</div>
							<div className="flex items-center space-x-2 text-sm">
								<div className="w-2 h-2 bg-purple-500 rounded-full" />
								<span>Export to multiple formats</span>
							</div>
							<div className="flex items-center space-x-2 text-sm">
								<div className="w-2 h-2 bg-purple-500 rounded-full" />
								<span>AI-powered insights and recommendations</span>
							</div>
						</div>
						
						{/* Upgrade Button */}
						{onUpgrade && (
							<Button 
								onClick={onUpgrade}
								className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
							>
								<Crown className="h-4 w-4 mr-2" />
								Upgrade to Premium
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
