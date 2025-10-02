"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { useTableRows } from "@/hooks/useDatabaseTables";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { WidgetLoadingState, WidgetErrorState, WidgetEmptyState } from "../components/WidgetStates";
import { getPremiumTheme, premiumDataColors } from "@/widgets/styles/premiumThemes";
import { PremiumWidgetContainer } from "../components/PremiumWidgetContainer";
import { cn } from "@/lib/utils";

interface ChartWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

// ============================================================================
// DATA PROCESSING PIPELINE - TYPES & INTERFACES
// ============================================================================

/**
 * Normalized row format after initial data extraction
 * Contains all columns from the source table in key-value format
 */
interface NormalizedRow {
  [columnName: string]: any;
}

/**
 * Grouped data structure
 * Key: group value (e.g., "USA", "2024-01", "Product A")
 * Value: array of rows belonging to that group
 */
interface GroupedData {
  [groupKey: string]: NormalizedRow[];
}

/**
 * Aggregated row after applying aggregation functions
 * Always contains 'name' (group key or label) and computed values
 */
interface AggregatedRow {
  name: string;
  [columnName: string]: any;
}

/**
 * Chart data point - final format ready for visualization
 * Optimized for Recharts library
 */
interface ChartDataPoint {
  name: string; // X-axis label (category, date, etc.)
  [dataKey: string]: any; // Y-axis values (metrics)
}

/**
 * Configuration for data processing pipeline
 */
interface PipelineConfig {
  // Step 3: Grouping
  enableGrouping: boolean;
  groupByColumn?: string;
  
  // Step 4: Aggregation
  enableAggregation: boolean;
  aggregationFunction: 'sum' | 'avg' | 'count' | 'min' | 'max';
  aggregationColumns: string[];
  
  // Step 5: HAVING (filters on aggregated data)
  havingFilters?: HavingFilter[];
  
  // Step 6: Top N
  enableTopN: boolean;
  topNCount: number;
  sortByColumn?: string;
  sortDirection: 'asc' | 'desc';
  
  // Step 7: Chart mapping
  xAxisColumn: string;
  yAxisColumn?: string;
  chartType: string;
}

/**
 * HAVING filter for post-aggregation filtering
 */
interface HavingFilter {
  column: string;
  operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
  value: number;
}

// ============================================================================
// STEP 1: SELECT DATASET - Normalize raw API data
// ============================================================================

/**
 * Converts raw API response (cells array format) to normalized row objects
 * 
 * @param rawData - Raw data from API with cells array structure
 * @returns Array of normalized rows with column-value pairs
 * 
 * Example:
 * Input:  { cells: [{ column: { name: 'price' }, value: 100 }] }
 * Output: { price: 100 }
 */
function selectDataset(rawData: any[]): NormalizedRow[] {
  console.log('📋 [STEP 1: SELECT] Normalizing raw data...');
  
  if (!rawData || !Array.isArray(rawData)) {
    console.warn('⚠️ [STEP 1: SELECT] No valid data provided');
    return [];
  }

  const normalized = rawData.map((row, index) => {
    const normalizedRow: NormalizedRow = {};

    // Convert cells array to key-value object
    if (row.cells && Array.isArray(row.cells)) {
      row.cells.forEach((cell: any) => {
        if (cell.column && cell.column.name) {
          normalizedRow[cell.column.name] = cell.value;
        }
      });
    }

    return normalizedRow;
  });

  console.log(`✅ [STEP 1: SELECT] Normalized ${normalized.length} rows`);
  return normalized;
}

// ============================================================================
// STEP 2: WHERE FILTERS - Applied at API level (already done)
// ============================================================================

/**
 * Note: WHERE filters are applied at the API level via the useTableRows hook
 * This ensures efficient filtering before data is loaded into memory
 * 
 * Filters are passed as query parameters to the API endpoint:
 * Example: filters: "status=active,price>100"
 */

// ============================================================================
// STEP 3: GROUPING (GROUP BY) - Group rows by categorical column(s)
// ============================================================================

/**
 * Groups normalized rows by one or more columns
 * 
 * @param data - Normalized rows to group
 * @param groupByColumn - Column name to group by
 * @returns Object with group keys and their associated rows
 * 
 * Example:
 * Input:  [{ category: 'A', value: 10 }, { category: 'A', value: 20 }]
 * Output: { 'A': [{ category: 'A', value: 10 }, { category: 'A', value: 20 }] }
 */
