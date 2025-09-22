/**
 * Performance Chart Component
 * Radar charts for multi-dimensional analysis
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts";

interface PerformanceChartProps {
	data: Array<{
		subject: string;
		A: number;
		B?: number;
		fullMark?: number;
	}>;
	title?: string;
	description?: string;
	height?: number;
	delay?: number;
	showLegend?: boolean;
	colors?: string[];
}

const defaultColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
	data,
	title = "Performance Analysis",
	description,
	height = 300,
	delay = 0,
	showLegend = true,
	colors = defaultColors,
}) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
		>
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold">{title}</CardTitle>
					{description && (
						<p className="text-sm text-muted-foreground">{description}</p>
					)}
				</CardHeader>
				<CardContent>
					<div style={{ height }}>
						<ResponsiveContainer width="100%" height="100%">
							<RadarChart data={data}>
								<PolarGrid />
								<PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
								<PolarRadiusAxis 
									angle={90} 
									domain={[0, 100]} 
									tick={{ fontSize: 10 }}
								/>
								{showLegend && <Legend />}
								<Radar
									name="Performance"
									dataKey="A"
									stroke={colors[0]}
									fill={colors[0]}
									fillOpacity={0.1}
									strokeWidth={2}
								/>
								{data[0]?.B !== undefined && (
									<Radar
										name="Target"
										dataKey="B"
										stroke={colors[1]}
										fill={colors[1]}
										fillOpacity={0.1}
										strokeWidth={2}
									/>
								)}
							</RadarChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
