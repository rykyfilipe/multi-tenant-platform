/**
 * Widget Data Management Hook
 * Centralized data fetching and management for widgets
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { api } from '@/lib/api-client';
import { BaseWidget, WidgetDataHookReturn, DataSource } from '@/types/widgets';
import { WidgetDataMapperFactory } from '@/components/dashboard/data-mappers/WidgetDataMappers';

export function useWidgetData(widget: BaseWidget): WidgetDataHookReturn {
  const { tenant } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize data source configuration
  const dataSource = useMemo(() => {
    return widget.config?.dataSource as DataSource;
  }, [widget.config?.dataSource]);

  // Check if widget needs data fetching
  const needsDataFetching = useMemo(() => {
    if (!dataSource) return false;
    if (dataSource.type === 'manual') return false;
    if (dataSource.type === 'table' && !dataSource.tableId) return false;
    return true;
  }, [dataSource]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!needsDataFetching || !tenant?.id) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response;

      if (dataSource.type === 'table' && dataSource.tableId) {
        // Fetch table data
        response = await api.tables.rows(tenant.id, 1, dataSource.tableId, {
          limit: 1000
        });
      } else {
        // Handle other data source types
        // For now, return empty data for non-table widgets
        response = { data: [] };
      }

      const rawData = response.data || [];
      
      // Map data using the appropriate mapper for the widget type
      const mappedData = WidgetDataMapperFactory.mapData(widget, rawData);
      setData(mappedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      setData([]);
      console.error(`[useWidgetData] Error fetching data for widget ${widget.id}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [needsDataFetching, tenant?.id, dataSource, widget.id, widget.config]);

  // Auto-fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook for widget data with caching
 */
export function useWidgetDataWithCache(widget: BaseWidget, cacheKey?: string): WidgetDataHookReturn {
  const cacheKeyValue = cacheKey || `widget-${widget.id}-${JSON.stringify(widget.config)}`;
  
  // This would integrate with a caching solution like React Query or SWR
  // For now, we'll use the basic hook
  return useWidgetData(widget);
}

/**
 * Hook for multiple widgets data
 */
export function useMultipleWidgetsData(widgets: BaseWidget[]): Record<string, WidgetDataHookReturn> {
  const results: Record<string, WidgetDataHookReturn> = {};

  widgets.forEach(widget => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[widget.id.toString()] = useWidgetData(widget);
  });

  return results;
}

/**
 * Hook for widget data with real-time updates
 */
export function useWidgetDataRealtime(
  widget: BaseWidget, 
  refreshInterval: number = 30000
): WidgetDataHookReturn {
  const dataHook = useWidgetData(widget);

  useEffect(() => {
    if (!dataHook.isLoading && refreshInterval > 0) {
      const interval = setInterval(() => {
        dataHook.refetch();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [dataHook.isLoading, dataHook.refetch, refreshInterval]);

  return dataHook;
}

/**
 * Hook for widget data with error retry
 */
export function useWidgetDataWithRetry(
  widget: BaseWidget,
  maxRetries: number = 3,
  retryDelay: number = 1000
): WidgetDataHookReturn {
  const [retryCount, setRetryCount] = useState(0);
  const dataHook = useWidgetData(widget);

  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        dataHook.refetch();
      }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
    }
  }, [retryCount, maxRetries, retryDelay, dataHook]);

  // Auto-retry on error
  useEffect(() => {
    if (dataHook.error && retryCount < maxRetries) {
      retry();
    }
  }, [dataHook.error, retryCount, maxRetries, retry]);

  return {
    ...dataHook,
    refetch: () => {
      setRetryCount(0);
      dataHook.refetch();
    }
  };
}

export default useWidgetData;