function groupData(data: NormalizedRow[], groupByColumn: string): GroupedData {
  console.log(`🔢 [STEP 3: GROUP BY] Grouping by column: ${groupByColumn}`);
  
  const grouped: GroupedData = {};

  data.forEach(row => {
    const groupKey = row[groupByColumn] !== undefined && row[groupByColumn] !== null
      ? String(row[groupByColumn])
      : '__NULL__'; // Handle null/undefined values

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(row);
  });

  console.log(`✅ [STEP 3: GROUP BY] Created ${Object.keys(grouped).length} groups:`, Object.keys(grouped).slice(0, 10));
  return grouped;
}

// ============================================================================
// STEP 4: AGGREGATION - Apply aggregate functions to grouped data
// ============================================================================

/**
 * Applies an aggregation function to an array of numeric values
 * 
 * @param values - Array of numbers to aggregate
 * @param func - Aggregation function to apply
 * @returns Aggregated result
 */
function applyAggregationFunction(values: number[], func: 'sum' | 'avg' | 'count' | 'min' | 'max'): number {
  if (!values.length) return 0;

  switch (func) {
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0);
    case 'avg':
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return 0;
  }
}

/**
 * Extracts numeric values from a column across multiple rows
 * 
 * @param rows - Array of data rows
 * @param columnName - Column to extract values from
 * @returns Array of numeric values (nulls filtered out)
 */
function extractNumericValues(rows: NormalizedRow[], columnName: string): number[] {
  return rows
    .map(row => {
      const value = row[columnName];
      if (value === null || value === undefined) return null;
      const numericValue = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(numericValue) ? null : numericValue;
    })
    .filter((val): val is number => val !== null);
}

/**
 * Aggregates grouped data by applying aggregation functions to specified columns
 * 
 * RULE: Aggregation can only be applied AFTER grouping (or on entire dataset without grouping)
 * RULE: Only grouped columns + aggregated columns can appear in the result
 * 
 * @param groupedData - Data already grouped by GROUP BY step
 * @param aggregationColumns - Columns to aggregate
 * @param aggregationFunction - Function to apply (sum, avg, count, etc.)
 * @returns Array of aggregated rows (one per group)
 */
function aggregateGroupedData(
  groupedData: GroupedData,
  aggregationColumns: string[],
  aggregationFunction: 'sum' | 'avg' | 'count' | 'min' | 'max'
): AggregatedRow[] {
  console.log(`📊 [STEP 4: AGGREGATE] Applying ${aggregationFunction} to columns:`, aggregationColumns);

  const aggregated: AggregatedRow[] = [];

  Object.entries(groupedData).forEach(([groupKey, rows]) => {
    const aggregatedRow: AggregatedRow = {
      name: groupKey === '__NULL__' ? 'N/A' : groupKey
    };

    // Apply aggregation to each specified column
    aggregationColumns.forEach(columnName => {
      const values = extractNumericValues(rows, columnName);
      const aggregatedValue = applyAggregationFunction(values, aggregationFunction);
      aggregatedRow[columnName] = aggregatedValue;
      
      console.log(`  📈 Group "${groupKey}" → ${columnName}: ${aggregatedValue} (${aggregationFunction} of ${values.length} values)`);
    });

    aggregated.push(aggregatedRow);
  });

  console.log(`✅ [STEP 4: AGGREGATE] Generated ${aggregated.length} aggregated rows`);
  return aggregated;
}

/**
 * Aggregates entire dataset without grouping (single summary row)
 * 
 * @param data - Normalized rows
 * @param aggregationColumns - Columns to aggregate
 * @param aggregationFunction - Function to apply
 * @returns Single aggregated row representing the entire dataset
 */
function aggregateEntireDataset(
  data: NormalizedRow[],
  aggregationColumns: string[],
  aggregationFunction: 'sum' | 'avg' | 'count' | 'min' | 'max'
): AggregatedRow[] {
  console.log(`📊 [STEP 4: AGGREGATE] Aggregating entire dataset (no grouping)`);

  const aggregatedRow: AggregatedRow = { name: 'Total' };

  aggregationColumns.forEach(columnName => {
    const values = extractNumericValues(data, columnName);
    const aggregatedValue = applyAggregationFunction(values, aggregationFunction);
    aggregatedRow[columnName] = aggregatedValue;
    
    console.log(`  📈 ${columnName}: ${aggregatedValue} (${aggregationFunction} of ${values.length} values)`);
  });

  console.log(`✅ [STEP 4: AGGREGATE] Generated 1 aggregated row (total)`);
  return [aggregatedRow];
}

