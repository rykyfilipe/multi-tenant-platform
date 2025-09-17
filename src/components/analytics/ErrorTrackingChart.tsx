/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
} from "recharts";
import { LucideIcon, AlertTriangle, Bug, Zap, Shield } from "lucide-react";
import { PREMIUM_CHART_COLORS, CHART_STYLES } from "@/lib/chart-colors";

interface ErrorTrackingChartProps {
	title: string;
	icon: LucideIcon;
	data: Array<{
		date: string;
		errors: number;
		warnings: number;
		critical: number;
		resolved: number;
		errorRate: number;
	}>;
	height?: number;
	delay?: number;
}

export const ErrorTrackingChart: React.FC<ErrorTrackingChartProps> = ({
	title,
	icon: Icon,
	data,
	height = 300,
	delay = 0,
}) => {
	console.log('[ErrorTrackingChart] Render:', {
		title,
		hasData: !!data,
		dataLength: data?.length || 0
	});
	const totalErrors = data?.reduce((sum, item) => sum + (item?.errors || 0), 0) || 0;
	const totalWarnings = data?.reduce((sum, item) => sum + (item?.warnings || 0), 0) || 0;
	const totalCritical = data?.reduce((sum, item) => sum + (item?.critical || 0), 0) || 0;
	const totalResolved = data?.reduce((sum, item) => sum + (item?.resolved || 0), 0) || 0;
	const avgErrorRate =
		data && data.length > 0
			? data.reduce((sum, item) => sum + (item?.errorRate || 0), 0) / data.length
			: 0;

	const getErrorSeverity = (rate: number) => {
		if (rate >= 5)
			return {
				color: "text-red-600",
				bg: "bg-red-500/10",
				icon: AlertTriangle,
			};
		if (rate >= 2)
			return { color: "text-orange-600", bg: "bg-orange-500/10", icon: Bug };
		if (rate >= 0.5)
			return { color: "text-yellow-600", bg: "bg-yellow-500/10", icon: Zap };
		return { color: "text-green-600", bg: "bg-green-500/10", icon: Shield };
	};

	const severity = getErrorSeverity(avgErrorRate);

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
						{data && data.length > 0 ? (
							<ResponsiveContainer width='100%' height='100%'>
								<AreaChart data={data}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='hsl(var(--border))'
									/>
									<XAxis
										dataKey='date'
										stroke='hsl(var(--muted-foreground))'
										fontSize={12}
									/>
									<YAxis stroke='hsl(var(--muted-foreground))' fontSize={12} />
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "8px",
											color: "hsl(var(--foreground))",
										}}
									/>
									<Legend />
									<Area
										type='monotone'
										dataKey='errors'
										stroke='#ef4444'
										fill='#ef4444'
										fillOpacity={0.3}
										name='Errors'
										strokeWidth={2}
									/>
									<Area
										type='monotone'
										dataKey='warnings'
										stroke='#f59e0b'
										fill='#f59e0b'
										fillOpacity={0.3}
										name='Warnings'
										strokeWidth={2}
									/>
									<Area
										type='monotone'
										dataKey='critical'
										stroke='#dc2626'
										fill='#dc2626'
										fillOpacity={0.3}
										name='Critical'
										strokeWidth={2}
									/>
									<Line
										type='monotone'
										dataKey='errorRate'
										stroke='#8b5cf6'
										name='Error Rate %'
										strokeWidth={2}
										dot={{ r: 4 }}
										activeDot={{ r: 6 }}
									/>
								</AreaChart>
							</ResponsiveContainer>
						) : (
							<div className='flex items-center justify-center h-full text-muted-foreground'>
								No error data available
							</div>
						)}
					</div>

					{/* Error Summary */}
					{data && data.length > 0 && (
						<div className='mt-4 space-y-3'>
							<div className='flex justify-between items-center'>
								<span className='text-sm text-muted-foreground'>
									System Health
								</span>
								<Badge
									variant='secondary'
									className={`text-xs ${severity.color} ${severity.bg}`}>
									<severity.icon className='w-3 h-3 mr-1' />
									{avgErrorRate.toFixed(2)}% Error Rate
								</Badge>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div className='text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20'>
									<div className='text-lg font-bold text-red-600'>
										{totalErrors}
									</div>
									<p className='text-xs text-muted-foreground'>Total Errors</p>
								</div>
								<div className='text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20'>
									<div className='text-lg font-bold text-orange-600'>
										{totalWarnings}
									</div>
									<p className='text-xs text-muted-foreground'>Warnings</p>
								</div>
								<div className='text-center p-3 rounded-lg bg-red-600/10 border border-red-600/20'>
									<div className='text-lg font-bold text-red-700'>
										{totalCritical}
									</div>
									<p className='text-xs text-muted-foreground'>Critical</p>
								</div>
								<div className='text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20'>
									<div className='text-lg font-bold text-green-600'>
										{totalResolved}
									</div>
									<p className='text-xs text-muted-foreground'>Resolved</p>
								</div>
							</div>

							<div className='flex justify-between items-center text-sm'>
								<span className='text-muted-foreground'>Resolution Rate</span>
								<span className='font-semibold text-foreground'>
									{totalErrors > 0
										? ((totalResolved / totalErrors) * 100).toFixed(1)
										: 100}
									%
								</span>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
};
