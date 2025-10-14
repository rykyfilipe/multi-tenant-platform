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

const ChartWidgetRendererComponent: React.FC<ChartWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false
}) => {
  // Extract chart configuration
  const config = widget.config as any;
  const chartType = config?.settings?.chartType || "bar";
  
  // OPTIMISTIC: Log only when actual config changes (not version bumps from style changes)
  React.useEffect(() => {
    console.log('📊 [ChartWidget] Config updated:', {
      widgetId: widget.id,
      version: widget.version,
      chartType,
      theme: config?.style?.theme
    });
  }, [
    widget.id, 
    JSON.stringify(config?.data), // Only data changes
    JSON.stringify(config?.settings), // Only settings changes
    chartType
  ]);
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
  
  // Premium color palette for data visualization (fallback)
  const premiumColors = config?.style?.theme === 'onyx' || config?.style?.theme === 'obsidian'
    ? premiumDataColors.elegant
    : premiumDataColors.professional;

  // OPTIMISTIC: Process data ONLY when data-related config changes (not style!)
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
    const xAxisColumn = mappings.x;
    const chartConfig = {
      dataSource: {
        databaseId: databaseId || 0,
        tableId: tableId || "",
      },
      mappings: {
        x: xAxisColumn,
        y: yColumns,
      },
      processing: {
        yColumnAggregations: yColumnAggregations || undefined,
        dateGrouping: config?.settings?.dateGrouping || { enabled: false, granularity: 'day' },
      },
      filters: filters,
      topN: enableTopN ? {
        enabled: true,
        count: topNCount,
        autoSort: true,
      } : undefined,
    };

    console.log('📊 [ChartWidget] Processing data with config:', chartConfig);
    // Execute the simplified pipeline (auto-groups by X axis when aggregations configured)
    return ChartDataProcessor.process(rawData.data, chartConfig);
  }, [
    // OPTIMISTIC: Only depend on DATA-RELATED properties, NOT style or version
    widget.id,
    rawData,
    JSON.stringify(mappings), // X/Y mappings
    databaseId,
    tableId,
    JSON.stringify(yColumnAggregations), // Aggregations
    JSON.stringify(filters), // Filters
    JSON.stringify(config?.settings?.dateGrouping), // Date grouping
    enableTopN,
    topNCount,
    // REMOVED: widget.version (style changes don't need data reprocessing!)
  ]);

  // OPTIMISTIC: Generate data keys - only recompute when Y columns or colors change
  const dataKeys = useMemo(() => {
    // Soft, professional color palette for data visualization
    const softColors = [
      '#3b82f6', // blue
      '#10b981', // green  
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316', // orange
    ];
    
    if (!processedData.length) return [{ key: "value", name: "Value", color: yColumnColors['value'] || softColors[0] }];
    
    const yColumns = Array.isArray(mappings.y) ? mappings.y : (mappings.y ? [mappings.y] : []);
    
    // Use Y columns from mappings (simplified - no more aggregation columns redundancy)
    if (yColumns.length > 0) {
      return yColumns.map((column: string, index: number) => ({
        key: column,
        name: column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' '),
        // Use custom color if set, otherwise use soft colors
        color: yColumnColors[column] || softColors[index % softColors.length]
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
      return [{ key: "value", name: "Value", color: yColumnColors['value'] || softColors[0] }];
    }
    
    return Array.from(keys).map((key: string, index: number) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      // Use custom color if set, otherwise use soft colors
      color: yColumnColors[key] || softColors[index % softColors.length]
    }));
  }, [
    // OPTIMISTIC: Only Y columns and colors, NOT widget.version
    processedData, 
    JSON.stringify(mappings), 
    JSON.stringify(yColumnColors)
  ]);

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
  const gridDashPattern = gridStyle === "dashed" ? "5 5" : gridStyle === "dotted" ? "2 2" : undefined;
  
  // Axes styling
  const axesConfig = styleConfig.axes || {};
  const xAxisStyleConfig = axesConfig.x || {};
  const yAxisStyleConfig = axesConfig.y || {};
  const showXAxis = xAxisStyleConfig.show ?? true;
  const showYAxis = yAxisStyleConfig.show ?? true;
  const xAxisColor = xAxisStyleConfig.color || "#666666";
  const yAxisColor = yAxisStyleConfig.color || "#666666";
  const xAxisFontSize = xAxisStyleConfig.fontSize ?? 12;
  const yAxisFontSize = yAxisStyleConfig.fontSize ?? 12;
  const xAxisFontFamily = xAxisStyleConfig.fontFamily || "Inter, system-ui, sans-serif";
  const yAxisFontFamily = yAxisStyleConfig.fontFamily || "Inter, system-ui, sans-serif";
  const xAxisFontWeight = xAxisStyleConfig.fontWeight || "400";
  const yAxisFontWeight = yAxisStyleConfig.fontWeight || "400";
  const xAxisRotation = xAxisStyleConfig.rotation ?? 0;
  
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
      <div 
        className={cn(
          "h-full w-full bg-card border border-border/40 rounded-xl",
          "transition-all duration-300 hover:shadow-lg hover:border-border/60",
          "shadow-sm",
          transparentBackground && "bg-transparent backdrop-blur-none border-0"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.25, 0.1, 0.25, 1.0]
          }}
          className={cn(
            "h-full relative overflow-hidden rounded-xl p-4",
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
                  strokeDasharray={gridDashPattern || "3 3"}
                  stroke={gridColor}
                  strokeWidth={gridLineWidth}
                  vertical={false}
                  strokeOpacity={0.1}
                />
              )}
              
              {chartType === "radar" ? (
                <>
                  <PolarGrid stroke={gridColor} strokeWidth={gridLineWidth} />
                  <PolarAngleAxis 
                    dataKey="name"
                    // Hide labels if > 10 items (too crowded), use legend instead
                    tick={processedData.length <= 10 ? { 
                      fontSize: Math.max(xAxisFontSize - 2, 10), // Slightly smaller for radar
                      fill: xAxisColor,
                      fontWeight: xAxisFontWeight,
                      fontFamily: xAxisFontFamily
                    } : false}
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
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '13px',
                    color: 'hsl(var(--foreground))',
                    padding: '10px 12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '6px'
                  }}
                  cursor={{ fill: 'hsl(var(--primary))', opacity: 0.05 }}
                  animationDuration={200}
                />
              )}
              
              {/* Show legend when: multiple series OR pie/radar with many items (labels hidden) */}
              {(showLegend && (
                dataKeys.length > 1 || 
                (chartType === "pie" && processedData.length > 6) ||
                (chartType === "radar" && processedData.length > 10)
              )) && (
                <Legend 
                  verticalAlign={chartType === "pie" || chartType === "radar" ? "middle" : (legendPosition === "top" || legendPosition === "bottom" ? legendPosition : "middle")}
                  align={chartType === "pie" || chartType === "radar" ? "right" : (legendAlign === "start" ? "left" : legendAlign === "end" ? "right" : "center")}
                  layout="vertical"
                  wrapperStyle={{
                    fontFamily: legendFontFamily,
                    fontSize: `${Math.max(legendFontSize - 2, 9)}px`, // Smaller for many items
                    fontWeight: legendFontWeight,
                    color: legendColor,
                    padding: `${legendConfig.padding ?? 8}px`,
                    maxHeight: chartType === "pie" || chartType === "radar" ? '250px' : 'auto',
                    overflowY: chartType === "pie" || chartType === "radar" ? 'auto' : 'visible',
                    paddingRight: '10px'
                  }}
                  iconType="circle"
                  iconSize={legendConfig.boxHeight ?? 8}
                />
              )}
              
              {/* Render chart elements based on type */}
              {chartType === "area" && dataKeys.map((dataKey: any, index: number) => (
                <Area
                  key={dataKey.key}
                  type="monotone"
                  dataKey={dataKey.key}
                  stroke={dataKey.color}
                  fill={`url(#gradient-${index})`}
                  fillOpacity={1}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  name={dataKey.name}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                />
              ))}
              
              {chartType === "bar" && dataKeys.map((dataKey: any, index: number) => (
                <Bar
                  key={dataKey.key}
                  dataKey={dataKey.key}
                  fill={dataKey.color}
                  name={dataKey.name}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                  stroke="none"
                  strokeWidth={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
              
              {chartType === "pie" && (
                <Pie
                  data={processedData}
                  dataKey={dataKeys[0]?.key || "value"}
                  nameKey="name"
                  cx={processedData.length > 6 ? "40%" : "50%"} // Shift left if legend on right
                  cy="50%"
                  outerRadius={processedData.length > 15 ? 80 : 100} // Smaller if many slices
                  innerRadius={processedData.length > 15 ? 50 : 60}
                  paddingAngle={processedData.length > 15 ? 1 : 3} // Less padding for many slices
                  // Only show labels if <= 6 slices (otherwise too crowded)
                  label={processedData.length <= 6 ? ({ name, percent }: any) => {
                    // Only show label if percentage > 5%
                    return percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '';
                  } : false}
                  labelLine={processedData.length <= 6 ? {
                    stroke: 'hsl(var(--muted-foreground))',
                    strokeWidth: 1
                  } : false}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {processedData.map((entry, index) => {
                    const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={pieColors[index % pieColors.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={processedData.length > 15 ? 2 : 3} // Thinner stroke for many slices
                      />
                    );
                  })}
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
                  strokeDasharray={lineStyle === "dashed" ? "5 5" : lineStyle === "dotted" ? "2 2" : undefined}
                  dot={{ 
                    r: 4,
                    fill: 'hsl(var(--background))',
                    stroke: dataKey.color,
                    strokeWidth: 2.5
                  }}
                  activeDot={{ 
                    r: 6, 
                    fill: dataKey.color, 
                    stroke: 'hsl(var(--background))', 
                    strokeWidth: 3,
                    filter: `drop-shadow(0 2px 6px ${dataKey.color}60)`
                  }}
                  name={dataKey.name}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
              {/* Gradient definitions for area charts */}
              {chartType === "area" && (
                <defs>
                  {dataKeys.map((dataKey: any, index: number) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={dataKey.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={dataKey.color} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </BaseWidget>
  );
};

// OPTIMISTIC RENDERING: Only re-render when DATA or SETTINGS change, NOT style
export const ChartWidgetRenderer = React.memo(
  ChartWidgetRendererComponent,
  (prevProps, nextProps) => {
    // Custom comparison - re-render ONLY when necessary
    const prevConfig = prevProps.widget.config as any;
    const nextConfig = nextProps.widget.config as any;
    
    // Always re-render if widget ID changed
    if (prevProps.widget.id !== nextProps.widget.id) {
      console.log('🔄 [ChartWidget] Re-render: widget ID changed');
      return false;
    }
    
    // Re-render if data config changed
    if (JSON.stringify(prevConfig?.data) !== JSON.stringify(nextConfig?.data)) {
      console.log('🔄 [ChartWidget] Re-render: data config changed');
      return false;
    }
    
    // Re-render if settings changed (except style-only changes)
    const prevSettings = { ...prevConfig?.settings };
    const nextSettings = { ...nextConfig?.settings };
    
    if (JSON.stringify(prevSettings) !== JSON.stringify(nextSettings)) {
      console.log('🔄 [ChartWidget] Re-render: settings changed');
      return false;
    }
    
    // Re-render if edit mode changed
    if (prevProps.isEditMode !== nextProps.isEditMode) {
      console.log('🔄 [ChartWidget] Re-render: edit mode changed');
      return false;
    }
    
    // Style-only changes? Don't re-render data processing!
    if (JSON.stringify(prevConfig?.style) !== JSON.stringify(nextConfig?.style)) {
      console.log('✨ [ChartWidget] Style-only change - optimistic re-render');
      // Allow style to update but skip data reprocessing
      return false; // Re-render but useMemo won't recompute processedData
    }
    
    // Props are equal - skip re-render
    console.log('⚡ [ChartWidget] Props equal - SKIP re-render');
    return true;
  }
);
