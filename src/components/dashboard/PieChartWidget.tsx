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
		</BaseWidget>
	);
}


