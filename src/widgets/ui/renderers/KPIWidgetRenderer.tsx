"use client";

import React, { useMemo, useState, useEffect } from "react";
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

  // Fetch real data from API when widget is configured
  useEffect(() => {
    const fetchData = async () => {
      if (!config.data?.databaseId || !config.data?.tableId || !token || !tenant?.id) {
        return;
      }

      setIsLoadingData(true);
      try {
        const response = await fetch(
          `/api/tenants/${tenant.id}/databases/${config.data.databaseId}/tables/${config.data.tableId}/rows`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const result = await response.json();
          setRealData(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching KPI data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [config.data?.databaseId, config.data?.tableId, token, tenant?.id]);

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
    metric?.label,
    metric?.format,
    metric?.showTrend,
    metric?.showComparison,
    metric?.target,
    metric?.aggregations?.length,
    config.data?.filters?.length,
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
      <Card 
        className="h-full border-0 shadow-none"
        style={{
          backgroundColor: config.style?.backgroundColor || "transparent",
          color: config.style?.textColor || "inherit",
        }}
      >
        <CardContent className="p-6">
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
              <div 
                className={cn(
                  "font-bold text-foreground",
                  config.style?.valueSize === "sm" ? "text-3xl" : "",
                  config.style?.valueSize === "md" ? "text-4xl" : "",
                  config.style?.valueSize === "lg" ? "text-5xl" : "",
                  config.style?.valueSize === "xl" ? "text-6xl" : "",
                  config.style?.valueSize === "2xl" ? "text-7xl" : "",
                  config.style?.valueSize === "3xl" ? "text-8xl" : "",
                  !config.style?.valueSize && "text-5xl"
                )}
              >
                {formatValue(processedKPI.value, metric.format)}
              </div>
              
              <p 
                className={cn(
                  "font-medium text-muted-foreground",
                  config.style?.labelSize === "xs" ? "text-xs" : "",
                  config.style?.labelSize === "sm" ? "text-sm" : "",
                  config.style?.labelSize === "base" ? "text-base" : "",
                  config.style?.labelSize === "lg" ? "text-lg" : "",
                  !config.style?.labelSize && "text-sm"
                )}
              >
                {metric.label || metric.field}
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/50">
              {/* Trend */}
              {metric.showTrend && processedKPI.trend && (
                <div className="flex items-center gap-2">
                  {getTrendIcon(processedKPI.trend.direction)}
                  <span 
                    className={cn(
                      "text-sm font-semibold",
                      processedKPI.trend.direction === "up" ? "text-green-600 dark:text-green-400" : "",
                      processedKPI.trend.direction === "down" ? "text-red-600 dark:text-red-400" : "",
                      processedKPI.trend.direction === "stable" ? "text-muted-foreground" : ""
                    )}
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
    </BaseWidget>
  );
};
