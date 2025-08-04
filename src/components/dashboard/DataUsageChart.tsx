/** @format */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	BarChart3,
	Database,
	Table,
	HardDrive,
	AlertTriangle,
} from "lucide-react";

interface DataUsageChartProps {
	data: {
		storage: {
			used: number;
			total: number;
			unit: string;
		};
		tables: {
			used: number;
			total: number;
		};
		rows: {
			used: number;
			total: number;
		};
		databases: {
			used: number;
			total: number;
		};
		memory: {
			used: number;
			total: number;
			percentage: number;
			isNearLimit: boolean;
			isOverLimit: boolean;
		};
	};
}

const DataUsageChart: React.FC<DataUsageChartProps> = ({ data }) => {
	const storagePercentage = (data.storage.used / data.storage.total) * 100;
	const tablesPercentage = (data.tables.used / data.tables.total) * 100;
	const rowsPercentage = (data.rows.used / data.rows.total) * 100;
	const databasesPercentage =
		(data.databases.used / data.databases.total) * 100;
	const memoryPercentage = data.memory.percentage;

	const getUsageColor = (percentage: number) => {
		if (percentage >= 90) return "bg-red-500";
		if (percentage >= 75) return "bg-yellow-500";
		return "bg-green-500";
	};

	return (
		<Card className='dashboard-card'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<BarChart3 className='h-5 w-5' />
					Data Usage Overview
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Storage Usage */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<HardDrive className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>Storage</span>
					</div>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								{data.storage.used} / {data.storage.total} {data.storage.unit}
							</span>
							<span className='text-sm font-medium'>
								{storagePercentage.toFixed(1)}%
							</span>
						</div>
						<Progress
							value={storagePercentage}
							className='h-2'
							style={
								{
									"--progress-background": getUsageColor(storagePercentage),
								} as React.CSSProperties
							}
						/>
					</div>
				</div>

				{/* Tables Usage */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<Table className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>Tables</span>
					</div>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								{data.tables.used.toLocaleString()} /{" "}
								{data.tables.total.toLocaleString()}
							</span>
							<span className='text-sm font-medium'>
								{tablesPercentage.toFixed(1)}%
							</span>
						</div>
						<Progress
							value={tablesPercentage}
							className='h-2'
							style={
								{
									"--progress-background": getUsageColor(tablesPercentage),
								} as React.CSSProperties
							}
						/>
					</div>
				</div>

				{/* Rows Usage */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<BarChart3 className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>Data Rows</span>
					</div>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								{data.rows.used.toLocaleString()} /{" "}
								{data.rows.total.toLocaleString()}
							</span>
							<span className='text-sm font-medium'>
								{rowsPercentage.toFixed(1)}%
							</span>
						</div>
						<Progress
							value={rowsPercentage}
							className='h-2'
							style={
								{
									"--progress-background": getUsageColor(rowsPercentage),
								} as React.CSSProperties
							}
						/>
					</div>
				</div>

				{/* Databases Usage */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<Database className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>Databases</span>
					</div>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								{data.databases.used} / {data.databases.total}
							</span>
							<span className='text-sm font-medium'>
								{databasesPercentage.toFixed(1)}%
							</span>
						</div>
						<Progress
							value={databasesPercentage}
							className='h-2'
							style={
								{
									"--progress-background": getUsageColor(databasesPercentage),
								} as React.CSSProperties
							}
						/>
					</div>
				</div>

				{/* Memory Usage */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<HardDrive className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>Storage</span>
						{data.memory.isOverLimit && (
							<AlertTriangle className='h-3 w-3 text-red-500' />
						)}
						{data.memory.isNearLimit && !data.memory.isOverLimit && (
							<AlertTriangle className='h-3 w-3 text-yellow-500' />
						)}
					</div>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								{data.memory.used.toFixed(3)} / {data.memory.total} GB
							</span>
							<span className='text-sm font-medium'>
								{memoryPercentage.toFixed(1)}%
							</span>
						</div>
						<Progress
							value={memoryPercentage}
							className='h-2'
							style={
								{
									"--progress-background": getUsageColor(memoryPercentage),
								} as React.CSSProperties
							}
						/>
						{data.memory.isOverLimit && (
							<p className='text-xs text-red-500 font-medium'>
								⚠️ Storage limit exceeded
							</p>
						)}
						{data.memory.isNearLimit && !data.memory.isOverLimit && (
							<p className='text-xs text-yellow-500 font-medium'>
								⚠️ Approaching limit
							</p>
						)}
					</div>
				</div>

				{/* Usage Summary */}
				<div className='grid grid-cols-2 gap-4 pt-4 border-t border-border/20'>
					<div className='text-center'>
						<div className='text-lg font-bold text-green-500'>
							{Math.min(
								storagePercentage,
								tablesPercentage,
								rowsPercentage,
								databasesPercentage,
							).toFixed(1)}
							%
						</div>
						<p className='text-xs text-muted-foreground'>Lowest Usage</p>
					</div>
					<div className='text-center'>
						<div className='text-lg font-bold text-red-500'>
							{Math.max(
								storagePercentage,
								tablesPercentage,
								rowsPercentage,
								databasesPercentage,
							).toFixed(1)}
							%
						</div>
						<p className='text-xs text-muted-foreground'>Highest Usage</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default DataUsageChart;
