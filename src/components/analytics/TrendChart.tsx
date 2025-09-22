/**
 * Trend Chart Component
 * Combined line/bar charts with trend indicators
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TrendChartProps {
	data: any[];
	title?: string;
	description?: string;
	height?: number;
	delay?: number;
	lineDataKey?: string;
	barDataKey?: string;
	lineColor?: string;
	barColor?: string;
	showGrid?: boolean;
	showTooltip?: boolean;
	showLegend?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
	data,
	title = "Trend Analysis",
	description,
	height = 300,
	delay = 0,
	lineDataKey = "trend",
	barDataKey = "value",
	lineColor = "#3b82f6",
	barColor = "#10b981",
	showGrid = true,
	showTooltip = true,
	showLegend = true,
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
							<ComposedChart data={data}>
								{showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
								<XAxis 
									dataKey="name" 
									tick={{ fontSize: 12 }}
									tickLine={{ stroke: "currentColor", opacity: 0.3 }}
								/>
								<YAxis 
									tick={{ fontSize: 12 }}
									tickLine={{ stroke: "currentColor", opacity: 0.3 }}
								/>
								{showTooltip && (
									<Tooltip 
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "6px",
										}}
									/>
								)}
								{showLegend && <Legend />}
								<Bar dataKey={barDataKey} fill={barColor} radius={[4, 4, 0, 0]} />
								<Line 
									type="monotone" 
									dataKey={lineDataKey} 
									stroke={lineColor} 
									strokeWidth={2}
									dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
									activeDot={{ r: 6, stroke: lineColor, strokeWidth: 2 }}
								/>
							</ComposedChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
