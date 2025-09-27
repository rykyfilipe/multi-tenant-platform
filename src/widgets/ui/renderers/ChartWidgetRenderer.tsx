"use client";

import React, { useMemo } from "react";
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
  
  // Fetch real data from API
  const { data: rawData, isLoading, error, refetch } = useTableRows(
    widget.tenantId,
    databaseId || 0,
    Number(tableId) || 0,
    {
      pageSize: 1000,
      filters: filters.map((f: any)  => `${f.column}${f.operator}${f.value}`).join(',')
    }
  );

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

  // Process data based on mappings
  const processedData = useMemo(() => {
    if (!rawData?.data || !mappings.x || !mappings.y) {
      // Return mock data if no real data or mappings
      return [
        { name: "Jan", value: 400, value2: 240 },
        { name: "Feb", value: 300, value2: 139 },
        { name: "Mar", value: 200, value2: 980 },
        { name: "Apr", value: 278, value2: 390 },
        { name: "May", value: 189, value2: 480 },
        { name: "Jun", value: 239, value2: 380 },
      ];
    }

    return rawData.data.map((row: any, index: number) => {
      const processedRow: any = {};
      
      // Map X axis (usually categorical)
      if (mappings.x && row[mappings.x] !== undefined) {
        processedRow.name = String(row[mappings.x]);
      }
      
      // Map Y axis (usually numeric)
      if (mappings.y && row[mappings.y] !== undefined) {
        processedRow.value = parseFloat(row[mappings.y]) || 0;
      }
      
      // Map group/series if exists
      if (mappings.group && row[mappings.group] !== undefined) {
        processedRow.group = String(row[mappings.group]);
      }
      
      // Map series if exists
      if (mappings.series && row[mappings.series] !== undefined) {
        processedRow.series = String(row[mappings.series]);
      }
      
      // Map color if exists
      if (mappings.color && row[mappings.color] !== undefined) {
        processedRow.color = String(row[mappings.color]);
      }
      
      return processedRow;
    });
  }, [rawData, mappings]);

  // Generate data keys based on mappings and data
  const dataKeys = useMemo(() => {
    if (!processedData.length) return [{ key: "value", name: "Value", color: "#1f2937" }];
    
    const keys = new Set<string>();
    processedData.forEach((row:any) => {
      Object.keys(row).forEach((key:any) => {
        if (key !== 'name' && typeof row[key] === 'number') {
          keys.add(key);
        }
      });
    });
    
    return Array.from(keys).map((key, index) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      color: Object.values(premiumColors)[index % Object.values(premiumColors).length]
    }));
  }, [processedData, premiumColors]);

  const showGrid = config?.style?.showGrid !== false;
  const showTooltip = true;

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
            <ChartComponent data={processedData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
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
                    color: "#374151",
                    padding: "8px 12px"
                  }}
                  labelStyle={{
                    fontWeight: "600",
                    color: "#111827",
                    fontSize: "13px",
                    marginBottom: "2px"
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
