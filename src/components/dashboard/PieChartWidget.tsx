'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Edit3 } from 'lucide-react';
import type { Widget, LineChartConfig } from './LineChartWidget';
import { useChartData } from './BaseChartWidget';

interface PieChartWidgetProps {
	widget: Widget;
	isEditMode?: boolean;
	onEdit?: () => void;
	tenantId?: number;
	databaseId?: number;
}

export default function PieChartWidget({ widget, isEditMode, onEdit, tenantId, databaseId }: PieChartWidgetProps) {
	const config = (widget.config || {}) as LineChartConfig;
	const dataSource = config.dataSource || { type: 'manual', manualData: [] };
	const options = config.options || {};
	
	const { data, isLoading, handleRefresh } = useChartData(widget, tenantId, databaseId);

	const processedData = useMemo(() => {
		if (dataSource.type === 'manual') return dataSource.manualData || [];
		return data;
	}, [dataSource, data]);

	const colors = options.colors || ['#3B82F6', '#22C55E', '#F97316', '#EF4444', '#A855F7'];

	return (
		<Card className="h-full">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium">{widget.title || config.title || 'Pie Chart'}</CardTitle>
					{dataSource.type === 'table' && (
						<Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
							<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
						</Button>
					)}
					{isEditMode && onEdit && (
						<Button 
							variant="ghost" 
							size="sm" 
							onClick={(e) => {
								console.log('Pie chart edit button clicked:', widget.id);
								e.stopPropagation();
								onEdit();
							}}
						>
							<Edit3 className="h-4 w-4" />
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="pt-0 h-full">
				<div className="h-full min-h-[200px]">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Tooltip />
							{options.showLegend !== false && <Legend />}
							<Pie data={processedData} dataKey={config.yAxis?.key || 'value'} nameKey={config.xAxis?.key || 'name'} outerRadius={80}>
								{processedData.map((_, index) => (
									<Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}


