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

  // Style configuration - NEW ADVANCED PROPERTIES
  const styleConfig = config?.style || {};
  
  // General styling
  const backgroundColor = styleConfig.backgroundColor || "#FFFFFF";
  const backgroundOpacity = styleConfig.backgroundOpacity ?? 1;
  const borderRadius = styleConfig.borderRadius ?? 8;
  const padding = styleConfig.padding || { top: 20, right: 20, bottom: 20, left: 20 };
  
  // Line styling
  const lineConfig = styleConfig.line || {};
  const lineWidth = lineConfig.width ?? 2;
  const lineTension = lineConfig.tension ?? 0.4;
  const lineStyle = lineConfig.style || "solid";
  const lineGradient = lineConfig.gradient || { enabled: false, startOpacity: 0.8, endOpacity: 0.1 };
  
  // Points styling
  const pointsConfig = styleConfig.points || {};
  const showPoints = pointsConfig.show ?? true;
  const pointRadius = pointsConfig.radius ?? 4;
  const pointHoverRadius = pointsConfig.hoverRadius ?? 6;
  const pointBorderWidth = pointsConfig.borderWidth ?? 2;
  const pointBorderColor = pointsConfig.borderColor || "#FFFFFF";
  const pointStyle = pointsConfig.style || "circle";
  
  // Bar styling
  const barsConfig = styleConfig.bars || {};
  const barBorderRadius = barsConfig.borderRadius ?? 4;
  const barBorderWidth = barsConfig.borderWidth ?? 0;
  const barBorderColor = barsConfig.borderColor;
  const barPercentage = barsConfig.barPercentage ?? 0.8;
  const barMaxThickness = barsConfig.maxBarThickness || 60;
  
  // Grid styling
  const gridConfig = styleConfig.grid || {};
  const showGrid = gridConfig.show ?? true;
  const gridColor = gridConfig.color || "rgba(0, 0, 0, 0.1)";
  const gridLineWidth = gridConfig.lineWidth ?? 1;
  const gridStyle = gridConfig.style || "solid";
  const gridDashPattern = gridStyle === "dashed" ? [5, 5] : gridStyle === "dotted" ? [2, 2] : undefined;
  
  // Axes styling
  const axesConfig = styleConfig.axes || {};
  const xAxisConfig = axesConfig.x || {};
  const yAxisConfig = axesConfig.y || {};
  const showXAxis = xAxisConfig.show ?? true;
  const showYAxis = yAxisConfig.show ?? true;
  const xAxisColor = xAxisConfig.color || "#666666";
  const yAxisColor = yAxisConfig.color || "#666666";
  const xAxisFontSize = xAxisConfig.fontSize ?? 12;
  const yAxisFontSize = yAxisConfig.fontSize ?? 12;
  const xAxisFontFamily = xAxisConfig.fontFamily || "Inter, system-ui, sans-serif";
  const yAxisFontFamily = yAxisConfig.fontFamily || "Inter, system-ui, sans-serif";
  const xAxisFontWeight = xAxisConfig.fontWeight || "400";
  const yAxisFontWeight = yAxisConfig.fontWeight || "400";
  const xAxisRotation = xAxisConfig.rotation ?? 0;
  
  // Legend styling
  const legendConfig = styleConfig.legend || {};
  const showLegend = legendConfig.show ?? true;
  const legendPosition = legendConfig.position || "bottom";
  const legendAlign = legendConfig.align || "center";
  const legendFontSize = legendConfig.fontSize ?? 12;
  const legendFontFamily = legendConfig.fontFamily || "Inter, system-ui, sans-serif";
  const legendFontWeight = legendConfig.fontWeight || "400";
  const legendColor = legendConfig.color || "#333333";
  const legendBoxWidth = legendConfig.boxWidth ?? 40;
  
  // Tooltip styling
  const tooltipConfig = styleConfig.tooltip || {};
  const showTooltip = tooltipConfig.enabled ?? true;
  const tooltipBgColor = tooltipConfig.backgroundColor || "rgba(0, 0, 0, 0.8)";
  const tooltipTitleColor = tooltipConfig.titleColor || "#FFFFFF";
  const tooltipBodyColor = tooltipConfig.bodyColor || "#FFFFFF";
  const tooltipBorderColor = tooltipConfig.borderColor || "rgba(255, 255, 255, 0.3)";
  const tooltipBorderWidth = tooltipConfig.borderWidth ?? 1;
  const tooltipBorderRadius = tooltipConfig.borderRadius ?? 6;
  const tooltipPadding = tooltipConfig.padding ?? 12;
  const tooltipFontSize = tooltipConfig.fontSize ?? 12;
  const tooltipFontFamily = tooltipConfig.fontFamily || "Inter, system-ui, sans-serif";
  
  // Animation
  const animationConfig = styleConfig.animation || {};
  const animationEnabled = animationConfig.enabled ?? true;
  const animationDuration = animationConfig.duration ?? 750;
  
  // Backward compatibility
  const transparentBackground = backgroundOpacity < 1;
  const smoothCurves = lineTension > 0;

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
      <PremiumWidgetContainer 
        style={styleConfig} 
        className={cn(
          "h-full w-full",
          transparentBackground && "bg-transparent backdrop-blur-none"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "h-full",
            transparentBackground && "bg-transparent"
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent 
              data={processedData} 
              margin={{ 
                top: padding.top + (legendPosition === "top" ? 20 : 0),
                right: padding.right + (legendPosition === "right" ? 80 : 0),
                bottom: padding.bottom + (legendPosition === "bottom" ? 20 : 0),
                left: padding.left + (legendPosition === "left" ? 80 : 0),
              }}
            >
              {showGrid && chartType !== "pie" && chartType !== "radar" && (
                <CartesianGrid 
                  strokeDasharray={gridDashPattern}
                  stroke={gridColor}
                  strokeWidth={gridLineWidth}
                  vertical={false}
                />
              )}
              
              {chartType === "radar" ? (
                <>
                  <PolarGrid stroke={gridColor} strokeWidth={gridLineWidth} />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={{ 
                      fontSize: xAxisFontSize, 
                      fill: xAxisColor,
                      fontWeight: xAxisFontWeight,
                      fontFamily: xAxisFontFamily
                    }}
                  />
                  <PolarRadiusAxis 
                    tick={{ 
                      fontSize: yAxisFontSize, 
                      fill: yAxisColor,
                      fontWeight: yAxisFontWeight,
                      fontFamily: yAxisFontFamily
                    }}
                    stroke={gridColor}
                  />
                </>
              ) : chartType !== "pie" && (
                <>
                  {showXAxis && (
                    <XAxis 
                      dataKey="name" 
                      angle={xAxisRotation}
                      tick={{ 
                        fontSize: xAxisFontSize, 
                        fill: xAxisColor,
                        fontWeight: xAxisFontWeight,
                        fontFamily: xAxisFontFamily
                      }}
                      tickLine={{ stroke: gridColor, strokeWidth: gridLineWidth }}
                      axisLine={{ stroke: gridColor, strokeWidth: gridLineWidth }}
                      tickMargin={8}
                    />
                  )}
                  {showYAxis && (
                    <YAxis 
                      tick={{ 
                        fontSize: yAxisFontSize, 
                        fill: yAxisColor,
                        fontWeight: yAxisFontWeight,
                        fontFamily: yAxisFontFamily
                      }}
                      tickLine={{ stroke: gridColor, strokeWidth: gridLineWidth }}
                      axisLine={{ stroke: gridColor, strokeWidth: gridLineWidth }}
                      tickMargin={8}
                    />
                  )}
                </>
              )}
              
              {showTooltip && (
                <Tooltip 
                  contentStyle={{
                    backgroundColor: tooltipBgColor,
                    border: `${tooltipBorderWidth}px solid ${tooltipBorderColor}`,
                    borderRadius: `${tooltipBorderRadius}px`,
                    fontFamily: tooltipFontFamily,
                    fontSize: `${tooltipFontSize}px`,
                    color: tooltipBodyColor,
                    padding: `${tooltipPadding}px`
                  }}
                  labelStyle={{
                    color: tooltipTitleColor,
                    fontSize: `${tooltipFontSize + 1}px`,
                    fontWeight: "600",
                    marginBottom: "4px"
                  }}
                  cursor={{ fill: gridColor, opacity: 0.1 }}
                  animationDuration={animationEnabled ? animationDuration / 2 : 0}
                />
              )}
              
              {showLegend && dataKeys.length > 1 && (
                <Legend 
                  verticalAlign={legendPosition === "top" || legendPosition === "bottom" ? legendPosition : "middle"}
                  align={legendAlign === "start" ? "left" : legendAlign === "end" ? "right" : "center"}
                  layout={legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal"}
                  wrapperStyle={{
                    fontFamily: legendFontFamily,
                    fontSize: `${legendFontSize}px`,
                    fontWeight: legendFontWeight,
                    color: legendColor,
                    padding: `${legendConfig.padding ?? 10}px`
                  }}
                  iconType="circle"
                  iconSize={legendConfig.boxHeight ?? 12}
                />
              )}
              
              {/* Render chart elements based on type */}
              {chartType === "area" && dataKeys.map((dataKey: any, index: number) => (
                <Area
                  key={dataKey.key}
                  type={smoothCurves ? "natural" : "monotone"}
                  dataKey={dataKey.key}
                  stroke={dataKey.color}
                  fill={dataKey.color}
                  fillOpacity={lineGradient.enabled ? lineGradient.startOpacity : 0.6}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  name={dataKey.name}
                  animationDuration={animationEnabled ? animationDuration : 0}
                />
              ))}
              
              {chartType === "bar" && dataKeys.map((dataKey: any, index: number) => (
                <Bar
                  key={dataKey.key}
                  dataKey={dataKey.key}
                  fill={dataKey.color}
                  name={dataKey.name}
                  radius={[barBorderRadius, barBorderRadius, 0, 0]}
                  maxBarSize={barMaxThickness}
                  stroke={barBorderColor}
                  strokeWidth={barBorderWidth}
                  animationDuration={animationEnabled ? animationDuration : 0}
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
                  type={smoothCurves ? "natural" : "monotone"}
                  dataKey={dataKey.key}
                  stroke={dataKey.color}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  strokeDasharray={lineStyle === "dashed" ? "5 5" : lineStyle === "dotted" ? "2 2" : undefined}
                  dot={showPoints ? { 
                    r: pointRadius,
                    fill: pointBorderColor,
                    stroke: dataKey.color,
                    strokeWidth: pointBorderWidth
                  } : false}
                  activeDot={{ 
                    r: pointHoverRadius, 
                    fill: pointBorderColor, 
                    stroke: dataKey.color, 
                    strokeWidth: pointBorderWidth,
                    filter: `drop-shadow(0 2px 4px ${dataKey.color}40)`
                  }}
                  name={dataKey.name}
                  animationDuration={animationEnabled ? animationDuration : 0}
                />
              ))}
            </ChartComponent>
          </ResponsiveContainer>
        </motion.div>
      </PremiumWidgetContainer>
    </BaseWidget>
  );
};
