"use client";

import React, { useMemo } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { useTableRows } from "@/hooks/useDatabaseTables";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { WidgetLoadingState, WidgetErrorState, WidgetEmptyState } from "../components/WidgetStates";
import { PremiumWidgetContainer, PremiumHeading, PremiumText } from "../components/PremiumWidgetContainer";
import { getPremiumTheme } from "@/widgets/styles/premiumThemes";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

// ============================================================================
// DATA PROCESSING PIPELINE FOR KPI - TYPES & INTERFACES
// ============================================================================

/**
 * Normalized row format after initial data extraction
 */
interface NormalizedRow {
  [columnName: string]: any;
}

/**
 * KPI calculation result for a single aggregation
 */
interface KPIResult {
  aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max';
  value: number;
  label: string;
  metadata?: {
    sourceRow?: NormalizedRow; // For min/max: the actual row with extreme value
    displayFields?: Record<string, any>; // Additional fields to display
    count?: number; // Number of rows used in calculation
  };
}

/**
 * Grouped KPI results (when grouping is enabled)
 */
interface GroupedKPIResult {
  groupKey: string; // Group identifier (e.g., "North America", "Q1 2024")
  results: KPIResult[]; // Multiple aggregations per group
}

/**
 * KPI pipeline configuration
 */
interface KPIPipelineConfig {
  // Data source
  valueColumn: string;
  displayColumns?: string[];
  
  // Aggregations (can select multiple)
  aggregations: Array<'sum' | 'avg' | 'count' | 'min' | 'max'>;
  
  // Comparison
  enableComparison: boolean;
  comparisonColumn?: string;
  comparisonAggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  
  // Formatting
  format: 'number' | 'currency' | 'percentage' | 'duration';
  
  // Display options
  showExtremeValueDetails: boolean;
  extremeValueMode: 'max' | 'min';
}

// ============================================================================
// STEP 1: SELECT DATASET - Normalize raw API data
// ============================================================================

/**
 * Converts raw API response to normalized row objects
 */
function selectDataset(rawData: any[]): NormalizedRow[] {
  console.log('📋 [KPI STEP 1: SELECT] Normalizing raw data...');
  
  if (!rawData || !Array.isArray(rawData)) {
    console.warn('⚠️ [KPI STEP 1: SELECT] No valid data provided');
    return [];
  }

  const normalized = rawData.map((row) => {
    const normalizedRow: NormalizedRow = {};

    if (row.cells && Array.isArray(row.cells)) {
      row.cells.forEach((cell: any) => {
        if (cell.column && cell.column.name) {
          normalizedRow[cell.column.name] = cell.value;
        }
      });
    }

    return normalizedRow;
  });

  console.log(`✅ [KPI STEP 1: SELECT] Normalized ${normalized.length} rows`);
  return normalized;
}

// ============================================================================
// STEP 2: WHERE FILTERS - Applied at API level (already done)
// ============================================================================

// WHERE filters are applied at the API level via the useTableRows hook

// ============================================================================
// STEP 3: EXTRACT NUMERIC VALUES - Helper function
// ============================================================================

/**
 * Extracts numeric values from a column across multiple rows
 */
function extractNumericValues(rows: NormalizedRow[], columnName: string): number[] {
  return rows
    .map(row => {
      const value = row[columnName];
      if (value === null || value === undefined) return null;
      const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
      return isNaN(numericValue) ? null : numericValue;
    })
    .filter((val): val is number => val !== null);
}

// ============================================================================
// STEP 4: AGGREGATION FUNCTIONS - Pure functions for each type
// ============================================================================

/**
 * Calculate SUM aggregation
 */
function calculateSum(rows: NormalizedRow[], columnName: string): KPIResult {
  const values = extractNumericValues(rows, columnName);
  const sum = values.reduce((acc, val) => acc + val, 0);
  
  return {
    aggregationType: 'sum',
    value: sum,
    label: 'Sum',
    metadata: { count: values.length }
  };
}

/**
 * Calculate AVG aggregation
 */
function calculateAverage(rows: NormalizedRow[], columnName: string): KPIResult {
  const values = extractNumericValues(rows, columnName);
  const avg = values.length > 0 ? values.reduce((acc, val) => acc + val, 0) / values.length : 0;
  
  return {
    aggregationType: 'avg',
    value: avg,
    label: 'Average',
    metadata: { count: values.length }
  };
}

