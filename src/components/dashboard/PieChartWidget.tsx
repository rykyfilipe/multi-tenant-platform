'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from 'recharts';
import { WidgetProps } from '@/types/widgets';
import BaseWidget from './BaseWidget';
import { WidgetDataProvider } from './WidgetDataProvider';
import type { LineChartConfig } from './LineChartWidget';
import { generateChartColors, type ColorPalette } from '@/lib/chart-colors';

interface PieChartWidgetProps extends WidgetProps {
	widget: import('@/types/widgets').BaseWidget;
}

export default function PieChartWidget({ widget, isEditMode, onEdit, onDelete, tenantId, databaseId }: PieChartWidgetProps) {
	// Safely extract config with comprehensive fallbacks
	const config = (widget.config || {}) as LineChartConfig;
	const dataSource = config.dataSource || { type: 'manual', manualData: [] };
	const options = config.options || {};
	
	// Ensure xAxis and yAxis have proper fallbacks
	const safeXAxis = config.xAxis || { key: 'name', label: 'Name', type: 'category' as const };
	const safeYAxis = config.yAxis || { key: 'value', label: 'Value', type: 'number' as const };

	return (
		<WidgetDataProvider widget={widget}>
			{({ data, isLoading, error, refetch }) => {
				return (
					<PieChartWidgetContent
						widget={widget}
						isEditMode={isEditMode}
						onEdit={onEdit}
						onDelete={onDelete}
						data={data}
						isLoading={isLoading}
						error={error}
						onRefresh={refetch}
						config={config}
						dataSource={dataSource}
						safeXAxis={safeXAxis}
						safeYAxis={safeYAxis}
						options={options}
					/>
				);
			}}
		</WidgetDataProvider>
	);
}

interface PieChartWidgetContentProps {
	widget: import('@/types/widgets').BaseWidget;
	isEditMode: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	data: any;
	isLoading: boolean;
	error: string | null;
	onRefresh: () => void;
	config: LineChartConfig;
	dataSource: any;
	safeXAxis: any;
	safeYAxis: any;
	options: any;
}

function PieChartWidgetContent({ 
	widget, 
	isEditMode, 
	onEdit, 
	onDelete, 
	data, 
	isLoading, 
	error, 
	onRefresh,
	config,
	dataSource,
	safeXAxis,
	safeYAxis,
	options
}: PieChartWidgetContentProps) {

	const processedData = useMemo(() => {
		// Data is already mapped by WidgetDataProvider and ChartDataMapper
		if (data && typeof data === 'object' && 'labels' in data && 'datasets' in data) {
			// Chart data is already in the correct format
			const labels = data.labels || [];
			const datasets = data.datasets || [];
			
			if (datasets.length > 0) {
				return labels.map((label: string, index: number) => ({
					name: label,
					value: datasets[0].data[index] || 0
				}));
			}
		}
		
		// Fallback: process raw data if it's not in chart format
		const rawData = Array.isArray(data) ? data : [];
		return rawData.filter(item => {
			if (!item || typeof item !== 'object') return false;
			
			const nameValue = item?.[safeXAxis.key];
			const valueValue = item?.[safeYAxis.key];
			
			return nameValue !== undefined && nameValue !== null && nameValue !== '' &&
				   valueValue !== undefined && valueValue !== null && !isNaN(Number(valueValue));
		}).map(item => ({
			name: item[safeXAxis.key],
			value: Number(item[safeYAxis.key])
		}));
	}, [data, safeXAxis.key, safeYAxis.key]);

	// Generate automatic colors based on data length
	const colors = useMemo(() => {
		if (options.colors && Array.isArray(options.colors) && options.colors.length > 0) {
			return options.colors;
		}
		const colorPalette = (options.colorPalette as ColorPalette) || 'business';
		return generateChartColors(processedData.length, colorPalette);
	}, [options.colors, options.colorPalette, processedData.length]);

	// Enhanced styling configuration
	const widgetStyle = {
		backgroundColor: options.backgroundColor || 'transparent',
		borderRadius: options.borderRadius || 'lg',
		shadow: options.shadow || 'sm',
		padding: options.padding || 'md',
		hoverEffect: options.hoverEffect || 'lift',
		...(widget as any).style
	};

	return (
		<BaseWidget
			widget={widget}
			isEditMode={isEditMode}
			onEdit={onEdit}
			onDelete={onDelete}
			isLoading={isLoading}
			error={error}
			onRefresh={onRefresh}
			showRefresh={true}
			style={widgetStyle}
		>
			{processedData && processedData.length > 0 ? (
				<div className="h-full flex flex-col">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Tooltip 
								contentStyle={{
									backgroundColor: 'hsl(var(--background))',
									border: '1px solid hsl(var(--border))',
									borderRadius: '8px',
									boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
									fontSize: '14px'
								}}
								formatter={(value, name) => [value, name]}
							/>
							{options.showLegend !== false && (
								<Legend 
									wrapperStyle={{
										fontSize: '12px',
										paddingTop: '10px'
									}}
								/>
							)}
							<Pie 
								data={processedData} 
								dataKey={safeYAxis.key} 
								nameKey={safeXAxis.key} 
								outerRadius={(options as any).outerRadius || 80}
								innerRadius={(options as any).innerRadius || 0}
								paddingAngle={(options as any).paddingAngle || 2}
								stroke={(options as any).stroke || '#ffffff'}
								strokeWidth={options.strokeWidth || 2}
							>
								{(processedData ?? []).map((_ : any, index : any) => (
									<Cell 
										key={`cell-${index}`} 
										fill={colors[index % colors.length]}
										stroke={(options as any).stroke || '#ffffff'}
										strokeWidth={options.strokeWidth || 2}
									/>
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					
					{/* Data summary */}
					{options.showDataSummary && (
						<div className="mt-4 p-3 bg-muted/30 rounded-lg">
							<div className="text-sm font-medium text-muted-foreground mb-2">Summary</div>
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div>Total Items: {processedData.length}</div>
								<div>Total Value: {processedData.reduce((sum : any, item : any) => sum + Number(item[safeYAxis.key] || 0), 0)}</div>
							</div>
						</div>
					)}
				</div>
			) : (
				<div className="flex items-center justify-center h-full text-muted-foreground">
					<div className="text-center p-6">
						<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
							<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
						</div>
						<p className="text-sm font-medium">No data available</p>
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


