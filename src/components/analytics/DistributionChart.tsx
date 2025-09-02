/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
} from "recharts";
import { LucideIcon } from "lucide-react";

interface DistributionChartProps {
	title: string;
	icon: LucideIcon;
	data: Array<{
		name: string;
		value: number;
		percentage?: number;
	}>;
	colors?: string[];
	height?: number;
	delay?: number;
}

const DEFAULT_COLORS = [
	"#3b82f6", // blue
	"#10b981", // green
	"#f59e0b", // orange
	"#ef4444", // red
	"#8b5cf6", // purple
	"#06b6d4", // cyan
	"#84cc16", // lime
	"#f97316", // orange-500
];

export const DistributionChart: React.FC<DistributionChartProps> = ({
	title,
	icon: Icon,
	data,
	colors = DEFAULT_COLORS,
	height = 300,
	delay = 0,
}) => {
	const renderCustomLabel = ({
		cx,
		cy,
		midAngle,
		innerRadius,
		outerRadius,
		percent,
	}: any) => {
		if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

		const RADIAN = Math.PI / 180;
		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos(-midAngle * RADIAN);
		const y = cy + radius * Math.sin(-midAngle * RADIAN);

		return (
			<text
				x={x}
				y={y}
				fill='white'
				textAnchor={x > cx ? "start" : "end"}
				dominantBaseline='central'
				fontSize={12}
				fontWeight='bold'>
				{`${(percent * 100).toFixed(0)}%`}
			</text>
		);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}>
			<Card className='bg-card border-border'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2 text-foreground'>
						<Icon className='w-5 h-5' />
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div style={{ height }}>
						{data.length > 0 ? (
							<ResponsiveContainer width='100%' height='100%'>
								<PieChart>
									<Pie
										data={data}
										cx='50%'
										cy='50%'
										labelLine={false}
										label={renderCustomLabel}
										outerRadius={80}
										fill='#8884d8'
										dataKey='value'>
										{data.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={colors[index % colors.length]}
											/>
										))}
									</Pie>
									<Tooltip
										formatter={(value: any, name: string) => [
											`${value.toLocaleString()}`,
											name,
										]}
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "8px",
											color: "hsl(var(--foreground))",
										}}
									/>
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						) : (
							<div className='flex items-center justify-center h-full text-muted-foreground'>
								No data available
							</div>
						)}
					</div>

					{/* Distribution Details */}
					<div className='mt-4 space-y-2'>
						{data.map((item, index) => (
							<div
								key={item.name}
								className='flex justify-between items-center text-sm'>
								<div className='flex items-center gap-2'>
									<div
										className='w-3 h-3 rounded-full'
										style={{ backgroundColor: colors[index % colors.length] }}
									/>
									<span className='text-muted-foreground'>{item.name}</span>
								</div>
								<div className='flex items-center gap-2'>
									<span className='font-medium'>
										{item.value.toLocaleString()}
									</span>
									{item.percentage && (
										<span className='text-muted-foreground'>
											({item.percentage.toFixed(1)}%)
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