/**
 * Calculate COUNT aggregation
 */
function calculateCount(rows: NormalizedRow[], columnName: string): KPIResult {
  const values = extractNumericValues(rows, columnName);
  
  return {
    aggregationType: 'count',
    value: values.length,
    label: 'Count',
    metadata: { count: values.length }
  };
}

/**
 * Calculate MIN aggregation with source row
 */
function calculateMin(
  rows: NormalizedRow[], 
  columnName: string,
  displayColumns?: string[]
): KPIResult {
  const values = extractNumericValues(rows, columnName);
  
  if (values.length === 0) {
    return {
      aggregationType: 'min',
      value: 0,
      label: 'Minimum'
    };
  }
  
  const minValue = Math.min(...values);
  
  // Find the source row with minimum value
  const sourceRow = rows.find(row => {
    const value = row[columnName];
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
    return numericValue === minValue;
  });
  
  // Extract display fields if specified
  let displayFields: Record<string, any> | undefined;
  if (sourceRow && displayColumns && displayColumns.length > 0) {
    displayFields = {};
    displayColumns.forEach(col => {
      displayFields![col] = sourceRow[col];
    });
  }
  
  return {
    aggregationType: 'min',
    value: minValue,
    label: 'Minimum',
    metadata: {
      sourceRow,
      displayFields,
      count: values.length
    }
  };
}

/**
 * Calculate MAX aggregation with source row
 */
function calculateMax(
  rows: NormalizedRow[], 
  columnName: string,
  displayColumns?: string[]
): KPIResult {
  const values = extractNumericValues(rows, columnName);
  
  if (values.length === 0) {
    return {
      aggregationType: 'max',
      value: 0,
      label: 'Maximum'
    };
  }
  
  const maxValue = Math.max(...values);
  
  // Find the source row with maximum value
  const sourceRow = rows.find(row => {
    const value = row[columnName];
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
    return numericValue === maxValue;
  });
  
  // Extract display fields if specified
  let displayFields: Record<string, any> | undefined;
  if (sourceRow && displayColumns && displayColumns.length > 0) {
    displayFields = {};
    displayColumns.forEach(col => {
      displayFields![col] = sourceRow[col];
    });
  }
  
  return {
    aggregationType: 'max',
    value: maxValue,
    label: 'Maximum',
    metadata: {
      sourceRow,
      displayFields,
      count: values.length
    }
  };
}

// ============================================================================
// STEP 5: CALCULATE KPI - Main aggregation function
// ============================================================================

/**
 * Calculate KPI values for given aggregation types
 */
function calculateKPIValues(
  rows: NormalizedRow[],
  config: KPIPipelineConfig
): KPIResult[] {
  console.log(`📊 [KPI STEP 5: AGGREGATE] Calculating ${config.aggregations.length} KPI(s)...`);
  
  if (!rows.length || !config.valueColumn) {
    console.warn('⚠️ [KPI STEP 5: AGGREGATE] No data or value column specified');
    return [];
  }
  
  const results: KPIResult[] = [];
  
  config.aggregations.forEach(aggType => {
    let result: KPIResult;
    
    switch (aggType) {
      case 'sum':
        result = calculateSum(rows, config.valueColumn);
        break;
      case 'avg':
        result = calculateAverage(rows, config.valueColumn);
        break;
      case 'count':
        result = calculateCount(rows, config.valueColumn);
        break;
      case 'min':
        result = calculateMin(rows, config.valueColumn, config.displayColumns);
        break;
      case 'max':
        result = calculateMax(rows, config.valueColumn, config.displayColumns);
        break;
    }
    
    results.push(result);
    console.log(`  📈 ${result.label}: ${result.value} (${result.metadata?.count || 0} rows)`);
  });
  
  console.log(`✅ [KPI STEP 5: AGGREGATE] Calculated ${results.length} KPI values`);
  return results;
}

// ============================================================================
// STEP 6: COMPARISON - Calculate comparison metrics
// ============================================================================

/**
 * Calculate comparison KPI (for trend analysis)
 */