// ============================================================================
// STEP 5: HAVING - Filter aggregated results
// ============================================================================

/**
 * Applies HAVING filters to aggregated data
 * 
 * RULE: HAVING filters are applied AFTER aggregation
 * RULE: HAVING can only filter on aggregated columns or grouped columns
 * 
 * @param data - Aggregated rows
 * @param havingFilters - Filters to apply on aggregated values
 * @returns Filtered aggregated rows
 * 
 * Example:
 * Input:  [{ name: 'A', total: 100 }, { name: 'B', total: 50 }]
 * Filter: { column: 'total', operator: '>', value: 75 }
 * Output: [{ name: 'A', total: 100 }]
 */
function applyHavingFilters(data: AggregatedRow[], havingFilters?: HavingFilter[]): AggregatedRow[] {
  if (!havingFilters || havingFilters.length === 0) {
    console.log('⏭️ [STEP 5: HAVING] No HAVING filters to apply');
    return data;
  }

  console.log(`🔍 [STEP 5: HAVING] Applying ${havingFilters.length} HAVING filter(s)`);

  const filtered = data.filter(row => {
    return havingFilters.every(filter => {
      const value = typeof row[filter.column] === 'number' ? row[filter.column] : 0;
      
      switch (filter.operator) {
        case '>':  return value > filter.value;
        case '<':  return value < filter.value;
        case '>=': return value >= filter.value;
        case '<=': return value <= filter.value;
        case '=':  return value === filter.value;
        case '!=': return value !== filter.value;
        default:   return true;
      }
    });
  });

  console.log(`✅ [STEP 5: HAVING] Filtered ${data.length} → ${filtered.length} rows`);
  return filtered;
}

// ============================================================================
// STEP 6: TOP N - Sort and limit results
// ============================================================================

/**
 * Applies TOP N filtering by sorting and limiting results
 * 
 * RULE: TOP N is applied AFTER aggregation and HAVING filters
 * RULE: Sorting is done on aggregated columns or any numeric column
 * 
 * @param data - Aggregated rows
 * @param sortByColumn - Column to sort by (defaults to first numeric column)
 * @param sortDirection - Sort direction (asc or desc)
 * @param limit - Number of results to keep
 * @returns Top N sorted rows
 */
function applyTopN(
  data: AggregatedRow[],
  sortByColumn: string | undefined,
  sortDirection: 'asc' | 'desc',
  limit: number
): AggregatedRow[] {
  console.log(`🔝 [STEP 6: TOP N] Applying TOP ${limit} (sort by: ${sortByColumn || 'auto'}, direction: ${sortDirection})`);

  if (!data.length) {
    console.log('⏭️ [STEP 6: TOP N] No data to sort');
    return data;
  }

  // Auto-detect sort column if not specified (first numeric column)
  let effectiveSortColumn = sortByColumn;
  if (!effectiveSortColumn) {
    const numericColumns = Object.keys(data[0]).filter(
      key => key !== 'name' && typeof data[0][key] === 'number'
    );
    effectiveSortColumn = numericColumns[0] || 'name';
    console.log(`  🔍 Auto-detected sort column: ${effectiveSortColumn}`);
  }

  console.log(`  📊 Sorting by: ${effectiveSortColumn} (${sortDirection})`);

  // Sort data with proper numeric comparison
  const sorted = [...data].sort((a, b) => {
    let aVal: number | string = a[effectiveSortColumn!];
    let bVal: number | string = b[effectiveSortColumn!];
    
    // Handle numeric values
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    }
    
    // Handle string values (for 'name' column)
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'desc' ? -comparison : comparison;
    }
    
    // Fallback: convert to number
    const numA = typeof aVal === 'number' ? aVal : parseFloat(String(aVal)) || 0;
    const numB = typeof bVal === 'number' ? bVal : parseFloat(String(bVal)) || 0;
    return sortDirection === 'desc' ? numB - numA : numA - numB;
  });

  // Apply limit
  const limited = sorted.slice(0, limit);

  console.log(`✅ [STEP 6: TOP N] Sorted and limited ${data.length} → ${limited.length} rows`);
  console.log(`  📋 Top ${Math.min(3, limited.length)} results:`, limited.slice(0, 3).map(r => ({ 
    name: r.name, 
    [effectiveSortColumn]: r[effectiveSortColumn] 
  })));
  
  return limited;
}

