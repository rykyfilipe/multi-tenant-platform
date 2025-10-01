"use client";

import React, { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { useTableRows } from "@/hooks/useDatabaseTables";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

export const ChartWidgetRenderer: React.FC<ChartWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false
}) => {
  // Extract chart configuration from widget config
  const config = widget.config as any;
  const chartType = config?.settings?.chartType || "bar";
  const mappings = config?.data?.mappings || {};
  const databaseId = config?.data?.databaseId;
  const tableId = config?.data?.tableId;
  const filters = config?.data?.filters || [];
  const refreshSettings = config?.refresh || { enabled: false, interval: 30000 };

  // Advanced features configuration
  const enableAggregation = config?.settings?.enableAggregation || false;
  const aggregationFunction = config?.settings?.aggregationFunction || "sum";
  const aggregationColumns = config?.settings?.aggregationColumns || [];
  const enableGrouping = config?.settings?.enableGrouping || false;
  const groupByColumn = config?.settings?.groupByColumn;
  const enableTopN = config?.settings?.enableTopN || false;
  const topNCount = config?.settings?.topNCount || 10;
  const sortByColumn = config?.settings?.sortByColumn;
  const sortDirection = config?.settings?.sortDirection || "desc";

  console.log('🔧 ChartWidgetRenderer - Widget config:', {
    widgetId: widget.id,
    config,
    chartType,
    mappings,
    databaseId,
    tableId,
    filters,
    refreshSettings
  });
  
  // Fetch real data from API
  const validFilters = filters.filter((f: any) => f.column && f.operator && f.value !== undefined);
  const filterString = validFilters.map((f: any) => `${f.column}${f.operator}${f.value}`).join(',');
  
  console.log('🔍 ChartWidgetRenderer - Data construction:', {
    tenantId: widget.tenantId,
    databaseId,
    tableId: Number(tableId),
    filters,
    validFilters,
    filterString,
    mappings
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

  console.log('📡 ChartWidgetRenderer - API Response:', {
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

  // Premium black and white color palette
  const premiumColors = {
    primary: "#1f2937", // Dark gray
    secondary: "#374151", // Medium gray
    accent: "#4b5563", // Light gray
    success: "#111827", // Very dark gray
    warning: "#6b7280", // Gray
    error: "#000000", // Black
    neutral: "#9ca3af", // Light gray
  };

  // Helper function to apply aggregation
  const applyAggregation = (values: number[], func: string) => {
    if (!values.length) return 0;

    switch (func) {
      case 'sum': return values.reduce((sum, val) => sum + val, 0);
      case 'avg': return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'count': return values.length;
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      default: return values.reduce((sum, val) => sum + val, 0);
    }
  };

  // Helper function to extract numeric values from column
  const extractNumericValues = (data: any[], columnName: string) => {
    return data
      .map(row => {
        const value = row[columnName];
        if (value === null || value === undefined) return null;
        const numericValue = typeof value === 'number' ? value : parseFloat(value);
        return isNaN(numericValue) ? null : numericValue;
      })
      .filter(val => val !== null) as number[];
  };

  // Process data based on mappings and advanced features
  const processedData = useMemo(() => {
    console.log('🔄 ChartWidgetRenderer - Processing data:', {
      rawData,
      hasRawData: !!rawData?.data,
      rawDataLength: rawData?.data?.length || 0,
      mappings,
      enableAggregation,
      enableGrouping,
      enableTopN,
      aggregationColumns,
      groupByColumn,
      sortByColumn,
      sortDirection
    });

    // If no mappings or no data, return mock data
    if (!mappings.x || !rawData?.data?.length) {
      console.log('📊 ChartWidgetRenderer - Using mock data');
      return [
        { name: "Jan", value: 400, value2: 240 },
        { name: "Feb", value: 300, value2: 139 },
        { name: "Mar", value: 200, value2: 980 },
        { name: "Apr", value: 278, value2: 390 },
        { name: "May", value: 189, value2: 480 },
        { name: "Jun", value: 239, value2: 380 },
      ];
    }

    console.log('📊 ChartWidgetRenderer - Processing real data:', {
      rawDataLength: rawData.data.length,
      firstRow: rawData.data[0],
      mappings
    });

    // First, convert raw data to a more manageable format
    let processed = rawData.data.map((row: any, index: number) => {
      const processedRow: any = {};

      // Convert cells array to object for easier access
      const rowData: any = {};
      if (row.cells && Array.isArray(row.cells)) {
        row.cells.forEach((cell: any) => {
          if (cell.column && cell.column.name) {
            rowData[cell.column.name] = cell.value;
          }
        });
      }

      // Map X axis (usually categorical)
      if (mappings.x && rowData[mappings.x] !== undefined) {
        processedRow.name = String(rowData[mappings.x]);
      }

      // Map Y axis (usually numeric)
      if (mappings.y && rowData[mappings.y] !== undefined) {
        processedRow.value = parseFloat(rowData[mappings.y]) || 0;
      }

      // Add all original row data for advanced processing
      processedRow._originalRowData = rowData;

      return processedRow;
    });

    // Validate that aggregation and grouping are not both enabled
    if (enableAggregation && enableGrouping) {
      console.warn('⚠️ ChartWidgetRenderer - Both aggregation and grouping are enabled. This is not allowed.');
      // Default to grouping if both are enabled
      processed = processed; // Keep as is, will be processed by grouping logic
    }

    // Apply simple aggregation if enabled (without grouping)
    if (enableAggregation && !enableGrouping && aggregationColumns.length > 0) {
      console.log('🔄 ChartWidgetRenderer - Applying simple aggregation:', { aggregationFunction, aggregationColumns });

      const aggregatedRow: any = { name: "Total" };

      // Apply aggregation for each specified column
      aggregationColumns.forEach(columnName => {
        const values = extractNumericValues(processed, columnName);
        const aggregatedValue = applyAggregation(values, aggregationFunction);
        aggregatedRow[columnName] = aggregatedValue;
        
        console.log(`📊 Aggregated ${columnName}: ${aggregatedValue} (${aggregationFunction} of ${values.length} values)`);
      });

      // If no aggregation columns specified but Y mapping exists, aggregate the Y column
      if (aggregationColumns.length === 0 && mappings.y) {
        const values = extractNumericValues(processed, mappings.y);
        aggregatedRow.value = applyAggregation(values, aggregationFunction);
        console.log(`📊 Aggregated ${mappings.y}: ${aggregatedRow.value} (${aggregationFunction} of ${values.length} values)`);
      }

      processed = [aggregatedRow];
    }

    // Apply grouping if enabled (and not aggregation)
    if (enableGrouping && !enableAggregation && groupByColumn) {
      console.log('🔄 ChartWidgetRenderer - Applying grouping:', { groupByColumn, aggregationColumns, aggregationFunction });

      const groupedData: Record<string, any[]> = {};

      // Group data by the specified column
      processed.forEach(row => {
        const groupKey = String(row._originalRowData?.[groupByColumn] || 'Unknown');
        if (!groupedData[groupKey]) {
          groupedData[groupKey] = [];
        }
        groupedData[groupKey].push(row);
      });

      console.log(`📊 Grouped data into ${Object.keys(groupedData).length} groups:`, Object.keys(groupedData));

      // Apply aggregation to each group
      const aggregatedData: any[] = [];

      Object.entries(groupedData).forEach(([groupKey, groupRows]) => {
        const aggregatedRow: any = { name: groupKey };

        // If aggregation columns are specified, use them
        if (aggregationColumns.length > 0) {
          aggregationColumns.forEach(columnName => {
            const values = extractNumericValues(groupRows, columnName);
            const aggregatedValue = applyAggregation(values, aggregationFunction);
            aggregatedRow[columnName] = aggregatedValue;
            
            console.log(`📊 Group "${groupKey}" - ${columnName}: ${aggregatedValue} (${aggregationFunction} of ${values.length} values)`);
          });
        } else if (mappings.y) {
          // Default to aggregating the Y axis column
          const values = extractNumericValues(groupRows, mappings.y);
          aggregatedRow.value = applyAggregation(values, aggregationFunction);
          console.log(`📊 Group "${groupKey}" - ${mappings.y}: ${aggregatedRow.value} (${aggregationFunction} of ${values.length} values)`);
        }

        aggregatedData.push(aggregatedRow);
      });

      processed = aggregatedData;
    }

    // Apply top N filtering if enabled
    if (enableTopN && processed.length > 0) {
      const sortColumn = sortByColumn || (aggregationColumns.length > 0 ? aggregationColumns[0] : 'value');
      
      console.log('🔄 ChartWidgetRenderer - Applying top N:', { sortColumn, sortDirection, topNCount });

      processed.sort((a, b) => {
        const aVal = a[sortColumn] || a.value || 0;
        const bVal = b[sortColumn] || b.value || 0;

        if (sortDirection === 'desc') {
          return bVal - aVal;
        } else {
          return aVal - bVal;
        }
      });

      processed = processed.slice(0, topNCount);
      console.log(`📊 Top N applied: showing ${processed.length} results`);
    }

    console.log('📊 ChartWidgetRenderer - Final processed data:', {
      processedLength: processed.length,
      firstProcessedRow: processed[0],
      sampleProcessedRows: processed.slice(0, 3),
      aggregationEnabled: enableAggregation,
      groupingEnabled: enableGrouping,
      topNEnabled: enableTopN
    });

    return processed;
  }, [rawData, mappings, enableAggregation, enableGrouping, enableTopN, aggregationFunction, aggregationColumns, groupByColumn, sortByColumn, sortDirection, topNCount]);

  // Generate data keys based on mappings and data
  const dataKeys = useMemo(() => {
    if (!processedData.length) return [{ key: "value", name: "Value", color: "#1f2937" }];
    
    console.log('🔑 ChartWidgetRenderer - Generating data keys:', {
      aggregationColumns,
      enableAggregation,
      enableGrouping,
      firstRow: processedData[0]
    });
    
    // If we have aggregation columns specified, use them as data keys
    if (aggregationColumns.length > 0) {
      const keys = aggregationColumns.map((column, index) => ({
        key: column,
        name: column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' '),
        color: Object.values(premiumColors)[index % Object.values(premiumColors).length]
      }));
      
      console.log('🔑 Using aggregation columns as keys:', keys);
      return keys;
    }
    
    // Auto-detect numeric columns from processed data
    const keys = new Set<string>();
    processedData.forEach((row: any) => {
      Object.keys(row).forEach((key: any) => {
        // Include numeric columns but exclude metadata
        if (key !== 'name' && key !== '_originalRowData' && typeof row[key] === 'number') {
          keys.add(key);
        }
      });
    });
    
    console.log('🔑 Auto-detected numeric keys:', Array.from(keys));
    
    // If no numeric keys found, default to 'value'
    if (keys.size === 0) {
      console.log('🔑 No numeric keys found, using default "value" key');
      return [{ key: "value", name: "Value", color: "#1f2937" }];
    }
    
    const keyArray = Array.from(keys).map((key, index) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      color: Object.values(premiumColors)[index % Object.values(premiumColors).length]
    }));
    
    console.log('🔑 Final data keys:', keyArray);
    return keyArray;
  }, [processedData, premiumColors, aggregationColumns, enableAggregation, enableGrouping]);

  const showGrid = config?.style?.showGrid !== false;
  const showLegend = config?.style?.showLegend !== false;
  const showTooltip = true;
  const backgroundColor = config?.style?.backgroundColor || "#ffffff";
  const textColor = config?.style?.textColor || "#000000";

  // Determine chart component based on type
  const getChartComponent = () => {
    switch (chartType) {
      case "bar":
        return BarChart;
      case "area":
        return AreaChart;
      case "pie":
        return PieChart;
      case "scatter":
        return ScatterChart;
      case "radar":
        return RadarChart;
      default:
        return LineChart;
    }
  };

  const ChartComponent = getChartComponent();

  // Loading state
  if (isLoading) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <div className="h-full w-full p-4">
          <div className="h-full flex items-center justify-center">
            <div className="space-y-3 w-full">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          </div>
        </div>
      </BaseWidget>
    );
  }

  // Error state
  if (error) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <div className="h-full w-full p-4">
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-red-500">
              <p className="text-sm">Error loading chart data</p>
              <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div className="h-full w-full p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent 
              data={processedData} 
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              style={{ backgroundColor }}
            >
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="1 1" 
                  stroke="#e5e7eb" 
                  strokeOpacity={0.3}
                  vertical={false}
                />
              )}
              {chartType === "radar" ? (
                <>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis />
                </>
              ) : (
                <>
                  <XAxis 
                    dataKey="name" 
                    tick={{ 
                      fontSize: 11, 
                      fill: "#6b7280",
                      fontWeight: 500,
                      fontFamily: "Inter, system-ui, sans-serif"
                    }}
                    tickLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                    axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                    tickMargin={6}
                  />
                  <YAxis 
                    tick={{ 
                      fontSize: 11, 
                      fill: "#6b7280",
                      fontWeight: 500,
                      fontFamily: "Inter, system-ui, sans-serif"
                    }}
                    tickLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                    axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                    tickMargin={6}
                  />
                </>
              )}
              {showTooltip && (
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(229, 231, 235, 0.8)",
                    borderRadius: "8px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    backdropFilter: "blur(8px)",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: textColor,
                    padding: "8px 12px"
                  }}
                  labelStyle={{
                    fontWeight: "600",
                    color: textColor,
                    fontSize: "13px",
                    marginBottom: "2px"
                  }}
                />
              )}
              {showLegend && (
                <Legend 
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: textColor
                  }}
                />
              )}
              {dataKeys.length > 1 && (
                <Legend 
                  wrapperStyle={{
                    paddingTop: "10px",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "11px",
                    fontWeight: "500"
                  }}
                />
              )}
              {chartType === "area" && (
                dataKeys.map((dataKey: any, index: number) => (
                  <Area
                    key={dataKey.key}
                    type="monotone"
                    dataKey={dataKey.key}
                    stroke={dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length]}
                    fill={dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    name={dataKey.name}
                  />
                ))
              )}
              {chartType === "bar" && (
                dataKeys.map((dataKey: any, index: number) => (
                  <Bar
                    key={dataKey.key}
                    dataKey={dataKey.key}
                    fill={dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length]}
                    name={dataKey.name}
                    radius={[2, 2, 0, 0]}
                  />
                ))
              )}
              {chartType === "pie" && (
                <Pie
                  data={processedData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                >
                  {processedData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={Object.values(premiumColors)[index % Object.values(premiumColors).length]} />
                  ))}
                </Pie>
              )}
              {chartType === "scatter" && (
                <Scatter
                  data={processedData}
                  fill={premiumColors.primary}
                />
              )}
              {chartType === "radar" && (
                dataKeys.map((dataKey: any, index: number) => (
                  <Radar
                    key={dataKey.key}
                    name={dataKey.name}
                    dataKey={dataKey.key}
                    stroke={dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length]}
                    fill={dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length]}
                    fillOpacity={0.15}
                  />
                ))
              )}
              {(chartType === "line" || !["area", "bar", "pie", "scatter", "radar"].includes(chartType)) && (
                dataKeys.map((dataKey: any, index: number) => (
                  <Line
                    key={dataKey.key}
                    type="monotone"
                    dataKey={dataKey.key}
                    stroke={dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length]}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={{ 
                      fill: dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length], 
                      strokeWidth: 0, 
                      r: 0,
                      opacity: 0
                    }}
                    activeDot={{ 
                      r: 4, 
                      stroke: dataKey.color || Object.values(premiumColors)[index % Object.values(premiumColors).length], 
                      strokeWidth: 2,
                      fill: "white",
                      strokeOpacity: 1,
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))"
                    }}
                    name={dataKey.name}
                  />
                ))
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </BaseWidget>
  );
};
