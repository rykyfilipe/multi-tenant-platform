'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from 'recharts';
import BaseWidget from './BaseWidget';
import type { Widget, LineChartConfig } from './LineChartWidget';
import { useChartData } from './BaseChartWidget';

interface PieChartWidgetProps {
	widget: Widget;
	isEditMode?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	tenantId?: number;
	databaseId?: number;
}

export default function PieChartWidget({ widget, isEditMode, onEdit, onDelete, tenantId, databaseId }: PieChartWidgetProps) {
	// Safely extract config with comprehensive fallbacks
	const config = (widget.config || {}) as LineChartConfig;
	const dataSource = config.dataSource || { type: 'manual', manualData: [] };
	const options = config.options || {};
	
	// Ensure xAxis and yAxis have proper fallbacks
	const safeXAxis = config.xAxis || { key: 'name', label: 'Name', type: 'category' as const };
	const safeYAxis = config.yAxis || { key: 'value', label: 'Value', type: 'number' as const };
	
	const { data, isLoading, handleRefresh } = useChartData(widget, tenantId, databaseId);

	const processedData = useMemo(() => {
		let rawData: any[] = [];
		
		if (dataSource.type === 'manual') {
			rawData = Array.isArray(dataSource.manualData) ? dataSource.manualData : [];
		} else {
			rawData = Array.isArray(data) ? data : [];
		}
		
		// Validate and clean data to prevent property errors
		return rawData.filter(item => {
			if (!item || typeof item !== 'object') return false;
			
			const nameValue = item?.[safeXAxis.key];
			const valueValue = item?.[safeYAxis.key];
			
			return nameValue !== undefined && nameValue !== null && nameValue !== '' &&
				   valueValue !== undefined && valueValue !== null && !isNaN(Number(valueValue));
		});
	}, [dataSource, data, safeXAxis.key, safeYAxis.key]);

	const colors = options.colors || ['#3B82F6', '#22C55E', '#F97316', '#EF4444', '#A855F7'];

	return (
		<BaseWidget
			widget={widget}
			isEditMode={isEditMode}
			onEdit={onEdit}
			onDelete={onDelete}
			isLoading={isLoading}
			error={null}
			onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
			showRefresh={dataSource.type === 'table'}
		>
			{processedData && processedData.length > 0 ? (
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Tooltip />
						{options.showLegend !== false && <Legend />}
						<Pie data={processedData} dataKey={safeYAxis.key} nameKey={safeXAxis.key} outerRadius={80}>
							{(processedData ?? []).map((_, index) => (
								<Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
							))}
						</Pie>
					</PieChart>
				</ResponsiveContainer>
			) : (
				<div className="flex items-center justify-center h-full text-muted-foreground">
					<div className="text-center">
						<p className="text-sm">No data available</p>
						<p className="text-xs text-muted-foreground mt-1">
							{dataSource.type === 'manual' 
								? 'Add some data points to see the chart' 
								: 'Select a table and columns to load data'
							}
						</p>
					</div>
				</div>
			)}
		</BaseWidget>
	);
}


