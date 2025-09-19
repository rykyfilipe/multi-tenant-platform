/**
 * Widget Data Provider
 * Provides data to widget components with loading and error states
 */

import React from 'react';
import { BaseWidget, WidgetDataHookReturn } from '@/types/widgets';
import { useWidgetData } from '@/hooks/useWidgetData';

interface WidgetDataProviderProps {
  widget: BaseWidget;
  children: (data: WidgetDataHookReturn) => React.ReactNode;
}

export function WidgetDataProvider({ widget, children }: WidgetDataProviderProps) {
  const widgetData = useWidgetData(widget);
  return <>{children(widgetData)}</>;
}

/**
 * Widget Data Provider with caching
 */
interface WidgetDataProviderWithCacheProps extends WidgetDataProviderProps {
  cacheKey?: string;
  cacheTime?: number;
}

export function WidgetDataProviderWithCache({ 
  widget, 
  children, 
  cacheKey, 
  cacheTime = 300000 // 5 minutes default
}: WidgetDataProviderWithCacheProps) {
  const widgetData = useWidgetData(widget);
  
  // In a real implementation, this would integrate with a caching solution
  // For now, we'll use the basic provider
  return <>{children(widgetData)}</>;
}

/**
 * Widget Data Provider with real-time updates
 */
interface WidgetDataProviderRealtimeProps extends WidgetDataProviderProps {
  refreshInterval?: number;
}

export function WidgetDataProviderRealtime({ 
  widget, 
  children, 
  refreshInterval = 30000 // 30 seconds default
}: WidgetDataProviderRealtimeProps) {
  const widgetData = useWidgetData(widget);
  
  // In a real implementation, this would set up real-time updates
  // For now, we'll use the basic provider
  return <>{children(widgetData)}</>;
}

export default WidgetDataProvider;
