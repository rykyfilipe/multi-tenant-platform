/**
 * Resource Usage Chart Component
 * Horizontal bar charts for resource utilization
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ResourceUsageChartProps {
	data: Array<{
		name: string;
		value: number;
		percentage: number;
		color?: string;
	}>;
	title?: string;
	description?: string;
	height?: number;
	delay?: number;
	showGrid?: boolean;
	showTooltip?: boolean;
}

const defaultColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export const ResourceUsageChart: React.FC<ResourceUsageChartProps> = ({
	data,
	title = "Resource Usage",
	description,
	height = 300,
	delay = 0,
	showGrid = true,
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
							<BarChart data={data} layout="horizontal">
								{showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
								<XAxis 
									type="number" 
									tick={{ fontSize: 12 }}
									tickLine={{ stroke: "currentColor", opacity: 0.3 }}
								/>
								<YAxis 
									type="category" 
									dataKey="name" 
									tick={{ fontSize: 12 }}
									tickLine={{ stroke: "currentColor", opacity: 0.3 }}
									width={100}
								/>
								{showTooltip && (
									<Tooltip 
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "6px",
										}}
										formatter={(value: any, name: string) => [
											`${value}%`,
											name === "value" ? "Usage" : name
										]}
									/>
								)}
								<Bar dataKey="value" radius={[0, 4, 4, 0]}>
									{data.map((entry, index) => (
										<Cell 
											key={`cell-${index}`} 
											fill={entry.color || defaultColors[index % defaultColors.length]} 
										/>
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
