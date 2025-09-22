/**
 * Error Tracking Chart Component
 * Specialized chart for error tracking and monitoring
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from "recharts";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

interface ErrorTrackingChartProps {
	data: any[];
	title?: string;
	description?: string;
	height?: number;
	delay?: number;
	type?: "bar" | "line" | "composed";
	showGrid?: boolean;
	showTooltip?: boolean;
	showTrend?: boolean;
}

export const ErrorTrackingChart: React.FC<ErrorTrackingChartProps> = ({
	data,
	title = "Error Tracking",
	description,
	height = 300,
	delay = 0,
	type = "bar",
	showGrid = true,
	showTooltip = true,
	showTrend = true,
}) => {
	const ChartComponent = type === "composed" ? ComposedChart : type === "line" ? LineChart : BarChart;

	// Calculate trend
	const trend = data.length > 1 ? 
		(data[data.length - 1].value - data[0].value) / data[0].value * 100 : 0;
	const isImproving = trend < 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
		>
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold flex items-center space-x-2">
						<AlertTriangle className="h-5 w-5 text-red-500" />
						<span>{title}</span>
						{showTrend && (
							<div className={`flex items-center space-x-1 text-sm ${
								isImproving ? "text-green-600" : "text-red-600"
							}`}>
								{isImproving ? (
									<TrendingDown className="h-4 w-4" />
								) : (
									<TrendingUp className="h-4 w-4" />
								)}
								<span>{Math.abs(trend).toFixed(1)}%</span>
							</div>
						)}
					</CardTitle>
					{description && (
						<p className="text-sm text-muted-foreground">{description}</p>
					)}
				</CardHeader>
				<CardContent>
					<div style={{ height }}>
						<ResponsiveContainer width="100%" height="100%">
							<ChartComponent data={data}>
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
										formatter={(value: any) => [value, "Errors"]}
									/>
								)}
								{type === "composed" ? (
									<>
										<Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
										<Line 
											type="monotone" 
											dataKey="trend" 
											stroke="#3b82f6" 
											strokeWidth={2}
											dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
										/>
									</>
								) : type === "line" ? (
									<Line
										type="monotone"
										dataKey="value"
										stroke="#ef4444"
										strokeWidth={2}
										dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
										activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
									/>
								) : (
									<Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
								)}
							</ChartComponent>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
