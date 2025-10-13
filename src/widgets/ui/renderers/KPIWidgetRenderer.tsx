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
  const [snapshotUpdateNeeded, setSnapshotUpdateNeeded] = useState(false);
  const hasAutoUpdatedRef = React.useRef(false); // Prevent multiple auto-updates

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
            headers: { 
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            cache: 'no-store',
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log(`📊 [KPI Widget] Fetched ${result.data?.length || 0} rows for aggregation`);
          setRealData(result.data || []);

          // Check if auto-snapshot update is needed
          if (metric?.showTrend && metric?.autoSnapshotFrequency && metric?.autoSnapshotFrequency !== 'manual') {
            const shouldUpdate = KPIWidgetProcessor.shouldUpdateSnapshot(
              metric.previousSnapshot,
              metric.autoSnapshotFrequency
            );
            setSnapshotUpdateNeeded(shouldUpdate);

            // Auto-update snapshot if needed and not already done
            if (shouldUpdate && !hasAutoUpdatedRef.current && onEdit) {
              console.log('📸 [KPI Widget] Auto-updating snapshot...');
              hasAutoUpdatedRef.current = true; // Mark as updated to prevent loops

              // Process the data to get current value
              const kpiConfig = {
                dataSource: {
                  databaseId: config.data.databaseId || 0,
                  tableId: config.data.tableId || "",
                },
                metric,
                filters: config.data.filters || [],
              };

              const kpiResult = KPIWidgetProcessor.process(result.data, kpiConfig);

              // Create new auto-snapshot
              const newSnapshot = {
                value: kpiResult.value,
                timestamp: new Date().toISOString(),
                label: KPIWidgetProcessor.generateSnapshotLabel(metric.autoSnapshotFrequency),
                isAuto: true,
                frequency: metric.autoSnapshotFrequency,
              };

              // Update widget config with new snapshot
              const updatedConfig = {
                ...config,
                data: {
                  ...config.data,
                  metric: {
                    ...metric,
                    previousSnapshot: newSnapshot,
                  },
                },
              };

              // Note: We'd need a way to update the widget config here
              // For now, just log it - the user can manually update via editor
              console.log('📸 [KPI Widget] New auto-snapshot ready:', newSnapshot);
              console.log('📸 [KPI Widget] User should save widget to persist auto-snapshot');
            }
          }
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
    metric?.showTrend,
    metric?.autoSnapshotFrequency,
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

  const formatDisplayValue = (value: string | number | null, format?: string): string => {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
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

    const result = KPIWidgetProcessor.process(realData, kpiConfig);
    
    // Debug log for displayValue
    if (metric.displayColumn) {
      console.log(`🎨 [KPI Renderer] Received result:`, {
        value: result.value,
        displayValue: result.displayValue,
        displayColumn: metric.displayColumn,
        hasResultRow: !!result.resultRow
      });
    }
    
    return result;
  }, [
    config.data?.databaseId, 
    config.data?.tableId, 
    metric?.field,
    metric?.groupBy,  // ✅ Added groupBy to dependencies
    metric?.displayColumn,  // ✅ Added displayColumn to dependencies
    metric?.displayFormat,  // ✅ Added displayFormat to dependencies
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
  const paddingConfig = styleConfig.padding || { x: 24, y: 20 };
  
  // Value styling - Extract value config first to avoid TDZ
  const valueConfigFromStyle = styleConfig.value;
  const kpiValueStyleConfig = valueConfigFromStyle || {};
  const valueFontSize = kpiValueStyleConfig.fontSize ?? 36;
  const valueFontFamily = kpiValueStyleConfig.fontFamily || "Inter, system-ui, sans-serif";
  const valueFontWeight = kpiValueStyleConfig.fontWeight || "700";
  const valueColor = kpiValueStyleConfig.color || "#111827";
  const valueGradient = kpiValueStyleConfig.gradient || { enabled: false, from: "#3B82F6", to: "#8B5CF6" };
  
  // Label styling - Extract label config first to avoid TDZ
  const labelConfigFromStyle = styleConfig.label;
  const kpiLabelStyleConfig = labelConfigFromStyle || {};
  const labelFontSize = kpiLabelStyleConfig.fontSize ?? 14;
  const labelFontFamily = kpiLabelStyleConfig.fontFamily || "Inter, system-ui, sans-serif";
  const labelFontWeight = kpiLabelStyleConfig.fontWeight || "500";
  const labelColor = kpiLabelStyleConfig.color || "#6B7280";
  const labelTextTransform = kpiLabelStyleConfig.textTransform || "none";
  const labelLetterSpacing = kpiLabelStyleConfig.letterSpacing ?? 0;
  
  // Trend styling - Extract trend config first to avoid TDZ
  const trendConfigFromStyle = styleConfig.trend;
  const trendStyleConfig = trendConfigFromStyle || {};
  const trendPositiveConfig = trendStyleConfig.positive;
  const trendNegativeConfig = trendStyleConfig.negative;
  const trendPositive = trendPositiveConfig || { color: "#10B981", backgroundColor: "rgba(16, 185, 129, 0.1)", iconSize: 16 };
  const trendNegative = trendNegativeConfig || { color: "#EF4444", backgroundColor: "rgba(239, 68, 68, 0.1)", iconSize: 16 };
  const trendFontSize = trendStyleConfig.fontSize ?? 12;
  const trendFontWeight = trendStyleConfig.fontWeight || "600";
  const trendShowIcon = trendStyleConfig.showIcon ?? true;
  
  // Hover & Animation - Extract configs first to avoid TDZ
  const hoverConfigFromStyle = styleConfig.hover;
  const hoverStyleConfig = hoverConfigFromStyle || { enabled: true, scale: 1.02, shadow: true, transition: 200 };
  const animationConfigFromStyle = styleConfig.animation;
  const animationConfig = animationConfigFromStyle || { enabled: true, duration: 500, delay: 0 };
  
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
  const paddingY = paddingConfig?.y || 20;
  const paddingX = paddingConfig?.x || 24;
  const cardStyle: React.CSSProperties = {
    background: bgGradient?.enabled 
      ? `linear-gradient(${bgGradient.direction}, ${bgGradient.from}, ${bgGradient.to})` 
      : backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: border?.enabled ? `${border.width}px ${border.style} ${border.color}` : 'none',
    padding: `${paddingY}px ${paddingX}px`,
    transition: hoverStyleConfig?.enabled ? `all ${hoverStyleConfig.transition}ms ease` : undefined,
  };

  // Value text style
  const valueTextStyle: React.CSSProperties = {
    fontSize: `${valueFontSize}px`,
    fontFamily: valueFontFamily,
    fontWeight: valueFontWeight,
    color: valueGradient?.enabled ? 'transparent' : valueColor,
    background: valueGradient?.enabled 
      ? `linear-gradient(to right, ${valueGradient.from}, ${valueGradient.to})`
      : undefined,
    backgroundClip: valueGradient?.enabled ? 'text' : undefined,
    WebkitBackgroundClip: valueGradient?.enabled ? 'text' : undefined,
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
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.25, 0.1, 0.25, 1.0] // Smooth easing
        }}
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        className="h-full"
      >
        <Card 
          className={cn(
            "h-full border border-border/40 bg-card transition-all duration-300",
            "hover:shadow-lg hover:border-border/60",
            "shadow-sm"
          )}
          style={{
            background: bgGradient?.enabled 
              ? `linear-gradient(${bgGradient.direction}, ${bgGradient.from}, ${bgGradient.to})` 
              : undefined,
            borderRadius: `${borderRadius}px`,
          }}
        >
          <CardContent className="p-6">
          {isLoadingData ? (
            <div className="flex items-center justify-center h-full min-h-[160px]">
              <div className="text-center">
                <Loader2 className="h-7 w-7 mx-auto mb-3 animate-spin text-primary/60" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            {/* Aggregation Pipeline - Shows chained functions */}
            {metric.aggregations && metric.aggregations.length > 1 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
                <span className="font-medium opacity-70">Pipeline:</span>
                {metric.aggregations.map((agg: { function: string; label?: string }, idx: number) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="opacity-40">→</span>}
                    <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0.5 bg-background/50">
                      {agg.label || agg.function.toUpperCase()}
                    </Badge>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Label (moved to top) */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {metric.displayColumn && (processedKPI as any).displayValue !== undefined 
                  ? metric.displayColumn 
                  : (metric.label || metric.field)}
              </p>
            </div>

            {/* Main Value */}
            <div className="space-y-1">
              <div className="text-3xl font-bold text-foreground leading-none tracking-tight">
                {(processedKPI as any).displayValue !== undefined && metric.displayColumn
                  ? formatDisplayValue((processedKPI as any).displayValue, metric.displayFormat)
                  : formatValue(processedKPI.value, metric.format)}
              </div>
            </div>

            {/* Stats Row - Compact and clean */}
            {(metric.showTrend && processedKPI.trend) || (metric.showComparison && processedKPI.comparison) ? (
              <div className="flex items-center gap-4 pt-3">
                {/* Trend */}
                {metric.showTrend && processedKPI.trend && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="flex items-center gap-1.5"
                  >
                    <div 
                      className={cn(
                        "rounded-md p-1",
                        processedKPI.trend.direction === "up" && "bg-green-50 dark:bg-green-950/30",
                        processedKPI.trend.direction === "down" && "bg-red-50 dark:bg-red-950/30",
                        processedKPI.trend.direction === "stable" && "bg-gray-50 dark:bg-gray-900/30"
                      )}
                    >
                      {processedKPI.trend.direction === "up" 
                        ? <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /> 
                        : processedKPI.trend.direction === "down"
                        ? <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        : <Minus className="h-3.5 w-3.5 text-gray-500" />
                      }
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span 
                        className={cn(
                          "text-sm font-semibold",
                          processedKPI.trend.direction === "up" && "text-green-600 dark:text-green-400",
                          processedKPI.trend.direction === "down" && "text-red-600 dark:text-red-400",
                          processedKPI.trend.direction === "stable" && "text-gray-500"
                        )}
                      >
                        {processedKPI.trend.direction === "up" ? "+" : processedKPI.trend.direction === "down" ? "-" : ""}
                        {processedKPI.trend.percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {processedKPI.trend.comparisonType === 'snapshot' && processedKPI.trend.previousTimestamp
                          ? `vs ${new Date(processedKPI.trend.previousTimestamp).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })}`
                          : 'vs prev'}
                        {snapshotUpdateNeeded && metric?.previousSnapshot?.isAuto && (
                          <span className="ml-1 text-orange-500" title="Snapshot-ul automat este vechi și va fi actualizat">⚠️</span>
                        )}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Comparison */}
                {metric.showComparison && processedKPI.comparison && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="flex items-center gap-1.5"
                  >
                    <div 
                      className={cn(
                        "rounded-md p-1",
                        processedKPI.comparison.status === "above" && "bg-green-50 dark:bg-green-950/30",
                        processedKPI.comparison.status === "below" && "bg-red-50 dark:bg-red-950/30",
                        processedKPI.comparison.status === "on-target" && "bg-blue-50 dark:bg-blue-950/30"
                      )}
                    >
                      {processedKPI.comparison.status === "above" 
                        ? <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        : processedKPI.comparison.status === "below"
                        ? <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        : <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      }
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Target: {formatValue(processedKPI.comparison.target, metric.format)}
                    </span>
                  </motion.div>
                )}
              </div>
            ) : null}
          </div>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </BaseWidget>
  );
};
