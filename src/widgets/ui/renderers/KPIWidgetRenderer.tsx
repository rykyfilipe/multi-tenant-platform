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
  // Support both old (displayField) and new (displayFields) for backward compatibility
  const displayFields = settings.displayFields || 
    (settings.displayField && settings.displayField !== "none" ? [settings.displayField] : []);
  const label = settings.label || 'KPI Value';
  const format = settings.format || 'number';
  const aggregation = settings.aggregation || 'sum';
  const selectedAggregations = settings.selectedAggregations || ['sum'];
  const showTrend = settings.showTrend !== false;
  const showComparison = settings.showComparison || false;
  const comparisonField = settings.comparisonField;
  const showExtremeValueDetails = settings.showExtremeValueDetails || false;
  const extremeValueMode = settings.extremeValueMode || 'max';
  
  console.log('🔍 [KPI] Display settings:', {
    displayFields,
    showExtremeValueDetails,
    extremeValueMode,
    rawDisplayField: settings.displayField,
    rawDisplayFields: settings.displayFields
  });
  
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

  // Helper function to find row with extreme value and extract display columns
  const findExtremeValueRow = useMemo(() => {
    console.log('🔍 [KPI] findExtremeValueRow check:', {
      hasData: !!rawData?.data,
      dataLength: rawData?.data?.length,
      valueField,
      displayFields,
      showExtremeValueDetails,
      selectedAggregations
    });
    
    // Only use extreme value logic for min/max functions
    const shouldUseExtremeValue = showExtremeValueDetails && 
      selectedAggregations.length > 0 && 
      (selectedAggregations.includes('min') || selectedAggregations.includes('max'));
    
    if (!rawData?.data || !valueField || !displayFields || displayFields.length === 0 || !shouldUseExtremeValue) {
      console.log('🔍 [KPI] findExtremeValueRow early return - missing required data or not applicable for current aggregation');
      return null;
    }

    const rowsWithData = rawData.data
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
        return { row, rowData };
      })
      .filter(({ rowData }: { rowData: any }) => !isNaN(parseFloat(rowData[valueField])));

    console.log('🔍 [KPI] Rows with valid data:', rowsWithData.length);

    if (!rowsWithData.length) return null;

    // Determine which extreme value to find based on selected aggregations
    let targetExtremeMode = extremeValueMode;
    if (selectedAggregations.includes('max') && !selectedAggregations.includes('min')) {
      targetExtremeMode = 'max';
    } else if (selectedAggregations.includes('min') && !selectedAggregations.includes('max')) {
      targetExtremeMode = 'min';
    }

    // Find row with extreme value
    const extremeRow = rowsWithData.reduce((extreme : any, current : any) => {
      const currentValue = parseFloat(current.rowData[valueField]);
      const extremeValue = parseFloat(extreme.rowData[valueField]);

      if (targetExtremeMode === 'max') {
        return currentValue > extremeValue ? current : extreme;
      } else {
        return currentValue < extremeValue ? current : extreme;
      }
    });

    // Extract values for selected display fields
    const displayValues: Record<string, any> = {};
    displayFields.forEach((field: string) => {
      displayValues[field] = extremeRow.rowData[field];
    });

    const result = {
      calculationValue: parseFloat(extremeRow.rowData[valueField]),
      displayValues,
      rowData: extremeRow.rowData
    };
    
    console.log('🔍 [KPI] findExtremeValueRow result:', result);
    
    return result;
  }, [rawData, valueField, displayFields, extremeValueMode, selectedAggregations, showExtremeValueDetails]);

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

  // Enhanced KPI value that considers extreme value display
  const enhancedKpiValue = useMemo(() => {
    // Only use extreme value calculation for min/max functions
    if (findExtremeValueRow && selectedAggregations.length > 0 && 
        (selectedAggregations.includes('min') || selectedAggregations.includes('max'))) {
      return findExtremeValueRow.calculationValue;
    }

    if (selectedAggregations.length === 0) return 0;
    const primaryAgg = selectedAggregations[0];
    return kpiValues[primaryAgg] || 0;
  }, [kpiValues, selectedAggregations, findExtremeValueRow]);

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

  // Format display value for non-numeric types
  const formatDisplayValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object' && value instanceof Date) return value.toLocaleDateString();
    return String(value);
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
          // Single KPI display (original layout with enhanced features)
          <div className="text-center">
            <div
              className={`font-bold text-foreground ${
                style.size === 'small' ? 'text-2xl' :
                style.size === 'large' ? 'text-5xl' : 'text-4xl'
              }`}
              style={{ color: style.valueColor }}
            >
              {findExtremeValueRow && displayFields.length > 0 ? (
                // Show display values from extreme value row (only for min/max functions)
                <div className="space-y-1">
                  {Object.entries(findExtremeValueRow.displayValues).map(([field, value]) => (
                    <div key={field} className="flex flex-col">
                      <span className="text-xs opacity-60 font-normal">{field}:</span>
                      <span>{formatDisplayValue(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                formatValue(enhancedKpiValue)
              )}
            </div>
            <div
              className="text-sm mt-1"
              style={{ color: style.labelColor }}
            >
              {findExtremeValueRow ? (
                // Show enhanced label with extreme value context (only for min/max functions)
                `${label} (${selectedAggregations.includes('max') && !selectedAggregations.includes('min') ? 'Highest' : 'Lowest'} ${valueField})`
              ) : (
                label
              )}
            </div>

            {/* Show calculation value if displaying different fields */}
            {findExtremeValueRow && displayFields.length > 0 && (
              <div
                className="text-xs mt-1 opacity-75"
                style={{ color: style.labelColor }}
              >
                Calculated {valueField}: {formatValue(findExtremeValueRow.calculationValue)}
              </div>
            )}

            {/* Show additional row data if enabled */}
            {findExtremeValueRow && displayFields.length === 0 && (
              <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                <div className="font-medium mb-1">
                  {selectedAggregations.includes('max') && !selectedAggregations.includes('min') ? 'Highest' : 'Lowest'} Value Details:
                </div>
                <div className="grid grid-cols-2 gap-1 text-left">
                  {Object.entries(findExtremeValueRow.rowData)
                    .filter(([key]) => !displayFields.includes(key) && key !== valueField)
                    .slice(0, 4) // Show max 4 additional fields
                    .map(([key, value]) => (
                      <div key={key} className="truncate">
                        <span className="font-medium">{key}:</span> {formatDisplayValue(value)}
                      </div>
                    ))}
                </div>
              </div>
            )}
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