// ============================================================================
// STEP 7: MAP TO CHART - Transform data for visualization
// ============================================================================

/**
 * Maps aggregated data to chart-ready format
 * 
 * RULE: Chart mapping is always the LAST step
 * RULE: Never mix data processing logic with visualization mapping
 * 
 * @param data - Aggregated and filtered data
 * @param xAxisColumn - Column to use for X-axis (category labels)
 * @param yAxisColumn - Optional specific Y-axis column
 * @param chartType - Type of chart being rendered
 * @returns Chart-ready data points
 */
function mapToChartData(
  data: AggregatedRow[],
  xAxisColumn: string,
  yAxisColumn: string | undefined,
  chartType: string
): ChartDataPoint[] {
  console.log(`🎨 [STEP 7: MAP TO CHART] Mapping data for ${chartType} chart`);

  if (!data.length) {
    console.log('⏭️ [STEP 7: MAP TO CHART] No data to map');
    return [];
  }

  const chartData: ChartDataPoint[] = data.map(row => {
    const chartPoint: ChartDataPoint = {
      name: row.name || 'Unknown'
    };

    // Copy all numeric columns (except 'name') to chart data
    Object.keys(row).forEach(key => {
      if (key !== 'name') {
        chartPoint[key] = row[key];
      }
    });

    // For pie charts, ensure 'value' key exists
    if (chartType === 'pie' && yAxisColumn && row[yAxisColumn] !== undefined) {
      chartPoint.value = row[yAxisColumn];
    }

    return chartPoint;
  });

  // Apply chart-specific sorting (e.g., pie charts look better sorted)
  if (chartType === 'pie') {
    const sortKey = yAxisColumn || Object.keys(chartData[0]).find(k => k !== 'name') || 'value';
    chartData.sort((a, b) => {
      const aVal = typeof a[sortKey] === 'number' ? a[sortKey] : 0;
      const bVal = typeof b[sortKey] === 'number' ? b[sortKey] : 0;
      return bVal - aVal; // Descending for pie charts
    });
  }

  console.log(`✅ [STEP 7: MAP TO CHART] Mapped ${chartData.length} chart data points`);
  return chartData;
}

// ============================================================================
// PIPELINE ORCHESTRATOR - Executes the complete data processing pipeline
// ============================================================================

/**
 * Executes the complete data processing pipeline in strict order
 * 
 * PIPELINE ORDER (IMMUTABLE):
 * 1. SELECT   - Normalize raw data
 * 2. WHERE    - Apply filters (done at API level)
 * 3. GROUP BY - Group data by columns
 * 4. AGGREGATE- Apply aggregation functions
 * 5. HAVING   - Filter aggregated results
 * 6. TOP N    - Sort and limit
 * 7. MAP      - Transform to chart format
 * 
 * @param rawData - Raw data from API
 * @param config - Pipeline configuration
 * @returns Chart-ready data points
 */
