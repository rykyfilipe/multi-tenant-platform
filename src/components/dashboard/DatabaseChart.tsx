/** @format */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { Database, HardDrive } from "lucide-react";

interface DatabaseChartProps {
	data: {
		databases: Array<{
			name: string;
			tables: number;
			rows: number;
			size: string;
			usage: number;
		}>;
		totalUsage: number;
		limit: number;
	};
}

const DatabaseChart: React.FC<DatabaseChartProps> = ({ data }) => {
	const { t } = useLanguage();
	const usagePercentage = (data.totalUsage / data.limit) * 100;

	return (
		<Card className='dashboard-card'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Database className='h-5 w-5' />
					{t("dashboard.chart.databaseUsage")}
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Overall Usage */}
				<div className='space-y-2'>
					<div className='flex items-center justify-between'>
						<span className='text-sm font-medium'>
							{t("dashboard.chart.overallUsage")}
						</span>
						<span className='text-sm text-muted-foreground'>
							{data.totalUsage} / {data.limit} {t("dashboard.chart.databases")}
						</span>
					</div>
					<Progress value={usagePercentage} className='h-2' />
					<p className='text-xs text-muted-foreground'>
						{(usagePercentage || 0).toFixed(1)}
						{t("dashboard.chart.ofPlanLimit")}
					</p>
				</div>

				{/* Database List */}
				<div className='space-y-4'>
					<h4 className='text-sm font-medium'>
						{t("dashboard.chart.databaseDetails")}
					</h4>
					<div className='space-y-3'>
						{data.databases.map((db, index) => (
							<div
								key={index}
								className='flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/20'>
								<div className='flex items-center gap-3'>
									<HardDrive className='h-4 w-4 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>{db.name}</p>
										<p className='text-xs text-muted-foreground'>
											{db.tables} {t("dashboard.chart.tables")} •{" "}
											{db.rows.toLocaleString()} {t("dashboard.chart.rows")}
										</p>
									</div>
								</div>
								<div className='text-right'>
									<p className='text-sm font-medium'>{db.size}</p>
									<p className='text-xs text-muted-foreground'>
										{db.usage}% {t("dashboard.chart.used")}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default DatabaseChart;
