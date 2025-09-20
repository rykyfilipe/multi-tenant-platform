'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from 'recharts';
import BaseWidget from './BaseWidget';
import type { Widget, LineChartConfig } from './LineChartWidget';
import type { EnhancedDataSource, ChartAxisConfig } from './EnhancedTableSelector';
import { useChartData } from './BaseChartWidget';
import { generateChartColors, type ColorPalette } from '@/lib/chart-colors';

// PieChart configuration interface (extends LineChartConfig)
export interface PieChartConfig extends LineChartConfig {
  options?: LineChartConfig['options'] & {
    innerRadius?: number;
    outerRadius?: number;
    showPercentage?: boolean;
    showValue?: boolean;
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
		const rawData = Array.isArray(data) ? data : [];
		
		// For pie charts, we typically use single columns for name and value
		// But we can support multiple value columns by creating separate pie charts
		// For now, we'll use the first selected column for each axis
		const xColumn = enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key;
		const yColumn = enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key;
		
		console.log('[PieChart] Processing data:', {
			rawDataCount: rawData.length,
			xColumn,
			yColumn,
			sampleData: rawData.slice(0, 2)
		});
		
		// Validate and clean data to prevent property errors
		const filteredData = rawData.filter(item => {
			if (!item || typeof item !== 'object') return false;
			
			const nameValue = item?.[xColumn];
			const valueValue = item?.[yColumn];
			
			return nameValue !== undefined && nameValue !== null && nameValue !== '' &&
				   valueValue !== undefined && valueValue !== null && !isNaN(Number(valueValue));
		}).map(item => ({
			[xColumn]: item[xColumn],
			[yColumn]: item[yColumn]
		}));

		// Apply aggregation if specified
		const xAggregation = enhancedDataSource.xAxis?.aggregation;
		const yAggregation = enhancedDataSource.yAxis?.aggregation;
		
		if (xAggregation && xAggregation !== 'none') {
			console.log('[PieChart] Applying X-axis aggregation:', xAggregation);
			return applyAggregation(filteredData, xColumn, xAggregation);
		} else if (yAggregation && yAggregation !== 'none') {
			console.log('[PieChart] Applying Y-axis aggregation:', yAggregation);
			return applyAggregation(filteredData, yColumn, yAggregation);
		}
		
		return filteredData;
	}, [dataSource, data, safeXAxis.key, safeYAxis.key, enhancedDataSource.xAxis, enhancedDataSource.yAxis]);

	// Generate automatic colors for PieChart (too many categories for manual selection)
	const colors = useMemo(() => {
		// PieChart always uses auto-generated colors due to potentially many categories
		if (options.colors && Array.isArray(options.colors) && options.colors.length > 0) {
			return options.colors;
		}
		
		// Generate automatic colors based on data length
		const colorPalette = (options.colorPalette as ColorPalette) || 'business';
		const generatedColors = generateChartColors(processedData.length, colorPalette);
		console.log('[PieChart] Generated colors:', {
			dataLength: processedData.length,
			colors: generatedColors,
			colorPalette
		});
		return generatedColors;
	}, [options?.colors, options?.colorPalette, processedData.length]);

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
							<Pie 
								data={processedData} 
								dataKey={enhancedDataSource.yAxis?.columns?.[0] || safeYAxis.key} 
								nameKey={enhancedDataSource.xAxis?.columns?.[0] || safeXAxis.key} 
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
							Select a table and columns to load data
						</p>
					</div>
				</div>
			)}
		</BaseWidget>
	);
}


