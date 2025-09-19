'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Widget, LineChartConfig, ChartDataPoint } from './LineChartWidget';

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
				if (dataSource.filters && dataSource.filters.length > 0) {
					params.set('filters', encodeURIComponent(JSON.stringify(dataSource.filters)));
				}
				const res = await fetch(`/api/tenants/${tenantId}/databases/${databaseId}/tables/${dataSource.tableId}/rows?` + params.toString());
				if (!res.ok) throw new Error('Failed to fetch data');
				const json = await res.json();
				const rows = json?.data || [];
				
				// Transform rows with cells to chart data
				// Support both new and legacy data source formats
				const xKey = (dataSource as any).xAxis?.columns?.[0] || (dataSource as any).columnX || safeXAxis.key;
				const yKey = (dataSource as any).yAxis?.columns?.[0] || (dataSource as any).columnY || safeYAxis.key;
				
				const mapped: ChartDataPoint[] = (rows ?? []).map((row: any) => {
					const dataPoint: any = {};
					if (row?.cells && Array.isArray(row.cells)) {
						// Find X and Y column values from cells
						const xCell = row.cells.find((cell: any) => cell?.column?.name === xKey);
						const yCell = row.cells.find((cell: any) => cell?.column?.name === yKey);
						
						// Safely assign values with fallbacks
						dataPoint[xKey] = xCell?.value || '';
						dataPoint[yKey] = parseFloat(yCell?.value) || 0;
					}
					return dataPoint;
				}).filter((point: any) => {
					// Ensure both x and y values exist and are valid
					const xValue = point?.[xKey];
					const yValue = point?.[yKey];
					return xValue !== undefined && xValue !== null && xValue !== '' && 
						   yValue !== undefined && yValue !== null && !isNaN(yValue);
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


