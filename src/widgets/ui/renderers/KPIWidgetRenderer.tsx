"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { KPIWidgetProcessor } from "@/widgets/processors/KPIWidgetProcessor";
import { TrendingUp, TrendingDown, Target, CheckCircle, XCircle, Minus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BaseWidget } from "../components/BaseWidget";
import { useApp } from "@/contexts/AppContext";

interface KPIWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
}

export const KPIWidgetRenderer: React.FC<KPIWidgetRendererProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
  isEditMode = false,
  isSelected = false,
}) => {
  const config = widget.config as any;
  const { token, tenant } = useApp();
  const [realData, setRealData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch ALL data from API when widget is configured (not paginated)
  useEffect(() => {
    const fetchData = async () => {
      if (!config.data?.databaseId || !config.data?.tableId || !token || !tenant?.id) {
        return;
      }

      setIsLoadingData(true);
      try {
        // Fetch ALL rows by using a large pageSize
        const response = await fetch(
          `/api/tenants/${tenant.id}/databases/${config.data.databaseId}/tables/${config.data.tableId}/rows?pageSize=10000&page=1&includeCells=true`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log(`📊 [KPI Widget] Fetched ${result.data?.length || 0} rows for aggregation`);
          setRealData(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching KPI data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [
    config.data?.databaseId, 
    config.data?.tableId, 
    token, 
    tenant?.id,
    // Re-fetch when filters or aggregations change
    JSON.stringify(config.data?.filters),
    JSON.stringify(config.data?.metric?.aggregations),
  ]);

  const formatValue = (value: number, format: string): string => {
    // Check if value is integer (no decimals) for quantity-like fields
    const isInteger = Number.isInteger(value);
    
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value);
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "decimal":
        return value.toFixed(2);
      case "number":
      default:
        // For integers (quantity, count, etc.) - NO commas, just the number
        if (isInteger) {
          return value.toString();
        }
        // For decimals - use locale formatting
        return new Intl.NumberFormat("en-US").format(value);
    }
  };

  const formatDisplayValue = (value: string | number, format?: string): string => {
    if (format === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }
    if (format === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    if (format === 'number' && typeof value === 'number') {
      return new Intl.NumberFormat("en-US").format(value);
    }
    return String(value || '');
  };

  // Single metric display - MUST be before any return statements (Rules of Hooks)
  const metric = config.data?.metric;
  const processedKPI = useMemo(() => {
    if (!metric) {
      return {
        metric: '',
        label: '',
        value: 0,
        aggregation: 'sum',
        format: 'number',
        trend: undefined,
        comparison: undefined,
      };
    }

    // Use real data if available, otherwise return 0 with proper structure
    if (realData.length === 0) {
      return {
        metric: metric.field,
        label: metric.label,
        value: 0,
        aggregation: metric.aggregations?.[0]?.function || 'sum',
        format: metric.format || 'number',
        trend: undefined,
        comparison: undefined,
      };
    }

    const kpiConfig = {
      dataSource: {
        databaseId: config.data.databaseId || 0,
        tableId: config.data.tableId || "",
      },
      metric,
      filters: config.data.filters || [],
    };

    return KPIWidgetProcessor.process(realData, kpiConfig);
  }, [
    config.data?.databaseId, 
    config.data?.tableId, 
    metric?.field,
    metric?.groupBy,  // ✅ Added groupBy to dependencies
    metric?.label,
    metric?.format,
    metric?.showTrend,
    metric?.showComparison,
    metric?.target,
    // ✅ FIX: Serialize aggregations to detect function changes
    JSON.stringify(metric?.aggregations),
    JSON.stringify(config.data?.filters),
    realData,
  ]);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getComparisonIcon = (status: string) => {
    switch (status) {
      case "above":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "below":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  // Extract ADVANCED styling from schema
  const styleConfig = config.style || {};
  
  // Card styling
  const backgroundColor = styleConfig.backgroundColor || "#FFFFFF";
  const bgGradient = styleConfig.backgroundGradient || { enabled: false, from: "#FFFFFF", to: "#F3F4F6", direction: "to-br" };
  const borderRadius = styleConfig.borderRadius ?? 12;
  const border = styleConfig.border || { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" };
  const shadow = styleConfig.shadow || { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.1)" };
  const padding = styleConfig.padding || { x: 24, y: 20 };
  
  // Value styling
  const valueStyleConfig = styleConfig.value || {};
  const valueFontSize = valueStyleConfig.fontSize ?? 36;
  const valueFontFamily = valueStyleConfig.fontFamily || "Inter, system-ui, sans-serif";
  const valueFontWeight = valueStyleConfig.fontWeight || "700";
  const valueColor = valueStyleConfig.color || "#111827";
  const valueGradient = valueStyleConfig.gradient || { enabled: false, from: "#3B82F6", to: "#8B5CF6" };
  
  // Label styling
  const labelStyleConfig = styleConfig.label || {};
  const labelFontSize = labelStyleConfig.fontSize ?? 14;
  const labelFontFamily = labelStyleConfig.fontFamily || "Inter, system-ui, sans-serif";
  const labelFontWeight = labelStyleConfig.fontWeight || "500";
  const labelColor = labelStyleConfig.color || "#6B7280";
  const labelTextTransform = labelStyleConfig.textTransform || "none";
  const labelLetterSpacing = labelStyleConfig.letterSpacing ?? 0;
  
  // Trend styling
  const trendStyleConfig = styleConfig.trend || {};
  const trendPositive = trendStyleConfig.positive || { color: "#10B981", backgroundColor: "rgba(16, 185, 129, 0.1)", iconSize: 16 };
  const trendNegative = trendStyleConfig.negative || { color: "#EF4444", backgroundColor: "rgba(239, 68, 68, 0.1)", iconSize: 16 };
  const trendFontSize = trendStyleConfig.fontSize ?? 12;
  const trendFontWeight = trendStyleConfig.fontWeight || "600";
  const trendShowIcon = trendStyleConfig.showIcon ?? true;
  
  // Hover & Animation
  const hoverStyleConfig = styleConfig.hover || { enabled: true, scale: 1.02, shadow: true, transition: 200 };
  const animationConfig = styleConfig.animation || { enabled: true, duration: 500, delay: 0 };
  
  // Shadow class mapping
  const getShadowClass = (size: string) => {
    const shadowMap: Record<string, string> = {
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg",
      xl: "shadow-xl"
    };
    return shadowMap[size] || "shadow-sm";
  };

  // Empty state content
  if (!config.data?.metric || !config.data?.metric?.field) {
    return (
      <BaseWidget
        title={widget.title}
        widgetType="KPI"
        widgetId={widget.id}
        isEditMode={isEditMode}
        isSelected={isSelected}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
      >
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No KPI metric configured</p>
            <p className="text-sm mt-1">Click edit to configure your KPI</p>
          </div>
        </div>
      </BaseWidget>
    );
  }

  // Generate card styles
  const cardStyle: React.CSSProperties = {
    background: bgGradient.enabled 
      ? `linear-gradient(${bgGradient.direction}, ${bgGradient.from}, ${bgGradient.to})`
      : backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: border.enabled ? `${border.width}px ${border.style} ${border.color}` : 'none',
    padding: `${padding.y}px ${padding.x}px`,
    transition: hoverStyleConfig.enabled ? `all ${hoverStyleConfig.transition}ms ease` : undefined,
  };

  // Value text style
  const valueTextStyle: React.CSSProperties = {
    fontSize: `${valueFontSize}px`,
    fontFamily: valueFontFamily,
    fontWeight: valueFontWeight,
    color: valueGradient.enabled ? 'transparent' : valueColor,
    background: valueGradient.enabled 
      ? `linear-gradient(to right, ${valueGradient.from}, ${valueGradient.to})`
      : undefined,
    backgroundClip: valueGradient.enabled ? 'text' : undefined,
    WebkitBackgroundClip: valueGradient.enabled ? 'text' : undefined,
  };

  // Label text style
  const labelTextStyle: React.CSSProperties = {
    fontSize: `${labelFontSize}px`,
    fontFamily: labelFontFamily,
    fontWeight: labelFontWeight,
    color: labelColor,
    textTransform: labelTextTransform as any,
    letterSpacing: `${labelLetterSpacing}px`,
  };

  return (
    <BaseWidget
      title={widget.title}
      widgetType="KPI"
      widgetId={widget.id}
      isEditMode={isEditMode}
      isSelected={isSelected}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <motion.div
        initial={animationConfig.enabled ? { opacity: 0, scale: 0.95 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: animationConfig.duration / 1000, 
          delay: animationConfig.delay / 1000 
        }}
        whileHover={hoverStyleConfig.enabled ? { 
          scale: hoverStyleConfig.scale,
          boxShadow: hoverStyleConfig.shadow ? "0 10px 30px rgba(0, 0, 0, 0.15)" : undefined
        } : undefined}
        className="h-full"
      >
        <Card 
          className={cn(
            "h-full border-0",
            shadow.enabled && getShadowClass(shadow.size)
          )}
          style={cardStyle}
        >
          <CardContent className="p-0" style={{ padding: 0 }}>
          {isLoadingData ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p className="text-sm">Loading data...</p>
              </div>
            </div>
          ) : (
          <div className="space-y-6">
            {/* Aggregation Pipeline - Shows chained functions */}
            {metric.aggregations && metric.aggregations.length > 1 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Pipeline:</span>
                {metric.aggregations.map((agg: { function: string; label?: string }, idx: number) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span>→</span>}
                    <Badge variant="outline" className="text-xs">
                      {agg.label || agg.function.toUpperCase()}
                    </Badge>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Main Value */}
            <div className="text-center space-y-3">
              <div style={valueTextStyle}>
                {processedKPI.displayValue !== undefined && metric.displayColumn
                  ? formatDisplayValue(processedKPI.displayValue, metric.displayFormat)
                  : formatValue(processedKPI.value, metric.format)}
              </div>
              
              <p style={labelTextStyle}>
                {metric.displayColumn && processedKPI.displayValue !== undefined 
                  ? metric.displayColumn 
                  : (metric.label || metric.field)}
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/50">
              {/* Trend */}
              {metric.showTrend && processedKPI.trend && (
                <div className="flex items-center gap-2">
                  {trendShowIcon && (
                    <div 
                      className="rounded-full p-1.5"
                      style={{
                        backgroundColor: processedKPI.trend.direction === "up" 
                          ? trendPositive.backgroundColor 
                          : processedKPI.trend.direction === "down"
                          ? trendNegative.backgroundColor
                          : "rgba(0, 0, 0, 0.05)"
                      }}
                    >
                      {processedKPI.trend.direction === "up" 
                        ? <TrendingUp style={{ width: `${trendPositive.iconSize}px`, height: `${trendPositive.iconSize}px`, color: trendPositive.color }} /> 
                        : processedKPI.trend.direction === "down"
                        ? <TrendingDown style={{ width: `${trendNegative.iconSize}px`, height: `${trendNegative.iconSize}px`, color: trendNegative.color }} />
                        : <Minus style={{ width: `16px`, height: `16px`, color: "#6B7280" }} />
                      }
                    </div>
                  )}
                  <span 
                    style={{
                      fontSize: `${trendFontSize}px`,
                      fontWeight: trendFontWeight,
                      color: processedKPI.trend.direction === "up" 
                        ? trendPositive.color 
                        : processedKPI.trend.direction === "down"
                        ? trendNegative.color
                        : "#6B7280"
                    }}
                  >
                    {processedKPI.trend.direction === "up" ? "+" : processedKPI.trend.direction === "down" ? "-" : ""}
                    {processedKPI.trend.percentage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs previous
                  </span>
                </div>
              )}

              {/* Comparison */}
              {metric.showComparison && processedKPI.comparison && (
                <div className="flex items-center gap-2">
                  {getComparisonIcon(processedKPI.comparison.status)}
                  <span 
                    className={cn(
                      "text-sm font-semibold",
                      processedKPI.comparison.status === "above" ? "text-green-600 dark:text-green-400" : "",
                      processedKPI.comparison.status === "below" ? "text-red-600 dark:text-red-400" : "",
                      processedKPI.comparison.status === "on-target" ? "text-blue-600 dark:text-blue-400" : ""
                    )}
                  >
                    {processedKPI.comparison.status === "above" ? "Above" : 
                     processedKPI.comparison.status === "below" ? "Below" : "On"} target
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (target: {formatValue(processedKPI.comparison.target, metric.format)})
                  </span>
                </div>
              )}
            </div>
          </div>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </BaseWidget>
  );
};
