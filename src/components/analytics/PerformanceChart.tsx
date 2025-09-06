/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ResponsiveContainer,
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	Radar,
} from "recharts";
import { LucideIcon } from "lucide-react";

interface PerformanceChartProps {
	title: string;
	icon: LucideIcon;
	data: Array<{
		subject: string;
		score: number;
		fullMark: number;
	}>;
	height?: number;
	delay?: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
	title,
	icon: Icon,
	data,
	height = 300,
	delay = 0,
}) => {
	const averageScore =
		data.length > 0
			? Math.round(
					data.reduce((acc, item) => acc + item.score, 0) / data.length,
			  )
			: 0;

	const getScoreColor = (score: number): string => {
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-yellow-600";
		if (score >= 40) return "text-orange-600";
		return "text-red-600";
	};

	const getScoreBgColor = (score: number): string => {
		if (score >= 80) return "bg-green-500/10";
		if (score >= 60) return "bg-yellow-500/10";
		if (score >= 40) return "bg-orange-500/10";
		return "bg-red-500/10";
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
								<RadarChart cx='50%' cy='50%' outerRadius='80%' data={data}>
									<PolarGrid stroke='hsl(var(--border))' />
									<PolarAngleAxis
										dataKey='subject'
										tick={{
											fontSize: 12,
											fill: "hsl(var(--muted-foreground))",
										}}
									/>
									<PolarRadiusAxis
										angle={90}
										domain={[0, 100]}
										tick={{
											fontSize: 10,
											fill: "hsl(var(--muted-foreground))",
										}}
									/>
									<Radar
										name='Performance'
										dataKey='score'
										stroke='hsl(var(--primary))'
										fill='hsl(var(--primary))'
										fillOpacity={0.3}
										strokeWidth={2}
									/>
								</RadarChart>
							</ResponsiveContainer>
						) : (
							<div className='flex items-center justify-center h-full text-muted-foreground'>
								No data available
							</div>
						)}
					</div>

					{/* Performance Summary */}
					<div className='mt-4 space-y-3'>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>
								Overall Score
							</span>
							<div
								className={`px-2 py-1 rounded text-sm font-semibold ${getScoreColor(
									averageScore,
								)} ${getScoreBgColor(averageScore)}`}>
								{averageScore}/100
							</div>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							{data.map((item, index) => (
								<div
									key={item.subject}
									className='flex justify-between items-center text-sm'>
									<span className='text-muted-foreground'>{item.subject}</span>
									<span className={`font-medium ${getScoreColor(item.score)}`}>
										{item.score}
									</span>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};

export { PerformanceChart };
