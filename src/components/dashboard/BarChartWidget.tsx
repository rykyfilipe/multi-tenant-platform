'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { Widget, LineChartConfig, ChartDataPoint } from './LineChartWidget';

interface BarChartWidgetProps {
	widget: Widget;
	isEditMode?: boolean;
	onEdit?: () => void;
	data?: ChartDataPoint[];
	isLoading?: boolean;
	onRefresh?: () => void;
}

export default function BarChartWidget({ widget, data = [], isLoading, onRefresh }: BarChartWidgetProps) {
	const config = (widget.config || {}) as LineChartConfig;
	const dataSource = config.dataSource || { type: 'manual', manualData: [] };
	const options = config.options || {};

	const processedData = useMemo(() => {
		if (dataSource.type === 'manual') return dataSource.manualData || [];
		return data;
	}, [dataSource, data]);

	return (
		<Card className="h-full">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium">{widget.title || config.title || 'Bar Chart'}</CardTitle>
					{dataSource.type === 'table' && (
						<Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
							<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="pt-0 h-full">
				<div className="h-full min-h-[200px]">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
							{options.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
							<XAxis dataKey={config.xAxis?.key || 'x'} label={{ value: config.xAxis?.label, position: 'insideBottom', offset: -5 }} />
							<YAxis label={{ value: config.yAxis?.label, angle: -90, position: 'insideLeft' }} />
							<Tooltip />
							{options.showLegend !== false && <Legend />}
							<Bar dataKey={config.yAxis?.key || 'y'} fill={(options.colors && options.colors[0]) || '#3B82F6'} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}


