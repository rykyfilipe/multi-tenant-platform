"use client";

import React from "react";
import { z } from "zod";
import { chartWidgetConfigSchema } from "@/widgets/schemas/chart";

interface ChartWidgetEditorProps {
  value: z.infer<typeof chartWidgetConfigSchema>;
  onChange: (value: z.infer<typeof chartWidgetConfigSchema>) => void;
}

export const ChartWidgetEditor: React.FC<ChartWidgetEditorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <div>
        <label className="block text-xs uppercase tracking-wide text-muted-foreground/70">Chart Type</label>
        <select
          className="mt-1 w-full rounded border border-muted-foreground/20 bg-background px-2 py-1"
          value={value.settings.chartType}
          onChange={(event) =>
            onChange({
              ...value,
              settings: { ...value.settings, chartType: event.target.value as typeof value.settings.chartType },
            })
          }
        >
          {chartWidgetConfigSchema.shape.settings.shape.chartType._def.values.map((chartType) => (
            <option key={chartType} value={chartType}>
              {chartType}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-muted-foreground/70">Refresh Interval</label>
        <input
          className="mt-1 w-full rounded border border-muted-foreground/20 bg-background px-2 py-1"
          type="number"
          value={value.settings.refreshInterval}
          onChange={(event) =>
            onChange({
              ...value,
              settings: { ...value.settings, refreshInterval: Number(event.target.value) },
            })
          }
        />
      </div>
    </div>
  );
};
