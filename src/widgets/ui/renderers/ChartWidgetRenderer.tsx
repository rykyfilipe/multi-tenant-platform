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
import { ChartDataProcessor } from "@/widgets/processors/ChartDataProcessor";
import { cn } from "@/lib/utils";

interface ChartWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

// ============================================================================
// CHART DATA POINT INTERFACE
// ============================================================================

/**
 * Chart data point - final format ready for visualization
 * Optimized for Recharts library
 */
interface ChartDataPoint {
  name: string; // X-axis label (category, date, etc.)
  [dataKey: string]: any; // Y-axis values (metrics)
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
  // Extract chart configuration
  const config = widget.config as any;
  const chartType = config?.settings?.chartType || "bar";
  const mappings = config?.data?.mappings || { y: [] };
  const databaseId = config?.data?.databaseId;
  const tableId = config?.data?.tableId;
  const filters = config?.data?.filters || [];
  const refreshSettings = config?.refresh || { enabled: false, interval: 30000 };

  // Data processing configuration - SIMPLIFIED (auto-grouping by X axis)
  const yColumnAggregations = config?.settings?.yColumnAggregations;
  const yColumnColors = config?.settings?.yColumnColors || {};
  const enableTopN = config?.settings?.enableTopN || false;
  const topNCount = config?.settings?.topNCount || 10;

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

  // Process data through the simplified pipeline
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

    // Build SIMPLIFIED configuration for ChartDataProcessor
    const chartConfig = {
      dataSource: {
        databaseId: databaseId || 0,
        tableId: tableId || "",
      },
      mappings: {
        x: mappings.x,
        y: yColumns,
      },
      processing: {
        yColumnAggregations: yColumnAggregations || undefined,
      },
      filters: filters,
      topN: enableTopN ? {
        enabled: true,
        count: topNCount,
        autoSort: true,
      } : undefined,
    };

    // Execute the simplified pipeline (auto-groups by X axis when aggregations configured)
    return ChartDataProcessor.process(rawData.data, chartConfig);
  }, [
    rawData,
    mappings,
    databaseId,
    tableId,
    JSON.stringify(yColumnAggregations),
    JSON.stringify(filters),
    enableTopN,
    topNCount,
  ]);

  // Generate data keys for multi-series charts - simplified
  const dataKeys = useMemo(() => {
    const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
    
    if (!processedData.length) return [{ key: "value", name: "Value", color: yColumnColors['value'] || premiumColors[0] }];
    
    const yColumns = Array.isArray(mappings.y) ? mappings.y : (mappings.y ? [mappings.y] : []);
    
    // Use Y columns from mappings (simplified - no more aggregation columns redundancy)
    if (yColumns.length > 0) {
      return yColumns.map((column: string, index: number) => ({
        key: column,
        name: column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' '),
        // Use custom color if set, otherwise use default colors, fallback to premium colors
        color: yColumnColors[column] || defaultColors[index % defaultColors.length] || Object.values(premiumColors)[index % Object.values(premiumColors).length]
      }));
    }
    
    // Auto-detect numeric columns as fallback
    const keys = new Set<string>();
    processedData.forEach((row: any) => {
      Object.keys(row).forEach((key: any) => {
        if (key !== 'name' && typeof row[key] === 'number') {
          keys.add(key);
        }
      });
    });
    
    if (keys.size === 0) {
      return [{ key: "value", name: "Value", color: yColumnColors['value'] || premiumColors[0] }];
    }
    
    return Array.from(keys).map((key: string, index: number) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      // Use custom color if set, otherwise use default colors
      color: yColumnColors[key] || defaultColors[index % defaultColors.length] || premiumColors[index % premiumColors.length]
    }));
  }, [processedData, mappings, premiumColors, yColumnColors]);

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
