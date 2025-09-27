"use client";

import React, { useMemo } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { useTableRows } from "@/hooks/useDatabaseTables";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Skeleton } from "@/components/ui/skeleton";

interface KPIWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

export const KPIWidgetRenderer: React.FC<KPIWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false
}) => {
  const config = widget.config as any;
  const settings = config?.settings || {};
  const style = config?.style || {};
  const data = config?.data || {};
  
  const valueField = settings.valueField || 'value';
  const label = settings.label || 'KPI Value';
  const format = settings.format || 'number';
  const aggregation = settings.aggregation || 'sum';
  const selectedAggregations = settings.selectedAggregations || ['sum'];
  const showTrend = settings.showTrend !== false;
  const showComparison = settings.showComparison || false;
  const comparisonField = settings.comparisonField;
  
  const databaseId = data.databaseId;
  const tableId = data.tableId;
  const filters = data.filters || [];
  const refreshSettings = config?.refresh || { enabled: false, interval: 30000 };
  
  // Fetch real data from API
  const validFilters = filters.filter((f: any) => f.column && f.operator && f.value !== undefined);
  const filterString = validFilters.map((f: any) => `${f.column}${f.operator}${f.value}`).join(',');
  
  console.log('🔍 KPIWidgetRenderer - Data construction:', {
    tenantId: widget.tenantId,
    databaseId,
    tableId: Number(tableId),
    filters,
    validFilters,
    filterString,
    valueField,
    aggregation
  });

  const { data: rawData, isLoading, error, refetch } = useTableRows(
    widget.tenantId,
    databaseId || 0,
    Number(tableId) || 0,
    {
      pageSize: 1000,
      filters: filterString
    }
  );

  console.log('📡 KPIWidgetRenderer - API Response:', {
    rawData,
    isLoading,
    error,
    hasData: !!rawData?.data,
    dataLength: rawData?.data?.length || 0
  });

  // Auto-refresh functionality
  useAutoRefresh({
    enabled: refreshSettings.enabled,
    interval: refreshSettings.interval,
    onRefresh: refetch
  });

  // Calculate KPI values based on selected aggregations
  const kpiValues = useMemo(() => {
    if (!rawData?.data || !valueField || !selectedAggregations.length) return {};
    
    const values = rawData.data
      .map((row : any) => {
        // Convert cells array to object for easier access
        const rowData: any = {};
        if (row.cells && Array.isArray(row.cells)) {
          row.cells.forEach((cell: any) => {
            if (cell.column && cell.column.name) {
              rowData[cell.column.name] = cell.value;
            }
          });
        }
        return parseFloat(rowData[valueField]) || 0;
      })
      .filter((val : any) => !isNaN(val));
    
    if (!values.length) return {};
    
    const results: Record<string, number> = {};
    
    selectedAggregations.forEach((agg: 'sum' | 'avg' | 'count' | 'min' | 'max') => {
      switch (agg) {
        case 'sum':
          results.sum = values.reduce((sum : any, val : any) => sum + val, 0);
          break;
        case 'avg':
          results.avg = values.reduce((sum : any, val : any) => sum + val, 0) / values.length;
          break;
        case 'count':
          results.count = values.length;
          break;
        case 'min':
          results.min = Math.min(...values);
          break;
        case 'max':
          results.max = Math.max(...values);
          break;
      }
    });
    
    return results;
  }, [rawData, valueField, selectedAggregations]);

  // Get the primary KPI value (for backward compatibility and trend calculation)
  const kpiValue = useMemo(() => {
    if (selectedAggregations.length === 0) return 0;
    const primaryAgg = selectedAggregations[0];
    return kpiValues[primaryAgg] || 0;
  }, [kpiValues, selectedAggregations]);

  // Calculate comparison value if needed (using primary aggregation)
  const comparisonValue = useMemo(() => {
    if (!showComparison || !comparisonField || !rawData?.data || selectedAggregations.length === 0) return null;
    
    const values = rawData.data
      .map((row : any) => parseFloat(row[comparisonField]) || 0)
      .filter((val : any) => !isNaN(val));
    
    if (!values.length) return null;
    
    const primaryAgg = selectedAggregations[0];
    switch (primaryAgg) {
      case 'sum':
        return values.reduce((sum : any, val : any) => sum + val, 0);
      case 'avg':
        return values.reduce((sum : any, val : any) => sum + val, 0) / values.length;
      case 'count':
        return values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return values.reduce((sum : any, val : any) => sum + val, 0);
    }
  }, [rawData, comparisonField, selectedAggregations, showComparison]);

  // Format value based on format type
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        return `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`;
      default:
        return value.toLocaleString();
    }
  };

  // Calculate trend percentage
  const trendPercentage = useMemo(() => {
    if (!showTrend || !comparisonValue || kpiValue === 0) return null;
    
    const percentage = ((kpiValue - comparisonValue) / comparisonValue) * 100;
    return Math.abs(percentage);
  }, [kpiValue, comparisonValue, showTrend]);

  // Loading state
  if (isLoading) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </BaseWidget>
    );
  }

  // Error state
  if (error) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <div className="text-center text-red-500">
            <p className="text-sm">Error loading KPI data</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          </div>
        </div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div className={`flex h-full flex-col items-center justify-center space-y-4 px-4 py-6 ${
        style.alignment === 'left' ? 'items-start' : 
        style.alignment === 'right' ? 'items-end' : 'items-center'
      }`}>
        {selectedAggregations.length === 1 ? (
          // Single KPI display (original layout)
          <div className="text-center">
            <div 
              className={`font-bold text-foreground ${
                style.size === 'small' ? 'text-2xl' : 
                style.size === 'large' ? 'text-5xl' : 'text-4xl'
              }`}
              style={{ color: style.valueColor }}
            >
              {formatValue(kpiValue)}
            </div>
            <div 
              className="text-sm mt-1"
              style={{ color: style.labelColor }}
            >
              {label}
            </div>
          </div>
        ) : (
          // Multiple KPIs display
          <div className="w-full space-y-3">
            <div 
              className="text-sm text-center"
              style={{ color: style.labelColor }}
            >
              {label}
            </div>
            <div className={`grid gap-3 ${
              selectedAggregations.length <= 2 ? 'grid-cols-1' :
              selectedAggregations.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
            }`}>
              {selectedAggregations.map((agg: 'sum' | 'avg' | 'count' | 'min' | 'max') => (
                <div key={agg} className="text-center p-2 bg-muted/30 rounded-lg">
                  <div 
                    className={`font-bold text-foreground ${
                      style.size === 'small' ? 'text-lg' : 
                      style.size === 'large' ? 'text-2xl' : 'text-xl'
                    }`}
                    style={{ color: style.valueColor }}
                  >
                    {formatValue(kpiValues[agg] || 0)}
                  </div>
                  <div 
                    className="text-xs mt-1 capitalize"
                    style={{ color: style.labelColor }}
                  >
                    {agg === 'avg' ? 'Average' : 
                     agg === 'count' ? 'Count' :
                     agg === 'min' ? 'Minimum' :
                     agg === 'max' ? 'Maximum' :
                     agg === 'sum' ? 'Sum' : agg}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {showTrend && trendPercentage !== null && (
          <div 
            className={`flex items-center space-x-1 text-sm ${
              kpiValue >= (comparisonValue || 0) ? 'text-green-600' : 'text-red-600'
            }`}
            style={{ color: style.trendColor }}
          >
            <span className={kpiValue >= (comparisonValue || 0) ? '↑' : '↓'}></span>
            <span>{trendPercentage.toFixed(1)}%</span>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};
