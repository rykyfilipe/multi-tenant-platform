'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import BaseWidget from './BaseWidget';
// Widget interface
interface Widget {
	id: number;
	title: string;
	type: string;
	config?: any;
	position?: { x: number; y: number; w: number; h: number };
}
import type { EnhancedDataSource, ChartAxisConfig } from './EnhancedTableSelector';
import { useChartData } from './BaseChartWidget';
import { generateChartColors, type ColorPalette } from '@/lib/chart-colors';

// LineChart configuration interface
export interface LineChartConfig {
	dataSource?: EnhancedDataSource;
	xAxis?: ChartAxisConfig;
	yAxis?: ChartAxisConfig;
  options?: {
    colors?: string[];
    colorPalette?: ColorPalette;
    strokeWidth?: number;
    dotSize?: number;
    curveType?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
		showGrid?: boolean;
		showLegend?: boolean;
    showDataSummary?: boolean;
    animation?: boolean;
		backgroundColor?: string;
		borderRadius?: string;
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

interface LineChartWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
	tenantId?: number;
	databaseId?: number;
}

export default function LineChartWidget({ widget, isEditMode, onEdit, onDelete, tenantId, databaseId }: LineChartWidgetProps) {
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
		
		console.log('[LineChart] Processing data:', {
			rawDataCount: rawData.length,
			enhancedDataSource,
			safeXAxis,
			safeYAxis,
			sampleRawData: rawData.slice(0, 2)
		});
		
		// For multi-column support on Y-axis (multiple series)
		if (enhancedDataSource.yAxis?.columns && enhancedDataSource.yAxis.columns.length > 1) {
			const transformedData: any[] = [];
			const xColumn = enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key;
			
			rawData.forEach(item => {
				const baseItem: any = {
					[xColumn]: item[xColumn]
				};
				
				enhancedDataSource.yAxis!.columns.forEach(yCol => {
					if (item[yCol] !== undefined && item[yCol] !== null && !isNaN(Number(item[yCol]))) {
						baseItem[yCol] = item[yCol];
					}
				});
				
				if (Object.keys(baseItem).length > 1) { // Has at least one Y value
					transformedData.push(baseItem);
				}
			});
			
			// Apply aggregation if specified for multi-column
			const yAggregation = enhancedDataSource.yAxis?.aggregation;
			if (yAggregation && yAggregation !== 'none') {
				console.log('[LineChart] Applying Y-axis aggregation for multi-column:', yAggregation);
				return applyAggregation(transformedData, xColumn, yAggregation);
			}
			
			return transformedData;
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
		
		console.log('[LineChart] Processing single column data:', {
			rawDataCount: rawData.length,
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
			console.log('[LineChart] Applying X-axis aggregation:', xAggregation);
			return applyAggregation(filteredData, xKey, xAggregation);
		} else if (yAggregation && yAggregation !== 'none') {
			console.log('[LineChart] Applying Y-axis aggregation:', yAggregation);
			return applyAggregation(filteredData, yKey, yAggregation);
		}
		
		return filteredData;
	}, [dataSource, data, safeXAxis.key, safeYAxis.key, enhancedDataSource.xAxis, enhancedDataSource.yAxis]);

	// Generate automatic colors based on number of columns
	const colors = useMemo(() => {
		if (options.colors && Array.isArray(options.colors) && options.colors.length > 0) {
			return options.colors;
		}
		const colorPalette = (options.colorPalette as ColorPalette) || 'business';
		// Prioritize Y columns for multi-series, fallback to X columns
		const yColumnsCount = enhancedDataSource.yAxis?.columns?.length || 1;
		const xColumnsCount = enhancedDataSource.xAxis?.columns?.length || 1;
		const columnsCount = Math.max(yColumnsCount, xColumnsCount);
		const colorsNeeded = Math.max(columnsCount, 4);
		const generatedColors = generateChartColors(colorsNeeded, colorPalette);
		console.log('[LineChart] Generated colors:', {
			yColumnsCount,
			xColumnsCount,
			columnsCount,
			colorsNeeded,
			colors: generatedColors
		});
		return generatedColors;
	}, [options.colors, options.colorPalette, enhancedDataSource.xAxis?.columns?.length, enhancedDataSource.yAxis?.columns?.length]);

	// Enhanced styling configuration
	const widgetStyle = {
		backgroundColor: options.backgroundColor || 'transparent',
		borderRadius: (options.borderRadius as any) || 'lg',
	};

	// Chart styling options
	const strokeWidth = options.strokeWidth || 2;
	const dotSize = options.dotSize || 4;
	const curveType = options.curveType || 'monotone';

	// Debug processed data
	console.log('[LineChart] Final processed data:', {
		processedDataCount: processedData.length,
		sampleProcessedData: processedData.slice(0, 2),
		xKey: enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key,
		yKey: enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key,
		enhancedDataSource: {
			xAxis: enhancedDataSource.xAxis,
			yAxis: enhancedDataSource.yAxis,
			xColumns: enhancedDataSource.xColumns,
			yColumns: enhancedDataSource.yColumns
		}
	});

  // Early return if widget is malformed
  if (!widget || typeof widget !== 'object') {
    return (
      <BaseWidget
        widget={widget}
        isEditMode={isEditMode}
        onEdit={onEdit}
				onDelete={onDelete}
        isLoading={false}
        error="Invalid widget configuration"
      >
        <div className="flex items-center justify-center h-full text-red-500">
          <div className="text-center">
            <p className="text-sm">Invalid widget configuration</p>
          </div>
        </div>
      </BaseWidget>
    );
  }

	// Show error state
	if (error) {
		return (
			<BaseWidget
				widget={widget}
				isEditMode={isEditMode}
				onEdit={onEdit}
				onDelete={onDelete}
				isLoading={false}
				error={error}
				onRefresh={handleRefresh}
			>
				<div className="flex items-center justify-center h-full text-red-500">
					<div className="text-center">
						<p className="text-sm font-medium">Error loading data</p>
						<p className="text-xs text-muted-foreground mt-1">{error}</p>
					</div>
				</div>
			</BaseWidget>
		);
	}

	// Show loading state
	if (isLoading) {
		return (
			<BaseWidget
				widget={widget}
				isEditMode={isEditMode}
				onEdit={onEdit}
				onDelete={onDelete}
				isLoading={true}
			>
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
						<p className="text-sm text-muted-foreground">Loading chart data...</p>
					</div>
				</div>
			</BaseWidget>
		);
	}

	// Show no data state
	if (!processedData || processedData.length === 0) {
		return (
			<BaseWidget
				widget={widget}
				isEditMode={isEditMode}
				onEdit={onEdit}
				onDelete={onDelete}
				isLoading={false}
				onRefresh={handleRefresh}
			>
				<div className="flex items-center justify-center h-full text-muted-foreground">
					<div className="text-center">
						<p className="text-sm font-medium">No data available</p>
						<p className="text-xs mt-1">Select a table and configure columns to display data</p>
					</div>
				</div>
			</BaseWidget>
		);
	}

  return (
      <BaseWidget
        widget={widget}
        isEditMode={isEditMode}
        onEdit={onEdit}
        onDelete={onDelete}
        isLoading={isLoading}
			onRefresh={handleRefresh}
        style={widgetStyle}
      >
			<div className="h-full flex flex-col min-h-0">
				<ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <LineChart 
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
						{/* Render multiple lines if multiple Y columns are selected */}
						{enhancedDataSource.yAxis?.columns && enhancedDataSource.yAxis.columns.length > 1 ? (
							enhancedDataSource.yAxis.columns.map((yCol, index) => (
								<Line
									key={yCol}
									type={curveType}
									dataKey={yCol}
									stroke={colors[index % colors.length]}
									strokeWidth={strokeWidth}
									dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: dotSize, stroke: '#ffffff' }}
									activeDot={{ 
										r: dotSize + 2, 
										stroke: colors[index % colors.length], 
										strokeWidth: 2,
										fill: '#ffffff'
									}}
									animationDuration={options.animation !== false ? 1000 : 0}
									name={yCol}
								/>
							))
						) : enhancedDataSource.xAxis?.columns && enhancedDataSource.xAxis.columns.length > 1 ? (
							/* Render multiple lines if multiple X columns are selected */
							enhancedDataSource.xAxis.columns.map((xCol, index) => (
								<Line
									key={xCol}
									type={curveType}
									dataKey={enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key}
									stroke={colors[index % colors.length]}
									strokeWidth={strokeWidth}
									dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: dotSize, stroke: '#ffffff' }}
									activeDot={{ 
										r: dotSize + 2, 
										stroke: colors[index % colors.length], 
										strokeWidth: 2,
										fill: '#ffffff'
									}}
									animationDuration={options.animation !== false ? 1000 : 0}
									name={xCol}
								/>
							))
						) : (
              <Line
                type={curveType}
								dataKey={enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key}
                stroke={colors[0]}
                strokeWidth={strokeWidth}
                dot={{ fill: colors[0], strokeWidth: 2, r: dotSize, stroke: '#ffffff' }}
                activeDot={{ 
                  r: dotSize + 2, 
                  stroke: colors[0], 
                  strokeWidth: 2,
                  fill: '#ffffff'
                }}
                animationDuration={options.animation !== false ? 1000 : 0}
              />
						)}
            </LineChart>
          </ResponsiveContainer>
          
          {/* Data summary */}
          {options.showDataSummary && (
					<div className="mt-2 text-xs text-muted-foreground text-center">
						{processedData.length} data points
            </div>
          )}
        </div>
    </BaseWidget>
  );
}

// Export the config type for use in other components
export type { Widget };