/**
 * Revenue Chart Component
 * Specialized chart for revenue data visualization with premium luxury design
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from "recharts";

interface RevenueChartProps {
	data: any[];
	title?: string;
	description?: string;
	height?: number;
	delay?: number;
	type?: "line" | "area";
	showGrid?: boolean;
	showTooltip?: boolean;
	color?: string;
	dataKeys?: Array<{ key: string; name: string; color?: string }>;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
	data,
	title = "Revenue Analysis",
	description,
	height = 300,
	delay = 0,
	type = "area",
	showGrid = true,
	showTooltip = true,
	color = "#10b981",
	dataKeys = [{ key: "value", name: "Revenue", color: "#10b981" }],
}) => {
	const ChartComponent = type === "area" ? AreaChart : LineChart;

	// Premium black and white color palette for revenue charts
	const premiumColors = {
		primary: "#1f2937", // Dark gray
		secondary: "#374151", // Medium gray
		accent: "#4b5563", // Light gray
		success: "#111827", // Very dark gray
		warning: "#6b7280", // Gray
		error: "#000000", // Black
		neutral: "#9ca3af", // Light gray
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
		>
			<Card className="bg-white border-0 shadow-xl shadow-gray-100/50 rounded-2xl overflow-hidden">
				<CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100/50 pb-4">
					<CardTitle className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
						<span>{title}</span>
						<span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
							{type === "area" ? "Area Chart" : "Line Chart"}
						</span>
					</CardTitle>
					{description && (
						<p className="text-sm text-gray-600 font-medium">{description}</p>
					)}
				</CardHeader>
				<CardContent className="p-6 bg-white">
					<div style={{ height }} className="relative">
						<ResponsiveContainer width="100%" height="100%">
							<ChartComponent data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
								{showGrid && (
									<CartesianGrid 
										strokeDasharray="1 1" 
										stroke="#e5e7eb" 
										strokeOpacity={0.3}
										vertical={false}
									/>
								)}
								<XAxis 
									dataKey="name" 
									tick={{ 
										fontSize: 12, 
										fill: "#6b7280",
										fontWeight: 500,
										fontFamily: "Inter, system-ui, sans-serif"
									}}
									tickLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
									axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
									tickMargin={8}
								/>
								<YAxis 
									tick={{ 
										fontSize: 12, 
										fill: "#6b7280",
										fontWeight: 500,
										fontFamily: "Inter, system-ui, sans-serif"
									}}
									tickLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
									axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
									tickMargin={8}
									tickFormatter={(value) => `$${value.toLocaleString()}`}
								/>
								{showTooltip && (
									<Tooltip 
										contentStyle={{
											backgroundColor: "rgba(255, 255, 255, 0.95)",
											border: "1px solid rgba(229, 231, 235, 0.8)",
											borderRadius: "12px",
											boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
											backdropFilter: "blur(8px)",
											fontFamily: "Inter, system-ui, sans-serif",
											fontSize: "13px",
											fontWeight: "500",
											color: "#374151",
											padding: "12px 16px"
										}}
										labelStyle={{
											fontWeight: "600",
											color: "#111827",
											fontSize: "14px",
											marginBottom: "4px"
										}}
										formatter={(value: any, name: string) => [`$${value.toLocaleString()}`, name]}
									/>
								)}
								{dataKeys.length > 1 && (
									<Legend 
										wrapperStyle={{
											paddingTop: "20px",
											fontFamily: "Inter, system-ui, sans-serif",
											fontSize: "13px",
											fontWeight: "500"
										}}
									/>
								)}
								{type === "area" ? (
									dataKeys.map((dataKey, index) => (
										<Area
											key={dataKey.key}
											type="monotone"
											dataKey={dataKey.key}
											stroke={dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length]}
											fill={dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length]}
											fillOpacity={0.15}
											strokeWidth={3}
											strokeLinecap="round"
											strokeLinejoin="round"
											name={dataKey.name}
										/>
									))
								) : (
									dataKeys.map((dataKey, index) => (
										<Line
											key={dataKey.key}
											type="monotone"
											dataKey={dataKey.key}
											stroke={dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length]}
											strokeWidth={3}
											strokeLinecap="round"
											strokeLinejoin="round"
											dot={{ 
												fill: dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length], 
												strokeWidth: 0, 
												r: 0,
												opacity: 0
											}}
											activeDot={{ 
												r: 6, 
												stroke: dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length], 
												strokeWidth: 3,
												fill: "white",
												strokeOpacity: 1,
												filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
											}}
											name={dataKey.name}
										/>
									))
								)}
							</ChartComponent>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};