'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import BaseWidget from './BaseWidget';
import type { Widget, LineChartConfig } from './LineChartWidget';
import type { EnhancedDataSource, ChartAxisConfig } from './EnhancedTableSelector';
import { useChartData } from './BaseChartWidget';
import { generateChartColors, type ColorPalette } from '@/lib/chart-colors';

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
	const dataSource = config.dataSource || { type: 'table', tableId: 0 };
	const options = config.options || {};
	
	// Support both old and new data source formats
	const enhancedDataSource = dataSource as EnhancedDataSource;
	const legacyDataSource = dataSource as any; // For backward compatibility
	
	// Determine axis configuration - prefer new format, fallback to legacy
	const safeXAxis = enhancedDataSource.xAxis || config.xAxis || { key: 'x', label: 'X Axis', type: 'category' as const, columns: ['x'] };
	const safeYAxis = enhancedDataSource.yAxis || config.yAxis || { key: 'y', label: 'Y Axis', type: 'number' as const, columns: ['y'] };
	
	const { data, isLoading, error, handleRefresh } = useChartData(widget, tenantId, databaseId);

	const processedData = useMemo(() => {
		const rawData = Array.isArray(data) ? data : [];
		
		// For multi-column support, we need to transform the data
		if (enhancedDataSource.xAxis?.columns && enhancedDataSource.xAxis.columns.length > 1) {
			// If multiple X columns, we need to create multiple series
			const transformedData: any[] = [];
			rawData.forEach(item => {
				enhancedDataSource.xAxis!.columns.forEach(xCol => {
					const yCol = enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key;
					if (item[xCol] !== undefined && item[xCol] !== null && 
						item[yCol] !== undefined && item[yCol] !== null && !isNaN(Number(item[yCol]))) {
						transformedData.push({
							[safeXAxis.key]: item[xCol],
							[safeYAxis.key]: item[yCol],
							series: xCol
						});
					}
				});
			});
			return transformedData;
		}
		
		// Single column mode - validate and clean data
		const xKey = enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key;
		const yKey = enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key;
		
		console.log('[BarChart] Processing data:', {
			rawDataCount: rawData.length,
			xKey,
			yKey,
			sampleData: rawData.slice(0, 2)
		});
		
		return rawData.filter(item => {
			if (!item || typeof item !== 'object') return false;
			
			const xValue = item?.[xKey];
			const yValue = item?.[yKey];
			
			return xValue !== undefined && xValue !== null && xValue !== '' &&
				   yValue !== undefined && yValue !== null && !isNaN(Number(yValue));
		});
	}, [dataSource, data, safeXAxis.key, safeYAxis.key, enhancedDataSource.xAxis, enhancedDataSource.yAxis]);

	// Generate automatic colors based on data length
	const colors = useMemo(() => {
		if (options.colors && Array.isArray(options.colors) && options.colors.length > 0) {
			return options.colors;
		}
		const colorPalette = (options.colorPalette as ColorPalette) || 'business';
		return generateChartColors(processedData.length > 0 ? 1 : 4, colorPalette);
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
						<BarChart 
							data={processedData} 
							margin={{ 
								top: 10, 
								right: 20, 
								left: 10, 
								bottom: 10 
							}}
						>
							{options.showGrid !== false && (
								<CartesianGrid 
									strokeDasharray="3 3" 
									stroke="hsl(var(--muted-foreground) / 0.2)" 
									strokeWidth={1}
								/>
							)}
							<XAxis 
								dataKey={enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key} 
								stroke="hsl(var(--muted-foreground))"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								tick={{ fill: 'hsl(var(--muted-foreground))' }}
								label={{ 
									value: enhancedDataSource.xAxis?.label || safeXAxis.label, 
									position: 'insideBottom', 
									offset: -10,
									style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
								}} 
							/>
							<YAxis 
								stroke="hsl(var(--muted-foreground))"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								tick={{ fill: 'hsl(var(--muted-foreground))' }}
								label={{ 
									value: enhancedDataSource.yAxis?.label || safeYAxis.label, 
									angle: -90, 
									position: 'insideLeft',
									style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
								}} 
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: 'hsl(var(--background))',
									border: '1px solid hsl(var(--border))',
									borderRadius: '8px',
									boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
									fontSize: '14px'
								}}
								labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}
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
							{/* Render multiple bars if multiple X columns are selected */}
							{enhancedDataSource.xAxis?.columns && enhancedDataSource.xAxis.columns.length > 1 ? (
								enhancedDataSource.xAxis.columns.map((xCol, index) => (
									<Bar 
										key={xCol}
										dataKey={enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key} 
										fill={colors[index % colors.length]}
										radius={[4, 4, 0, 0]}
										animationDuration={options.animation !== false ? 1000 : 0}
										name={xCol}
									/>
								))
							) : (
								<Bar 
									dataKey={enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key} 
									fill={colors[0]}
									radius={[4, 4, 0, 0]}
									animationDuration={options.animation !== false ? 1000 : 0}
								/>
							)}
						</BarChart>
					</ResponsiveContainer>
					
					{/* Data summary */}
					{options.showDataSummary && (
						<div className="mt-4 p-3 bg-muted/30 rounded-lg">
							<div className="text-sm font-medium text-muted-foreground mb-2">Summary</div>
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div>Data Points: {processedData.length}</div>
								<div>Max Value: {Math.max(...processedData.map(d => Number(d[safeYAxis.key] || 0)))}</div>
								<div>Min Value: {Math.min(...processedData.map(d => Number(d[safeYAxis.key] || 0)))}</div>
								<div>Avg Value: {(processedData.reduce((sum, d) => sum + Number(d[safeYAxis.key] || 0), 0) / processedData.length).toFixed(2)}</div>
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
							Select a table and columns to load data
						</p>
					</div>
				</div>
			)}
		</BaseWidget>
	);
}


