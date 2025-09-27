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
  isDraft?: boolean;
  onApplyDraft?: () => void;
  onDeleteDraft?: () => void;
}

export const KPIWidgetRenderer: React.FC<KPIWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false,
  isDraft = false,
  onApplyDraft,
  onDeleteDraft
}) => {
  const config = widget.config as any;
  const settings = config?.settings || {};
  const style = config?.style || {};
  const data = config?.data || {};
  
  const valueField = settings.valueField || 'value';
  const label = settings.label || 'KPI Value';
  const format = settings.format || 'number';
  const aggregation = settings.aggregation || 'sum';
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

  // Auto-refresh functionality
  useAutoRefresh({
    enabled: refreshSettings.enabled,
    interval: refreshSettings.interval,
    onRefresh: refetch
  });

  // Calculate KPI value based on aggregation
  const kpiValue = useMemo(() => {
    if (!rawData?.data || !valueField) return 0;
    
    const values = rawData.data
      .map((row : any) => parseFloat(row[valueField]) || 0)
      .filter((val : any) => !isNaN(val));
    
    if (!values.length) return 0;
    
    switch (aggregation) {
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
  }, [rawData, valueField, aggregation]);

  // Calculate comparison value if needed
  const comparisonValue = useMemo(() => {
    if (!showComparison || !comparisonField || !rawData?.data) return null;
    
    const values = rawData.data
      .map((row : any) => parseFloat(row[comparisonField]) || 0)
      .filter((val : any) => !isNaN(val));
    
    if (!values.length) return null;
    
    switch (aggregation) {
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
  }, [rawData, comparisonField, aggregation, showComparison]);

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
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode} isDraft={isDraft} onApplyDraft={onApplyDraft} onDeleteDraft={onDeleteDraft}>
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
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode} isDraft={isDraft} onApplyDraft={onApplyDraft} onDeleteDraft={onDeleteDraft}>
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
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode} isDraft={isDraft} onApplyDraft={onApplyDraft} onDeleteDraft={onDeleteDraft}>
      <div className={`flex h-full flex-col items-center justify-center space-y-4 px-4 py-6 ${
        style.alignment === 'left' ? 'items-start' : 
        style.alignment === 'right' ? 'items-end' : 'items-center'
      }`}>
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
