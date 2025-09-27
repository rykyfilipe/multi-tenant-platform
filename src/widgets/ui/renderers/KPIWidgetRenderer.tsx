"use client";

import React from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";

interface KPIWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

export const KPIWidgetRenderer: React.FC<KPIWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false 
}) => {
  const config = widget.config as any;
  const value = config?.value || 1234;
  const label = config?.label || "Total Revenue";
  const change = config?.change || 12.5;
  const trend = config?.trend || "up";

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {label}
          </div>
        </div>
        
        {change && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className={trend === 'up' ? '↑' : '↓'}></span>
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};
