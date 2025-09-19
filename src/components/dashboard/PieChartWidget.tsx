'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from 'recharts';
import BaseWidget from './BaseWidget';
import type { Widget, LineChartConfig } from './LineChartWidget';
import type { EnhancedDataSource, ChartAxisConfig } from './EnhancedTableSelector';
import { useChartData } from './BaseChartWidget';
import { generateChartColors, type ColorPalette } from '@/lib/chart-colors';

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
	const dataSource = config.dataSource || { type: 'table', tableId: 0 };
	const options = config.options || {};
	
	// Support both old and new data source formats
	const enhancedDataSource = dataSource as EnhancedDataSource;
	const legacyDataSource = dataSource as any; // For backward compatibility
	
	// Determine axis configuration - prefer new format, fallback to legacy
	const safeXAxis = enhancedDataSource.xAxis || config.xAxis || { key: 'name', label: 'Name', type: 'category' as const, columns: ['name'] };
	const safeYAxis = enhancedDataSource.yAxis || config.yAxis || { key: 'value', label: 'Value', type: 'number' as const, columns: ['value'] };
	
	const { data, isLoading, error, handleRefresh } = useChartData(widget, tenantId, databaseId);

	const processedData = useMemo(() => {
		let rawData: any[] = [];
		
		if (dataSource.type === 'manual') {
			rawData = Array.isArray(legacyDataSource.manualData) ? legacyDataSource.manualData : [];
		} else {
			rawData = Array.isArray(data) ? data : [];
		}
		
		// For pie charts, we typically use single columns for name and value
		// But we can support multiple value columns by creating separate pie charts
		// For now, we'll use the first selected column for each axis
		const xColumn = enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key;
		const yColumn = enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key;
		
		// Validate and clean data to prevent property errors
		return rawData.filter(item => {
			if (!item || typeof item !== 'object') return false;
			
			const nameValue = item?.[xColumn];
			const valueValue = item?.[yColumn];
			
			return nameValue !== undefined && nameValue !== null && nameValue !== '' &&
				   valueValue !== undefined && valueValue !== null && !isNaN(Number(valueValue));
		}).map(item => ({
			[safeXAxis.key]: item[xColumn],
			[safeYAxis.key]: item[yColumn]
		}));
	}, [dataSource, data, safeXAxis.key, safeYAxis.key, enhancedDataSource.xAxis, enhancedDataSource.yAxis]);

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
			onRefresh={dataSource.type === 'table' ? handleRefresh : undefined}
			showRefresh={dataSource.type === 'table'}
			style={widgetStyle}
		>
			{processedData && processedData.length > 0 ? (
				<div className="h-full flex flex-col min-h-0">
					<ResponsiveContainer width="100%" height="100%" minHeight={200}>
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
								{(processedData ?? []).map((_, index) => (
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
								<div>Total Value: {processedData.reduce((sum, item) => sum + Number(item[safeYAxis.key] || 0), 0)}</div>
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


