"use client";

import React from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";

interface CustomWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

export const CustomWidgetRenderer: React.FC<CustomWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false 
}) => {
  const config = widget.config as any;
  const content = config?.content || "Custom widget content";
  const customStyle = config?.customStyle || {};

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-2">
            Custom Widget
          </div>
          <div className="text-sm text-muted-foreground">
            {content}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-4">
            Widget ID: {widget.id}
          </div>
        </div>
        
        {Object.keys(customStyle).length > 0 && (
          <div className="text-xs text-muted-foreground/50">
            Custom styling applied
          </div>
        )}
      </div>
    </BaseWidget>
  );
};