function calculateComparison(
  rows: NormalizedRow[],
  config: KPIPipelineConfig
): KPIResult | null {
  if (!config.enableComparison || !config.comparisonColumn) {
    console.log('⏭️ [KPI STEP 6: COMPARISON] Comparison disabled or no column specified');
    return null;
  }
  
  console.log(`📊 [KPI STEP 6: COMPARISON] Calculating comparison metric...`);
  
  // Use the same aggregation type as the first primary KPI
  const aggType = config.comparisonAggregation || config.aggregations[0];
  
  const values = extractNumericValues(rows, config.comparisonColumn);
  
  if (!values.length) {
    console.warn('⚠️ [KPI STEP 6: COMPARISON] No valid values found');
    return null;
  }
  
  let value: number;
  switch (aggType) {
    case 'sum':
      value = values.reduce((acc, val) => acc + val, 0);
      break;
    case 'avg':
      value = values.reduce((acc, val) => acc + val, 0) / values.length;
      break;
    case 'count':
      value = values.length;
      break;
    case 'min':
      value = Math.min(...values);
      break;
    case 'max':
      value = Math.max(...values);
      break;
    default:
      value = values.reduce((acc, val) => acc + val, 0);
  }
  
  console.log(`✅ [KPI STEP 6: COMPARISON] Comparison value: ${value} (${aggType} of ${values.length} values)`);
  
  return {
    aggregationType: aggType,
    value,
    label: 'Previous',
    metadata: { count: values.length }
  };
}

// ============================================================================
// PIPELINE ORCHESTRATOR
// ============================================================================

/**
 * Execute the complete KPI data processing pipeline
 */
function executeKPIPipeline(
  rawData: any[],
  config: KPIPipelineConfig
): { 
  results: KPIResult[]; 
  comparison?: KPIResult | null;
} {
  console.log('🚀 [KPI PIPELINE START] =====================================');
  console.log('Configuration:', {
    valueColumn: config.valueColumn,
    aggregations: config.aggregations,
    comparison: config.enableComparison
  });
  
  // STEP 1: SELECT - Normalize raw data
  const normalizedData = selectDataset(rawData);
  if (!normalizedData.length) {
    console.log('❌ [KPI PIPELINE END] No data after normalization');
    return { results: [] };
  }
  
  // STEP 2: WHERE - Already applied at API level
  console.log('✅ [KPI STEP 2: WHERE] Filters applied at API level');
  
  // STEP 3-5: AGGREGATE - Calculate KPI values
  const results = calculateKPIValues(normalizedData, config);
  
  // STEP 6: COMPARISON
  const comparison = calculateComparison(normalizedData, config);
  
  console.log('✅ [KPI PIPELINE END] =====================================');
  console.log('Results:', {
    kpiCount: results.length,
    hasComparison: !!comparison,
    comparisonValue: comparison?.value
  });
  
  return { results, comparison };
}

// ============================================================================
// VALUE FORMATTING - Helper functions
// ============================================================================

/**
 * Format value based on format type
 */
function formatValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'duration':
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      const seconds = Math.floor(value % 60);
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
    case 'number':
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

/**
 * Format display value for non-numeric types
 */
function formatDisplayValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object' && value instanceof Date) {
    return value.toLocaleDateString();
  }
  return String(value);
}

/**
 * Calculate trend percentage
 */
