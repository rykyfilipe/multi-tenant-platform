"use client";

import React, { useMemo } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { KPIWidgetProcessor } from "@/widgets/processors/KPIWidgetProcessor";
import { TrendingUp, TrendingDown, Target, CheckCircle, XCircle, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KPIWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const KPIWidgetRenderer: React.FC<KPIWidgetRendererProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const config = widget.config as any;

  // Mock data for demonstration
  const mockData = useMemo(() => {
    return [
      {
        cells: [
          { column: { name: "revenue" }, value: 125000 },
          { column: { name: "profit" }, value: 25000 },
          { column: { name: "orders" }, value: 150 },
        ]
      },
      {
        cells: [
          { column: { name: "revenue" }, value: 98000 },
          { column: { name: "profit" }, value: 18000 },
          { column: { name: "orders" }, value: 120 },
        ]
      },
      {
        cells: [
          { column: { name: "revenue" }, value: 156000 },
          { column: { name: "profit" }, value: 32000 },
          { column: { name: "orders" }, value: 180 },
        ]
      },
    ];
  }, []);

  // Process data using KPIWidgetProcessor
  const processedData = useMemo(() => {
    if (!config.data?.metrics || config.data.metrics.length === 0) {
      return [];
    }

    const kpiConfig = {
      dataSource: {
        databaseId: config.data.databaseId || 0,
        tableId: config.data.tableId || "",
      },
      metrics: config.data.metrics,
      filters: config.data.filters || [],
    };

    return KPIWidgetProcessor.process(mockData, kpiConfig);
  }, [config.data, mockData]);

  const formatValue = (value: number, format: string): string => {
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
      default:
        return new Intl.NumberFormat("en-US").format(value);
    }
  };

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

  if (!config.data?.metrics || config.data.metrics.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No KPI metrics configured</p>
            <p className="text-sm">Configure metrics to display KPIs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="h-full"
      style={{
        backgroundColor: config.style?.backgroundColor || "#FFFFFF",
        color: config.style?.textColor || "#000000",
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          {widget.title || "KPI Dashboard"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className={cn(
            "grid gap-4",
            config.settings?.layout === "list" ? "grid-cols-1" : "grid-cols-2",
            config.settings?.layout === "cards" ? "grid-cols-1" : "",
            config.settings?.columns === 1 ? "grid-cols-1" : "",
            config.settings?.columns === 2 ? "grid-cols-2" : "",
            config.settings?.columns === 3 ? "grid-cols-3" : "",
            config.settings?.columns === 4 ? "grid-cols-4" : ""
          )}
        >
          {processedData.map((kpi, index) => (
            <Card 
              key={`${kpi.metric}-${index}`}
              className={cn(
                "relative overflow-hidden",
                config.style?.shadow === "none" ? "" : "shadow-md",
                config.style?.shadow === "subtle" ? "shadow-sm" : "",
                config.style?.shadow === "medium" ? "shadow-md" : "",
                config.style?.shadow === "bold" ? "shadow-lg" : "",
                config.style?.shadow === "glow" ? "shadow-xl ring-2 ring-blue-500/20" : "",
                config.style?.glassEffect ? "backdrop-blur-sm bg-white/80" : "",
                config.style?.shine ? "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-pulse" : ""
              )}
              style={{
                borderRadius: config.style?.borderRadius === "none" ? "0" : 
                           config.style?.borderRadius === "sm" ? "0.25rem" :
                           config.style?.borderRadius === "md" ? "0.5rem" :
                           config.style?.borderRadius === "lg" ? "0.75rem" :
                           config.style?.borderRadius === "xl" ? "1rem" :
                           config.style?.borderRadius === "2xl" ? "1.5rem" : "1rem",
                padding: config.style?.padding === "none" ? "0" :
                        config.style?.padding === "xs" ? "0.5rem" :
                        config.style?.padding === "sm" ? "0.75rem" :
                        config.style?.padding === "md" ? "1rem" :
                        config.style?.padding === "lg" ? "1.5rem" :
                        config.style?.padding === "xl" ? "2rem" : "1rem",
              }}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  {/* Label */}
                  <div className="flex items-center justify-between">
                    <p 
                      className={cn(
                        "font-medium text-gray-600",
                        config.style?.labelSize === "xs" ? "text-xs" : "",
                        config.style?.labelSize === "sm" ? "text-sm" : "",
                        config.style?.labelSize === "base" ? "text-base" : "",
                        config.style?.labelSize === "lg" ? "text-lg" : ""
                      )}
                    >
                      {kpi.label}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {kpi.aggregation}
                    </Badge>
                  </div>

                  {/* Value */}
                  <div 
                    className={cn(
                      "font-bold",
                      config.style?.valueSize === "sm" ? "text-lg" : "",
                      config.style?.valueSize === "md" ? "text-xl" : "",
                      config.style?.valueSize === "lg" ? "text-2xl" : "",
                      config.style?.valueSize === "xl" ? "text-3xl" : "",
                      config.style?.valueSize === "2xl" ? "text-4xl" : "",
                      config.style?.valueSize === "3xl" ? "text-5xl" : "",
                      config.style?.valueSize === "4xl" ? "text-6xl" : ""
                    )}
                  >
                    {formatValue(kpi.value, kpi.format)}
                  </div>

                  {/* Trend */}
                  {config.settings?.showTrend && kpi.trend && (
                    <div className="flex items-center gap-2">
                      {getTrendIcon(kpi.trend.direction)}
                      <span 
                        className={cn(
                          "text-sm",
                          kpi.trend.direction === "up" ? "text-green-600" : "",
                          kpi.trend.direction === "down" ? "text-red-600" : "",
                          kpi.trend.direction === "stable" ? "text-gray-600" : ""
                        )}
                      >
                        {kpi.trend.direction === "up" ? "+" : kpi.trend.direction === "down" ? "-" : ""}
                        {kpi.trend.percentage.toFixed(1)}%
                      </span>
                      <span 
                        className={cn(
                          "text-xs text-gray-500",
                          config.style?.trendSize === "xs" ? "text-xs" : "",
                          config.style?.trendSize === "sm" ? "text-sm" : "",
                          config.style?.trendSize === "base" ? "text-base" : ""
                        )}
                      >
                        vs previous period
                      </span>
                    </div>
                  )}

                  {/* Comparison */}
                  {config.settings?.showComparison && kpi.comparison && (
                    <div className="flex items-center gap-2">
                      {getComparisonIcon(kpi.comparison.status)}
                      <span 
                        className={cn(
                          "text-sm",
                          kpi.comparison.status === "above" ? "text-green-600" : "",
                          kpi.comparison.status === "below" ? "text-red-600" : "",
                          kpi.comparison.status === "on-target" ? "text-blue-600" : ""
                        )}
                      >
                        {kpi.comparison.status === "above" ? "Above" : 
                         kpi.comparison.status === "below" ? "Below" : "On"} target
                      </span>
                      <span className="text-xs text-gray-500">
                        ({formatValue(kpi.comparison.target, kpi.format)})
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
