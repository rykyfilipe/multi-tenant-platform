/**
 * Distribution Chart Component
 * Pie charts for data distribution
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface DistributionChartProps {
	data: Array<{
		name: string;
		value: number;
		color?: string;
	}>;
	title?: string;
	description?: string;
	height?: number;
	delay?: number;
	showLegend?: boolean;
	showTooltip?: boolean;
}

const defaultColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"];

export const DistributionChart: React.FC<DistributionChartProps> = ({
	data,
	title = "Distribution",
	description,
	height = 300,
	delay = 0,
	showLegend = true,
	showTooltip = true,
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
							<PieChart>
								<Pie
									data={data}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
									outerRadius={80}
									fill="#8884d8"
									dataKey="value"
								>
									{data.map((entry, index) => (
										<Cell 
											key={`cell-${index}`} 
											fill={entry.color || defaultColors[index % defaultColors.length]} 
										/>
									))}
								</Pie>
								{showTooltip && (
									<Tooltip 
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "6px",
										}}
									/>
								)}
								{showLegend && (
									<Legend 
										verticalAlign="bottom" 
										height={36}
										iconType="circle"
									/>
								)}
							</PieChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