function executeDataPipeline(rawData: any[], config: PipelineConfig): ChartDataPoint[] {
  console.log('🚀 [PIPELINE START] =====================================');
  console.log('Configuration:', {
    grouping: config.enableGrouping,
    aggregation: config.enableAggregation,
    topN: config.enableTopN
  });

  // STEP 1: SELECT - Normalize raw data
  let normalizedData = selectDataset(rawData);
  if (!normalizedData.length) {
    console.log('❌ [PIPELINE END] No data after normalization');
    return [];
  }

  // STEP 2: WHERE - Already applied at API level
  console.log('✅ [STEP 2: WHERE] Filters applied at API level');

  // STEP 3 & 4: GROUP BY + AGGREGATE (these work together)
  let aggregatedData: AggregatedRow[];

  if (config.enableGrouping && config.groupByColumn) {
    // Grouping mode: GROUP BY → AGGREGATE
    const groupedData = groupData(normalizedData, config.groupByColumn);
    
    if (config.aggregationColumns.length > 0) {
      aggregatedData = aggregateGroupedData(
        groupedData,
        config.aggregationColumns,
        config.aggregationFunction
      );
    } else {
      // No aggregation specified, just count rows per group
      console.warn('⚠️ No aggregation columns specified, using COUNT by default');
      aggregatedData = Object.entries(groupedData).map(([groupKey, rows]) => ({
        name: groupKey === '__NULL__' ? 'N/A' : groupKey,
        count: rows.length
      }));
    }
  } else {
    // Raw mode: No grouping or aggregation
    // Transform normalized data to aggregated format (keep as-is)
    console.log('⏭️ [STEP 3-4: RAW MODE] Pass-through mode - no grouping or aggregation');
    aggregatedData = normalizedData.map((row, index) => ({
      name: row[config.xAxisColumn] !== undefined 
        ? String(row[config.xAxisColumn])
        : `Row ${index + 1}`,
      ...row
    }));
  }

  // STEP 5: HAVING - Filter aggregated results
  aggregatedData = applyHavingFilters(aggregatedData, config.havingFilters);

  // STEP 6: TOP N - Sort and limit
  if (config.enableTopN) {
    aggregatedData = applyTopN(
      aggregatedData,
      config.sortByColumn,
      config.sortDirection,
      config.topNCount
    );
  }

  // STEP 7: MAP TO CHART - Final transformation
  const chartData = mapToChartData(
    aggregatedData,
    config.xAxisColumn,
    config.yAxisColumn,
    config.chartType
  );

  console.log('✅ [PIPELINE END] =====================================');
  console.log('Final result:', {
    inputRows: rawData.length,
    outputDataPoints: chartData.length,
    sampleData: chartData.slice(0, 3)
  });

  return chartData;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ChartWidgetRenderer: React.FC<ChartWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false
}) => {
  // Extract chart configuration with defensive checks
  const config = widget.config as any;
  
  // Ensure config and settings exist
  if (!config || !config.settings) {
    console.error('ChartWidgetRenderer: Invalid config or missing settings', { config });
    return <div>Invalid widget configuration</div>;
  }
  
  const chartType = config.settings.chartType || "bar";
  const mappings = config.data?.mappings || { y: [] };
  const databaseId = config.data?.databaseId;
  const tableId = config.data?.tableId;
  const filters = config.data?.filters || [];
  const refreshSettings = config.refresh || { enabled: false, interval: 30000 };

  // Data processing configuration with defensive checks
  const processingMode = config.settings.processingMode || "raw";
  const aggregationFunction = config.settings.aggregationFunction || "sum";
  const aggregationColumns = config.settings.aggregationColumns || [];
  const groupByColumn = config.settings.groupByColumn;
  const enableTopN = config.settings.enableTopN || false;
  const topNCount = config.settings.topNCount || 10;
  const sortByColumn = config.settings.sortByColumn;
  const sortDirection = config.settings.sortDirection || "desc";
  
  // Only grouped mode has aggregation
  const enableGrouping = processingMode === "grouped";
  const enableAggregation = false; // Removed simple aggregation mode

  // Fetch data from API (WHERE filters applied here)
  const validFilters = filters.filter((f: any) => f.column && f.operator && f.value !== undefined);
  const filterString = validFilters.map((f: any) => `${f.column}${f.operator}${f.value}`).join(',');
  
  const { data: rawData, isLoading, error, refetch } = useTableRows(
    widget.tenantId,
    databaseId || 0,
    Number(tableId) || 0,
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

  // Get premium theme
  const theme = getPremiumTheme(config?.style?.theme || 'platinum');
  
  // Premium color palette for data visualization
  const premiumColors = config?.style?.theme === 'onyx' || config?.style?.theme === 'obsidian'
    ? premiumDataColors.elegant
    : premiumDataColors.professional;

  // Process data through the pipeline
  const processedData = useMemo(() => {
    // Return mock data if no configuration or data
    const yColumns = Array.isArray(mappings.y) ? mappings.y : (mappings.y ? [mappings.y] : []);
    
    if (!mappings.x || !rawData?.data?.length) {
      console.log('📊 Using mock data (no mappings or data)');
      return [
        { name: "Jan", value: 400 },
        { name: "Feb", value: 300 },
        { name: "Mar", value: 200 },
        { name: "Apr", value: 278 },
        { name: "May", value: 189 },
        { name: "Jun", value: 239 },
      ];
    }

    // Build pipeline configuration
    const pipelineConfig: PipelineConfig = {
      enableGrouping,
      groupByColumn,
      enableAggregation,
      aggregationFunction,
      aggregationColumns: aggregationColumns.length > 0 ? aggregationColumns : yColumns,
      enableTopN,
      topNCount,
      sortByColumn,
      sortDirection,
      xAxisColumn: mappings.x,
      yAxisColumn: yColumns[0], // Use first Y column for backward compatibility
      chartType,
    };

    // Execute the complete pipeline
    return executeDataPipeline(rawData.data, pipelineConfig);
  }, [
    rawData,
    mappings,
    enableAggregation,
    enableGrouping,
    enableTopN,
    aggregationFunction,
    aggregationColumns,
    groupByColumn,
    sortByColumn,
    sortDirection,
    topNCount,
    chartType
  ]);

  // Generate data keys for multi-series charts
  const dataKeys = useMemo(() => {
    if (!processedData.length) return [{ key: "value", name: "Value", color: premiumColors[0] }];
    
    const yColumns = Array.isArray(mappings.y) ? mappings.y : (mappings.y ? [mappings.y] : []);
    
    // Priority 1: Use aggregation columns if specified
    if (aggregationColumns.length > 0) {
      return aggregationColumns.map((column: string, index: number) => ({
        key: column,
        name: column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' '),
        color: Object.values(premiumColors)[index % Object.values(premiumColors).length]
      }));
    }
    
    // Priority 2: Use Y columns from mappings if specified
    if (yColumns.length > 0) {
      return yColumns.map((column: string, index: number) => ({
        key: column,
        name: column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' '),
        color: Object.values(premiumColors)[index % Object.values(premiumColors).length]
      }));
    }
    
    // Priority 3: Auto-detect numeric columns
    const keys = new Set<string>();
    processedData.forEach((row: any) => {
      Object.keys(row).forEach((key: any) => {
        if (key !== 'name' && typeof row[key] === 'number') {
          keys.add(key);
        }
      });
    });
    
    if (keys.size === 0) {
      return [{ key: "value", name: "Value", color: premiumColors[0] }];
    }
    
    return Array.from(keys).map((key: string, index: number) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      color: premiumColors[index % premiumColors.length]
    }));
  }, [processedData, aggregationColumns, mappings, premiumColors]);

  // Style configuration
  const styleConfig = config?.style || {};
  const showGrid = styleConfig.showGrid !== false;
  const showLegend = styleConfig.showLegend !== false;
  const legendPosition = styleConfig.legendPosition || "bottom";
  const showTooltip = true;
  const gridColor = styleConfig.gridColor || theme.colors.border;
  const textColor = styleConfig.textColor || theme.colors.foreground;
  const accentColor = styleConfig.accentColor || theme.colors.accent;

  // Chart component selector
  const getChartComponent = () => {
    switch (chartType) {
      case "bar": return BarChart;
      case "area": return AreaChart;
      case "pie": return PieChart;
      case "scatter": return ScatterChart;
      case "radar": return RadarChart;
      default: return LineChart;
    }
  };

  const ChartComponent = getChartComponent();

  // Loading state
  if (isLoading) {
    return <WidgetLoadingState 
      widget={widget} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
      variant="chart"
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
      title="Error loading chart data"
    />;
  }

  // Render chart
  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <PremiumWidgetContainer style={styleConfig} className="h-full w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent 
              data={processedData} 
              margin={{ 
                top: legendPosition === "top" ? 30 : 10, 
                right: legendPosition === "right" ? 100 : 20, 
                left: legendPosition === "left" ? 100 : 10, 
                bottom: legendPosition === "bottom" ? 30 : 10 
              }}
            >
              {showGrid && chartType !== "pie" && chartType !== "radar" && (
                <CartesianGrid 
                  strokeDasharray="1 1" 
                  stroke={gridColor}
                  strokeOpacity={0.2}
                  vertical={false}
                />
              )}
              
              {chartType === "radar" ? (
                <>
                  <PolarGrid stroke={gridColor} strokeOpacity={0.3} />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: textColor, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis 
                    tick={{ fontSize: 10, fill: textColor, fontWeight: 500 }}
                    stroke={gridColor}
                  />
                </>
              ) : chartType !== "pie" && (
                <>
                  <XAxis 
                    dataKey="name" 
                    tick={{ 
                      fontSize: 10, 
                      fill: textColor,
                      fontWeight: 500,
                      fontFamily: theme.typography.fontFamily
                    }}
                    tickLine={{ stroke: gridColor, strokeWidth: 1 }}
                    axisLine={{ stroke: gridColor, strokeWidth: 1 }}
                    tickMargin={8}
                  />
                  <YAxis 
                    tick={{ 
                      fontSize: 10, 
                      fill: textColor,
                      fontWeight: 500,
                      fontFamily: theme.typography.fontFamily
                    }}
                    tickLine={{ stroke: gridColor, strokeWidth: 1 }}
                    axisLine={{ stroke: gridColor, strokeWidth: 1 }}
                    tickMargin={8}
                  />
                </>
              )}
              
              {showTooltip && (
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: "12px",
                    boxShadow: theme.shadows.bold,
                    backdropFilter: "blur(12px)",
                    fontFamily: theme.typography.fontFamily,
                    fontSize: "11px",
                    fontWeight: theme.typography.fontWeight.medium,
                    color: textColor,
                    padding: "12px 16px"
                  }}
                  labelStyle={{
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: textColor,
                    fontSize: "12px",
                    marginBottom: "6px",
                    letterSpacing: "-0.01em"
                  }}
                  cursor={{ fill: theme.colors.muted, opacity: 0.1 }}
                />
              )}
              
              {showLegend && dataKeys.length > 1 && (
                <Legend 
                  verticalAlign={legendPosition === "top" || legendPosition === "bottom" ? legendPosition : "middle"}
                  align={legendPosition === "left" || legendPosition === "right" ? legendPosition : "center"}
                  layout={legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal"}
                  wrapperStyle={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: "10px",
                    fontWeight: theme.typography.fontWeight.medium,
                    color: textColor,
                    letterSpacing: "0.02em"
                  }}
                  iconType="circle"
                  iconSize={8}
                />
              )}
              
              {/* Render chart elements based on type */}
              {chartType === "area" && dataKeys.map((dataKey: any, index: number) => (
                <Area
                  key={dataKey.key}
                  type="monotone"
                  dataKey={dataKey.key}
                  stroke={dataKey.color}
                  fill={dataKey.color}
                  fillOpacity={0.12}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  name={dataKey.name}
                />
              ))}
              
              {chartType === "bar" && dataKeys.map((dataKey: any, index: number) => (
                <Bar
                  key={dataKey.key}
                  dataKey={dataKey.key}
                  fill={dataKey.color}
                  name={dataKey.name}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              ))}
              
              {chartType === "pie" && (
                <Pie
                  data={processedData}
                  dataKey={dataKeys[0]?.key || "value"}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={styleConfig.shine ? 20 : 0}
                  paddingAngle={2}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{
                    stroke: textColor,
                    strokeWidth: 1
                  }}
                >
                  {processedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={premiumColors[index % premiumColors.length]}
                      stroke={theme.colors.background}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              )}
              
              {chartType === "scatter" && dataKeys.map((dataKey: any, index: number) => (
                <Scatter
                  key={dataKey.key}
                  data={processedData}
                  fill={dataKey.color}
                  name={dataKey.name}
                  shape="circle"
                />
              ))}
              
              {chartType === "radar" && dataKeys.map((dataKey: any, index: number) => (
                <Radar
                  key={dataKey.key}
                  name={dataKey.name}
                  dataKey={dataKey.key}
                  stroke={dataKey.color}
                  fill={dataKey.color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              
              {(chartType === "line" || !["area", "bar", "pie", "scatter", "radar"].includes(chartType)) && dataKeys.map((dataKey: any, index: number) => (
                <Line
                  key={dataKey.key}
                  type="monotone"
                  dataKey={dataKey.key}
                  stroke={dataKey.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  dot={{ r: 0 }}
                  activeDot={{ 
                    r: 5, 
                    fill: theme.colors.background, 
                    stroke: dataKey.color, 
                    strokeWidth: 2.5,
                    filter: `drop-shadow(0 2px 4px ${dataKey.color}40)`
                  }}
                  name={dataKey.name}
                />
              ))}
            </ChartComponent>
          </ResponsiveContainer>
        </motion.div>
      </PremiumWidgetContainer>
    </BaseWidget>
  );
};
