"use client";

import React from "react";
import { motion } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";

interface ChartWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const ChartWidgetRenderer: React.FC<ChartWidgetRendererProps> = ({ widget, onEdit, onDelete, onDuplicate }) => {
  // Extract chart configuration from widget config
  const config = widget.config as any;
  const chartType = config?.type || "line";
  const data = config?.data || [];
  const dataKeys = config?.dataKeys || [{ key: "value", name: "Value", color: "#6366f1" }];
  const showGrid = config?.showGrid !== false;
  const showTooltip = config?.showTooltip !== false;

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

  const ChartComponent = chartType === "area" ? AreaChart : LineChart;

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate}>
      <div className="h-full w-full p-4 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="1 1" 
                  stroke="#e5e7eb" 
                  strokeOpacity={0.3}
                  vertical={false}
                />
              )}
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
              {chartType === "area" ? (
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
              ) : (
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
