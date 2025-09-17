'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import BaseWidget from './BaseWidget';
import type { Widget, LineChartConfig } from './LineChartWidget';
import { useChartData } from './BaseChartWidget';

interface BarChartWidgetProps {
	widget: Widget;
	isEditMode?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	tenantId?: number;
	databaseId?: number;
}

export default function BarChartWidget({ widget, isEditMode, onEdit, onDelete, tenantId, databaseId }: BarChartWidgetProps) {
	// Safely extract config with comprehensive fallbacks
	const config = (widget.config || {}) as LineChartConfig;
	const dataSource = config.dataSource || { type: 'manual', manualData: [] };
	const options = config.options || {};
	
	// Ensure xAxis and yAxis have proper fallbacks
	const safeXAxis = config.xAxis || { key: 'x', label: 'X Axis', type: 'category' as const };
	const safeYAxis = config.yAxis || { key: 'y', label: 'Y Axis', type: 'number' as const };
	
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
			
			const xValue = item?.[safeXAxis.key];
			const yValue = item?.[safeYAxis.key];
			
			return xValue !== undefined && xValue !== null && xValue !== '' &&
				   yValue !== undefined && yValue !== null && !isNaN(Number(yValue));
		});
	}, [dataSource, data, safeXAxis.key, safeYAxis.key]);

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
					<BarChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
						{options.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
						<XAxis dataKey={safeXAxis.key} label={{ value: safeXAxis.label, position: 'insideBottom', offset: -5 }} />
						<YAxis label={{ value: safeYAxis.label, angle: -90, position: 'insideLeft' }} />
						<Tooltip />
						{options.showLegend !== false && <Legend />}
						<Bar dataKey={safeYAxis.key} fill={(options.colors && options.colors[0]) || '#3B82F6'} />
					</BarChart>
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


