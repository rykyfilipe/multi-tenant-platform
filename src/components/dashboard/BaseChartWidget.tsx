'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Widget, LineChartConfig, ChartDataPoint } from './LineChartWidget';

export interface BaseChartWidgetProps {
	widget: Widget;
	isEditMode?: boolean;
	onEdit?: () => void;
}

export function useChartData(widget: Widget, tenantId?: number, databaseId?: number) {
	const config = (widget.config || {}) as LineChartConfig;
	const dataSource = config.dataSource || { type: 'manual', manualData: [] };
	const [data, setData] = useState<ChartDataPoint[]>(dataSource.type === 'manual' ? (dataSource.manualData || []) : []);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

	useEffect(() => {
		let active = true;
		async function load() {
			if (dataSource.type !== 'table' || !dataSource.tableId || !tenantId || !databaseId) return;
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
				const rows = json?.rows || json?.data || [];
				const mapped: ChartDataPoint[] = rows.map((row: any) => ({
					[dataSource.columnX || config.xAxis?.key || 'x']: row[dataSource.columnX || config.xAxis?.key || 'x'],
					[dataSource.columnY || config.yAxis?.key || 'y']: row[dataSource.columnY || config.yAxis?.key || 'y'],
				}));
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


