"use client";

import React from "react";
import { z } from "zod";
import { tableWidgetConfigSchema } from "@/widgets/schemas/table";

type TableWidgetConfig = z.infer<typeof tableWidgetConfigSchema>;

interface TableWidgetEditorProps {
  value: TableWidgetConfig;
  onChange: (value: TableWidgetConfig) => void;
}

export const TableWidgetEditor: React.FC<TableWidgetEditorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <div className="flex items-center justify-between">
        <span>Columns</span>
        <span className="text-xs text-muted-foreground/70">{value.settings.columns.length}</span>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-muted-foreground/70">Page Size</label>
        <input
          className="mt-1 w-full rounded border border-muted-foreground/20 bg-background px-2 py-1"
          type="number"
          value={value.settings.pageSize}
          onChange={(event) =>
            onChange({
              ...value,
              settings: { ...value.settings, pageSize: Number(event.target.value) },
            })
          }
        />
      </div>
    </div>
  );
};
