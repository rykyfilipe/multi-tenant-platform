/** @format */

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import {
	BarChart3,
	Database,
	Table,
	HardDrive,
	AlertTriangle,
} from "lucide-react";
import { formatStorageSize, convertMBToBytes } from "@/lib/storage-utils";

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
	const { t } = useLanguage();

	// Memoize all calculations to prevent unnecessary re-renders
	const chartData = useMemo(() => {
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

		return {
			tables: {
				percentage: tablesPercentage,
				color: getUsageColor(tablesPercentage),
			},
			rows: {
				percentage: rowsPercentage,
				color: getUsageColor(rowsPercentage),
			},
			databases: {
				percentage: databasesPercentage,
				color: getUsageColor(databasesPercentage),
			},
			memory: {
				percentage: memoryPercentage,
				color: getUsageColor(memoryPercentage),
			},
			summary: {
				lowest: Math.min(
					memoryPercentage,
					tablesPercentage,
					rowsPercentage,
					databasesPercentage,
				),
				highest: Math.max(
					memoryPercentage,
					tablesPercentage,
					rowsPercentage,
					databasesPercentage,
				),
			},
		};
	}, [data]);

	return (
		<Card className='dashboard-card'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<BarChart3 className='h-5 w-5' />
					{t("dashboard.dataUsage.dataUsageOverview")}
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Storage Usage */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<HardDrive className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>
							{t("dashboard.dataUsage.storage")}
						</span>
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
								{formatStorageSize(convertMBToBytes(data.memory.used || 0))} /{" "}
								{formatStorageSize(convertMBToBytes(data.memory.total || 0))}
							</span>
							<span className='text-sm font-medium'>
								{chartData.memory.percentage.toFixed(1)}%
							</span>
						</div>
						<Progress
							value={chartData.memory.percentage}
							className='h-2'
							style={
								{
									"--progress-background": chartData.memory.color,
								} as React.CSSProperties
							}
						/>
						{data.memory.isOverLimit && (
							<p className='text-xs text-red-500 font-medium'>
								{t("dashboard.stats.storageLimitExceeded")}
							</p>
						)}
						{data.memory.isNearLimit && !data.memory.isOverLimit && (
							<p className='text-xs text-yellow-500 mt-1 font-medium'>
								{t("dashboard.stats.approachingLimit")}
							</p>
						)}
					</div>
				</div>

				{/* Tables Usage */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<Table className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>
							{t("dashboard.dataUsage.tables")}
						</span>
					</div>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								{data.tables.used.toLocaleString()} /{" "}
								{data.tables.total.toLocaleString()}
							</span>
							<span className='text-sm font-medium'>
								{chartData.tables.percentage.toFixed(1)}%
							</span>
						</div>
						<Progress
							value={chartData.tables.percentage}
							className='h-2'
							style={
								{
									"--progress-background": chartData.tables.color,
								} as React.CSSProperties
							}
						/>
					</div>
				</div>

				{/* Rows Usage */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<BarChart3 className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>
							{t("dashboard.dataUsage.dataRows")}
						</span>
					</div>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								{data.rows.used.toLocaleString()} /{" "}
								{data.rows.total.toLocaleString()}
							</span>
							<span className='text-sm font-medium'>
								{chartData.rows.percentage.toFixed(1)}%
							</span>
						</div>
						<Progress
							value={chartData.rows.percentage}
							className='h-2'
							style={
								{
									"--progress-background": chartData.rows.color,
								} as React.CSSProperties
							}
						/>
					</div>
				</div>

				{/* Databases Usage */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<Database className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>
							{t("dashboard.dataUsage.databases")}
						</span>
					</div>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								{data.databases.used} / {data.databases.total}
							</span>
							<span className='text-sm font-medium'>
								{chartData.databases.percentage.toFixed(1)}%
							</span>
						</div>
						<Progress
							value={chartData.databases.percentage}
							className='h-2'
							style={
								{
									"--progress-background": chartData.databases.color,
								} as React.CSSProperties
							}
						/>
					</div>
				</div>

				{/* Usage Summary */}
				<div className='grid grid-cols-2 gap-4 pt-4 border-t border-border/20'>
					<div className='text-center'>
						<div className='text-lg font-bold text-green-500'>
							{chartData.summary.lowest.toFixed(1)}%
						</div>
						<p className='text-xs text-muted-foreground'>
							{t("dashboard.dataUsage.lowestUsage")}
						</p>
					</div>
					<div className='text-center'>
						<div className='text-lg font-bold text-red-500'>
							{chartData.summary.highest.toFixed(1)}%
						</div>
						<p className='text-xs text-muted-foreground'>
							{t("dashboard.dataUsage.highestUsage")}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default React.memo(DataUsageChart);
