'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import BaseWidget from './BaseWidget';
import type { Widget, LineChartConfig } from './LineChartWidget';
import type { EnhancedDataSource, ChartAxisConfig } from './EnhancedTableSelector';
import { useChartData } from './BaseChartWidget';
import { generateChartColors, type ColorPalette } from '@/lib/chart-colors';

// BarChart configuration interface (extends LineChartConfig)
export interface BarChartConfig extends LineChartConfig {
  options?: LineChartConfig['options'] & {
    barWidth?: number;
    barGap?: number;
    showValues?: boolean;
  };
}

// Aggregation functions
const applyAggregation = (data: any[], key: string, aggregation?: string): any[] => {
  if (!aggregation || aggregation === 'none') {
    return data;
  }

  const grouped = data.reduce((acc: Record<string, any[]>, item: any) => {
    const groupKey = item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return Object.entries(grouped).map(([groupKey, items]: [string, any[]]) => {
    const aggregatedItem: any = { [key]: groupKey };
    
    // Apply aggregation to all numeric columns
    items.forEach((item: any) => {
      Object.keys(item).forEach(colKey => {
        if (colKey !== key && typeof item[colKey] === 'number') {
          const values = items.map((i: any) => i[colKey]).filter((v: any) => !isNaN(v));
          if (values.length > 0) {
            switch (aggregation) {
              case 'sum':
                aggregatedItem[colKey] = values.reduce((a: number, b: number) => a + b, 0);
                break;
              case 'count':
                aggregatedItem[colKey] = values.length;
                break;
              case 'avg':
                aggregatedItem[colKey] = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                break;
              case 'min':
                aggregatedItem[colKey] = Math.min(...values);
                break;
              case 'max':
                aggregatedItem[colKey] = Math.max(...values);
                break;
              case 'median':
                const sorted = values.sort((a: number, b: number) => a - b);
                const mid = Math.floor(sorted.length / 2);
                aggregatedItem[colKey] = sorted.length % 2 === 0 
                  ? (sorted[mid - 1] + sorted[mid]) / 2 
                  : sorted[mid];
                break;
              case 'stddev':
                const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                const variance = values.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / values.length;
                aggregatedItem[colKey] = Math.sqrt(variance);
                break;
              default:
                aggregatedItem[colKey] = item[colKey];
            }
          }
        }
      });
    });
    
    return aggregatedItem;
  });
};

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
	
	// Determine axis configuration - prefer new format, fallback to legacy
	const safeXAxis = enhancedDataSource.xAxis || config.xAxis || { key: 'x', label: 'X Axis', type: 'category' as const, columns: ['x'] };
	const safeYAxis = enhancedDataSource.yAxis || config.yAxis || { key: 'y', label: 'Y Axis', type: 'number' as const, columns: ['y'] };
	
	const { data, isLoading, error, handleRefresh } = useChartData(widget, tenantId, databaseId);

	const processedData = useMemo(() => {
		const rawData = Array.isArray(data) ? data : [];
		
		// For multi-column support on Y-axis (multiple series)
		if (enhancedDataSource.yAxis?.columns && enhancedDataSource.yAxis.columns.length > 1) {
			console.log('[BarChart] Processing multi-column Y-axis:', {
				yColumns: enhancedDataSource.yAxis.columns,
				rawDataCount: rawData.length
			});
			
			// Data already contains all Y columns from BaseChartWidget mapping
			// Just filter and validate the data
			const xColumn = enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key;
			const filteredData = rawData.filter(item => {
				if (!item || typeof item !== 'object') return false;
				
				const xValue = item?.[xColumn];
				const hasValidY = enhancedDataSource.yAxis!.columns.some(yCol => {
					const yValue = item?.[yCol];
					return yValue !== undefined && yValue !== null && !isNaN(Number(yValue));
				});
				
				return xValue !== undefined && xValue !== null && xValue !== '' && hasValidY;
			});
			
			console.log('[BarChart] Multi-column Y-axis result:', {
				filteredDataCount: filteredData.length,
				sampleData: filteredData.slice(0, 2),
				yColumns: enhancedDataSource.yAxis.columns
			});
			
			// Apply aggregation if specified for multi-column
			const yAggregation = enhancedDataSource.yAxis?.aggregation;
			if (yAggregation && yAggregation !== 'none') {
				console.log('[BarChart] Applying Y-axis aggregation for multi-column:', yAggregation);
				return applyAggregation(filteredData, xColumn, yAggregation);
			}
			
			return filteredData;
		}
		
		// For multi-column support on X-axis (multiple series)
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
			enhancedDataSource,
			yAxisColumns: enhancedDataSource.yAxis?.columns,
			xAxisColumns: enhancedDataSource.xAxis?.columns,
			xKey,
			yKey,
			sampleData: rawData.slice(0, 2)
		});
		
		// Filter and clean data
		const filteredData = rawData.filter(item => {
			if (!item || typeof item !== 'object') return false;
			
			const xValue = item?.[xKey];
			const yValue = item?.[yKey];
			
			return xValue !== undefined && xValue !== null && xValue !== '' &&
				   yValue !== undefined && yValue !== null && !isNaN(Number(yValue));
		});

		// Apply aggregation if specified
		const xAggregation = enhancedDataSource.xAxis?.aggregation;
		const yAggregation = enhancedDataSource.yAxis?.aggregation;
		
		if (xAggregation && xAggregation !== 'none') {
			console.log('[BarChart] Applying X-axis aggregation:', xAggregation);
			return applyAggregation(filteredData, xKey, xAggregation);
		} else if (yAggregation && yAggregation !== 'none') {
			console.log('[BarChart] Applying Y-axis aggregation:', yAggregation);
			return applyAggregation(filteredData, yKey, yAggregation);
		}
		
		return filteredData;
	}, [dataSource, data, safeXAxis.key, safeYAxis.key, enhancedDataSource.xAxis, enhancedDataSource.yAxis]);

	// Enhanced color generation with custom column colors support
	const colors = useMemo(() => {
		// Check if we have custom column colors defined
		const columnColors = options?.columnColors;
		const yColumns = enhancedDataSource.yAxis?.columns || [];
		
		if (columnColors && yColumns.length > 0) {
			// Use custom colors for each column
			const customColors = yColumns.map(column => columnColors[column] || '#3B82F6');
			console.log('[BarChart] Using custom column colors:', {
				yColumns,
				columnColors,
				customColors
			});
			return customColors;
		}
		
		// Fallback to predefined colors
		if (options.colors && Array.isArray(options.colors) && options.colors.length > 0) {
			return options.colors;
		}
		
		// Generate automatic colors based on number of columns
		const colorPalette = (options.colorPalette as ColorPalette) || 'business';
		// Prioritize Y columns for multi-series, fallback to X columns
		const yColumnsCount = enhancedDataSource.yAxis?.columns?.length || 1;
		const xColumnsCount = enhancedDataSource.xAxis?.columns?.length || 1;
		const columnsCount = Math.max(yColumnsCount, xColumnsCount);
		const colorsNeeded = Math.max(columnsCount, 1); // Generate at least 1 color, but prefer actual column count
		console.log('[BarChart] Before generating colors:', {
			yColumnsCount,
			xColumnsCount,
			columnsCount,
			colorsNeeded,
			colorPalette
		});
		
		const generatedColors = generateChartColors(colorsNeeded, colorPalette);
		
		console.log('[BarChart] Generated colors:', {
			yColumnsCount,
			xColumnsCount,
			columnsCount,
			colorsNeeded,
			colors: generatedColors,
			colorsLength: generatedColors.length
		});
		
		return generatedColors;
	}, [options?.columnColors, options?.colors, options?.colorPalette, enhancedDataSource.xAxis?.columns?.length, enhancedDataSource.yAxis?.columns?.length]);

	// Enhanced styling configuration
	const widgetStyle = {
		backgroundColor: options.backgroundColor || 'transparent',
		borderRadius: (options.borderRadius as any) || 'lg',
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
									value: enhancedDataSource.yAxis?.columns && enhancedDataSource.yAxis.columns.length > 1 
										? 'Values' 
										: (enhancedDataSource.yAxis?.label || safeYAxis.label), 
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
										paddingTop: '10px',
										maxHeight: '100px',
										overflow: 'hidden'
									}}
									verticalAlign="bottom"
									height={36}
									formatter={(value, entry) => {
										// Truncate long names and show full on hover
										return value.length > 15 ? value.substring(0, 15) + '...' : value;
									}}
								/>
							)}
							{/* Render multiple bars if multiple Y columns are selected */}
							{enhancedDataSource.yAxis?.columns && enhancedDataSource.yAxis.columns.length > 1 ? (
								(() => {
									console.log('[BarChart] Rendering multiple Y columns:', {
										yColumns: enhancedDataSource.yAxis.columns,
										colors: colors,
										processedDataLength: processedData.length
									});
									return enhancedDataSource.yAxis.columns.map((yCol, index) => {
										console.log('[BarChart] Creating Bar for:', { yCol, index, color: colors[index % colors.length] });
										return (
											<Bar 
												key={yCol}
												dataKey={yCol} 
												fill={colors[index % colors.length]}
												radius={[4, 4, 0, 0]}
												animationDuration={options.animation !== false ? 1000 : 0}
												name={yCol}
											/>
										);
									});
								})()
							) : enhancedDataSource.xAxis?.columns && enhancedDataSource.xAxis.columns.length > 1 ? (
								/* Render multiple bars if multiple X columns are selected */
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


