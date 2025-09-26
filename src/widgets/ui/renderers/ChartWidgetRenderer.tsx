"use client";

import React from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";

interface ChartWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const ChartWidgetRenderer: React.FC<ChartWidgetRendererProps> = ({ widget, onEdit, onDelete, onDuplicate }) => {
  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate}>
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        Chart widget #{widget.id}
      </div>
    </BaseWidget>
  );
};
