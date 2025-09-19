'use client';

import { useMemo } from 'react';
import { WidgetDataProvider } from './WidgetDataProvider';
import { WidgetDataMapperFactory } from './data-mappers/WidgetDataMappers';
import type { Widget, LineChartConfig, ChartDataPoint } from './LineChartWidget';

export interface BaseChartWidgetProps {
	widget: Widget;
	isEditMode?: boolean;
	onEdit?: () => void;
}

export function useChartData(widget: Widget, tenantId?: number, databaseId?: number) {
	// This hook is now deprecated in favor of WidgetDataProvider
	// Keep for backward compatibility but recommend using WidgetDataProvider
	console.warn('useChartData is deprecated. Use WidgetDataProvider instead.');
	
	return {
		data: [],
		isLoading: false,
		error: 'useChartData is deprecated. Use WidgetDataProvider instead.',
		lastFetchTime: null,
		handleRefresh: () => {}
	};
}

// New hook that uses WidgetDataProvider
export function useChartDataWithProvider(widget: Widget) {
	const config = (widget.config || {}) as LineChartConfig;
	
	// Use WidgetDataMapperFactory to get mapped data
	const mappedData = useMemo(() => {
		// This will be called by WidgetDataProvider
		return WidgetDataMapperFactory.mapData(widget, []);
	}, [widget]);

	return {
		config,
		mappedData
	};
}


