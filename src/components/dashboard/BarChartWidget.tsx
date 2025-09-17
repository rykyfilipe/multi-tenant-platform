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
	tenantId?: number;
	databaseId?: number;
}

export default function BarChartWidget({ widget, isEditMode, onEdit, tenantId, databaseId }: BarChartWidgetProps) {
	const config = (widget.config || {}) as LineChartConfig;
	const dataSource = config.dataSource || { type: 'manual', manualData: [] };
	const options = config.options || {};
	
	const { data, isLoading, handleRefresh } = useChartData(widget, tenantId, databaseId);

	const processedData = useMemo(() => {
		if (dataSource.type === 'manual') return dataSource.manualData || [];
		return data;
	}, [dataSource, data]);

	return (
		<BaseWidget
			widget={widget}
			isEditMode={isEditMode}
			onEdit={onEdit}
			isLoading={isLoading}
			error={null}
			onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
			showRefresh={dataSource.type === 'table'}
		>
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
		</BaseWidget>
	);
}