function calculateTrendPercentage(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const KPIWidgetRenderer: React.FC<KPIWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false
}) => {
  // Extract configuration
  const config = widget.config as any;
  const settings = config?.settings || {};
  const style = config?.style || {};
  const data = config?.data || {};
  
  const refreshSettings = config?.refresh || { enabled: false, interval: 30000 };
  
  // Fetch data from API (WHERE filters applied here)
  const validFilters = (data.filters || []).filter((f: any) => 
    f.column && f.operator && f.value !== undefined
  );
  const filterString = validFilters.map((f: any) => 
    `${f.column}${f.operator}${f.value}`
  ).join(',');
  
  const { data: rawData, isLoading, error, refetch } = useTableRows(
    widget.tenantId,
    data.databaseId || 0,
    Number(data.tableId) || 0,
    {
      pageSize: 1000,
      filters: filterString
    }
  );
  
  // Auto-refresh
  useAutoRefresh({
    enabled: refreshSettings.enabled,
    interval: refreshSettings.interval,
    onRefresh: refetch
  });
  
  // Process data through the pipeline
  const { results, comparison } = useMemo(() => {
    if (!rawData?.data?.length || !settings.valueField) {
      return { results: [], comparison: undefined };
    }
    
    const pipelineConfig: KPIPipelineConfig = {
      valueColumn: settings.valueField,
      displayColumns: settings.displayFields || [],
      aggregations: settings.selectedAggregations || ['sum'],
      enableComparison: settings.showComparison || false,
      comparisonColumn: settings.comparisonField,
      comparisonAggregation: settings.selectedAggregations?.[0] || 'sum',
      format: settings.format || 'number',
      showExtremeValueDetails: settings.showExtremeValueDetails || false,
      extremeValueMode: settings.extremeValueMode || 'max'
    };
    
    return executeKPIPipeline(rawData.data, pipelineConfig);
  }, [rawData, settings]);
  
  // Calculate trend if comparison is available
  const trendData = useMemo(() => {
    if (!comparison || !results.length) {
      console.log('⏭️ No trend data: comparison or results missing');
      return null;
    }
    
    const primaryValue = results[0].value;
    const comparisonValue = comparison.value;
    
    console.log('📊 Trend calculation:', {
      primaryValue,
      comparisonValue,
      aggregationType: results[0].aggregationType
    });
    
    const percentage = calculateTrendPercentage(primaryValue, comparisonValue);
    const isPositive = primaryValue >= comparisonValue;
    
    console.log(`✅ Trend: ${isPositive ? '+' : ''}${percentage.toFixed(1)}%`);
    
    return { 
      percentage: Math.abs(percentage), 
      isPositive,
      currentValue: primaryValue,
      previousValue: comparisonValue
    };
  }, [results, comparison]);
  
  // Loading state
  if (isLoading) {
    return <WidgetLoadingState 
      widget={widget} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
      variant="kpi"
    />;
  }
  
  // Error state
  if (error) {
    return <WidgetErrorState 
      widget={widget} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
      error={error}
      title="Error loading KPI data"
    />;
  }
  
  // No data state
  if (!results.length) {
    return <WidgetEmptyState 
      widget={widget} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
      title="No data available"
      message="Configure data source and value column"
    />;
  }
  
  const alignment = style.alignment || 'center';
  const size = style.size || 'medium';
  const format = settings.format || 'number';
  const theme = getPremiumTheme(style.theme || 'platinum');
  
  // Font size mapping for values
  const valueFontSizeMap = {
    xl: 'text-4xl',
    '2xl': 'text-5xl',
    '3xl': 'text-6xl',
    '4xl': 'text-7xl',
    '5xl': 'text-8xl',
    '6xl': 'text-9xl',
  };
  
  const valueFontSize = style.valueFontSize || '4xl';
  const valueFontWeight = style.valueFontWeight || 'bold';
  const letterSpacing = style.letterSpacing || 'normal';
  
  const fontWeightMap = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };
  
  const letterSpacingMap = {
    tighter: 'tracking-tighter',
    tight: 'tracking-tight',
    normal: 'tracking-normal',
    wide: 'tracking-wide',
    wider: 'tracking-wider',
  };
  
  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <PremiumWidgetContainer style={style} className={cn(
        'flex h-full flex-col space-y-6',
        alignment === 'left' ? 'items-start' : 
        alignment === 'right' ? 'items-end' : 'items-center'
      )}>
        {results.length === 1 ? (
          // Single KPI Display - Premium Design
          <div className="flex flex-col items-center space-y-3 text-center">
            <div
              className={cn(
                valueFontSizeMap[valueFontSize as keyof typeof valueFontSizeMap],
                fontWeightMap[valueFontWeight as keyof typeof fontWeightMap],
                letterSpacingMap[letterSpacing as keyof typeof letterSpacingMap],
                'tabular-nums'
              )}
              style={{ 
                color: style.valueColor || theme.colors.foreground,
                fontFamily: style.fontFamily || theme.typography.fontFamily,
                textShadow: style.glow ? `0 0 30px ${style.valueColor || theme.colors.foreground}40` : 'none'
              }}
            >
              {/* Show display fields for min/max with extreme value details */}
              {settings.showExtremeValueDetails && 
               (results[0].aggregationType === 'min' || results[0].aggregationType === 'max') &&
               results[0].metadata?.displayFields ? (
                <div className="space-y-2">
                  {Object.entries(results[0].metadata.displayFields).map(([field, value]) => (
                    <div key={field} className="flex flex-col">
                      <span className="text-sm opacity-60 font-normal tracking-wide uppercase mb-1">
                        {field}
                      </span>
                      <span>{formatDisplayValue(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                formatValue(results[0].value, format)
              )}
            </div>
            
            <div 
              className="text-sm font-medium uppercase tracking-wider"
              style={{ 
                color: style.labelColor || theme.colors.mutedForeground,
                fontFamily: style.fontFamily || theme.typography.fontFamily
              }}
            >
              {settings.label || results[0].label}
            </div>
            
            {/* Show calculation value if displaying different fields */}
            {settings.showExtremeValueDetails && 
             results[0].metadata?.displayFields &&
             Object.keys(results[0].metadata.displayFields).length > 0 && (
              <div 
                className="text-xs opacity-75 font-medium"
                style={{ color: style.labelColor || theme.colors.mutedForeground }}
              >
                {settings.valueField}: {formatValue(results[0].value, format)}
              </div>
            )}
            
            {/* Trend indicator - Premium Design */}
            {trendData && (
              <div 
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                  style.glassEffect && "backdrop-blur-md bg-white/10"
                )}
                style={{ 
                  color: trendData.isPositive 
                    ? (style.trendColor || '#16a34a')
                    : '#dc2626',
                  backgroundColor: trendData.isPositive
                    ? `${style.trendColor || '#16a34a'}10`
                    : '#dc262610',
                  border: `1px solid ${trendData.isPositive ? (style.trendColor || '#16a34a')  : '#dc2626'}20`
                }}
              >
                {trendData.isPositive ? (
                  <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
                ) : trendData.percentage === 0 ? (
                  <Minus className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <TrendingDown className="h-5 w-5" strokeWidth={2.5} />
                )}
                <div className="flex flex-col items-start">
                  <span className="font-bold text-lg tabular-nums">
                    {trendData.isPositive ? '+' : '−'}{Math.abs(trendData.percentage).toFixed(1)}%
                  </span>
                  <span className="text-xs opacity-75">
                    vs {formatValue(trendData.previousValue, format)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Multiple KPIs Display - Premium Grid
          <div className="w-full space-y-4">
            <div 
              className="text-sm font-medium uppercase tracking-wider text-center"
              style={{ 
                color: style.labelColor || theme.colors.mutedForeground,
                fontFamily: style.fontFamily || theme.typography.fontFamily
              }}
            >
              {settings.label || 'KPI Metrics'}
            </div>
            <div className={cn(
              'grid gap-4',
              results.length <= 2 ? 'grid-cols-1' :
              results.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
            )}>
              {results.map((result) => (
                <div 
                  key={result.aggregationType} 
                  className={cn(
                    "text-center p-4 rounded-xl transition-all border",
                    style.glassEffect && "backdrop-blur-sm bg-white/5"
                  )}
                  style={{
                    backgroundColor: style.glassEffect ? undefined : theme.colors.muted,
                    borderColor: theme.colors.border,
                    boxShadow: theme.shadows.subtle
                  }}
                >
                  <div 
                    className={cn(
                      'font-bold tabular-nums',
                      size === 'small' ? 'text-xl' : 
                      size === 'large' ? 'text-3xl' : 
                      size === 'xl' ? 'text-4xl' : 'text-2xl'
                    )}
                    style={{ 
                      color: style.valueColor || theme.colors.foreground,
                      fontFamily: style.fontFamily || theme.typography.fontFamily,
                      textShadow: style.glow ? `0 0 20px ${style.valueColor || theme.colors.foreground}30` : 'none'
                    }}
                  >
                    {formatValue(result.value, format)}
                  </div>
                  <div 
                    className="text-xs mt-2 font-medium uppercase tracking-wide"
                    style={{ color: style.labelColor || theme.colors.mutedForeground }}
                  >
                    {result.label}
                  </div>
                  {result.metadata?.count !== undefined && (
                    <div 
                      className="text-xs mt-1 opacity-60"
                      style={{ color: style.labelColor || theme.colors.mutedForeground }}
                    >
                      {result.metadata.count} rows
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </PremiumWidgetContainer>
    </BaseWidget>
  );
};
