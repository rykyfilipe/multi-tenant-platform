'use client';

import { useEffect, useState } from 'react';
import type { Widget, LineChartConfig, ChartDataPoint } from './LineChartWidget';
import { 
  mapRawRowsToProcessedData, 
  groupAndAggregate,
  validateChartWidgetConfig,
  type AggregationFunction,
  type ColumnMeta 
} from '@/lib/widget-aggregation';

export interface BaseChartWidgetProps {
	widget: Widget;
	isEditMode?: boolean;
	onEdit?: () => void;
}

export function useChartData(widget: Widget, tenantId?: number, databaseId?: number) {
	// Safely extract config with comprehensive fallbacks
	const config = (widget.config || {}) as LineChartConfig;
	const dataSource = config.dataSource || { type: 'table', tableId: 0 };
	
	// Ensure xAxis and yAxis have proper fallbacks
	const safeXAxis = config.xAxis || { key: 'x', label: 'X Axis', type: 'category' as const };
	const safeYAxis = config.yAxis || { key: 'y', label: 'Y Axis', type: 'number' as const };
	
	const [data, setData] = useState<ChartDataPoint[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

	useEffect(() => {
		let active = true;
		async function load() {
			if (dataSource.type !== 'table') return;
			
			// If no table is selected, show empty data with error message
			if (!dataSource.tableId || dataSource.tableId === 0) {
				if (active) {
					setData([]);
					setError('Please select a table and configure columns in the widget editor');
					setIsLoading(false);
				}
				return;
			}
			
			if (!tenantId || !databaseId) return;
			try {
				setIsLoading(true);
				setError(null);
				const params = new URLSearchParams();
				params.set('page', '1');
				params.set('pageSize', '500');
				params.set('includeCells', 'true');
				// Check both config.filters and dataSource.filters for compatibility
				const filters = (config as any).filters || dataSource.filters || [];
				if (filters && filters.length > 0) {
					params.set('filters', encodeURIComponent(JSON.stringify(filters)));
				}
				const res = await fetch(`/api/tenants/${tenantId}/databases/${databaseId}/tables/${dataSource.tableId}/rows?` + params.toString());
				if (!res.ok) throw new Error('Failed to fetch data');
				const json = await res.json();
				const rows = json?.data || [];
				
				// Use common data mapping utility
				const processedData = mapRawRowsToProcessedData(rows ?? []);
				
				// Support both new and legacy data source formats
				const xKey = (dataSource as any).xAxis?.columns?.[0] || (dataSource as any).columnX || safeXAxis.key;
				const yKeys = (dataSource as any).yAxis?.columns || [(dataSource as any).columnY || safeYAxis.key];
				
				console.log('[BaseChartWidget] Mapping data:', {
					xKey,
					yKeys,
					rowsCount: processedData.length,
					sampleRow: processedData[0],
					dataSource: dataSource
				});
				
				// Check if we need aggregation (when there are multiple rows per X value)
				const xValues = processedData.map(row => row[xKey]);
				const uniqueXValues = [...new Set(xValues)];
				const needsAggregation = uniqueXValues.length < processedData.length;
				
				let mapped: ChartDataPoint[];
				
				if (needsAggregation) {
					// Group by X-axis and aggregate Y-axis values
					const aggregateColumns = yKeys.map((key: string) => ({ column: key, function: 'sum' as AggregationFunction }));
					const grouped = groupAndAggregate(processedData, xKey, aggregateColumns);
					
					mapped = Object.entries(grouped).map(([xValue, yValues]) => {
						const dataPoint: any = { [xKey]: xValue };
						yKeys.forEach((yKey: string) => {
							dataPoint[yKey] = yValues[yKey] || 0;
						});
						return dataPoint;
					});
				} else {
					// Direct mapping without aggregation
					mapped = processedData.map(row => {
						const dataPoint: any = { [xKey]: row[xKey] || '' };
						yKeys.forEach((yKey: string) => {
							dataPoint[yKey] = parseFloat(row[yKey]) || 0;
						});
						return dataPoint;
					});
				}
				
				// Filter out invalid data points
				mapped = mapped.filter((point: any) => {
					// Ensure x value exists and at least one y value is valid
					const xValue = point?.[xKey];
					const hasValidY = yKeys.some((yKey: string) => {
						const yValue = point?.[yKey];
						return yValue !== undefined && yValue !== null && !isNaN(yValue);
					});
					return xValue !== undefined && xValue !== null && xValue !== '' && hasValidY;
				});
				console.log('[BaseChartWidget] Mapped data result:', {
					mappedCount: mapped.length,
					sampleMapped: mapped.slice(0, 2)
				});
				
				if (active) {
					setData(mapped);
					setLastFetchTime(new Date());
				}
			} catch (e) {
				if (active) setError(e instanceof Error ? e.message : 'Failed to load');
			} finally {
				if (active) setIsLoading(false);
			}
		}
		load();
		return () => {
			active = false;
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(config.dataSource), tenantId, databaseId]);

	const handleRefresh = async () => {
		if (dataSource.type !== 'table') return;
		setLastFetchTime(null);
		// trigger by changing dep
		const clone = { ...(config.dataSource || {}) } as any;
		(clone as any).__bump = Date.now();
	};

	return { data, isLoading, error, lastFetchTime, handleRefresh };
}


