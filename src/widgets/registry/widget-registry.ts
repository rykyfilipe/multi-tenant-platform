import React from "react";
import { WidgetKind } from "@/generated/prisma";
import { chartWidgetConfigSchema, type ChartWidgetConfig } from "@/widgets/schemas/chart";
import { tableWidgetConfigSchema, type TableWidgetConfig } from "@/widgets/schemas/table";
import { z } from "zod";
import { ChartWidgetEditor } from "../ui/editors/ChartWidgetEditor";
import { TableWidgetEditor } from "../ui/editors/TableWidgetEditor";
import { ChartWidgetRenderer } from "../ui/renderers/ChartWidgetRenderer";
import { TableWidgetRenderer } from "../ui/renderers/TableWidgetRenderer";
import { WidgetEntity } from "../domain/entities";

const chartBaseConfig: ChartWidgetConfig = {
  settings: {
    chartType: "bar",
    xAxis: "category",
    yAxis: "value",
    groupBy: "category",
    valueFormat: "number",
    refreshInterval: 60,
  },
  style: {
    theme: "premium-light",
    showLegend: true,
    showGrid: true,
  },
  data: {
    tableId: "default_chart_table",
    filters: [],
    mappings: { x: "category", y: "value" },
  },
};

const tableBaseConfig: TableWidgetConfig = {
  settings: {
    columns: [
      {
        id: "column_1",
        label: "Column 1",
        sortable: true,
        format: "text",
      },
    ],
    pageSize: 25,
    enableExport: false,
    stickyHeader: true,
  },
  style: {
    theme: "premium-light",
    density: "comfortable",
    showRowBorders: false,
    zebraStripes: true,
  },
  data: {
    tableId: "default_table",
    filters: [],
    sort: [],
  },
};

const chartConfig = (overrides: Partial<ChartWidgetConfig>) =>
  chartWidgetConfigSchema.parse({
    settings: { ...chartBaseConfig.settings, ...(overrides.settings ?? {}) },
    style: { ...chartBaseConfig.style, ...(overrides.style ?? {}) },
    data: { ...chartBaseConfig.data, ...(overrides.data ?? {}) },
  });

const tableConfig = (overrides: Partial<TableWidgetConfig>) =>
  tableWidgetConfigSchema.parse({
    settings: {
      ...tableBaseConfig.settings,
      ...(overrides.settings ?? {}),
      columns: overrides.settings?.columns ?? tableBaseConfig.settings.columns,
    },
    style: { ...tableBaseConfig.style, ...(overrides.style ?? {}) },
    data: { ...tableBaseConfig.data, ...(overrides.data ?? {}) },
  });

type ConfigFromSchema<T extends z.ZodTypeAny> = z.infer<T>;

type EditorComponent<T extends z.ZodTypeAny> = React.ComponentType<{
  value: ConfigFromSchema<T>;
  onChange: (value: ConfigFromSchema<T>) => void;
}>;

type RendererComponent = React.ComponentType<{
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}>;

export interface WidgetDefinition<TConfigSchema extends z.ZodTypeAny> {
  kind: WidgetKind;
  schema: TConfigSchema;
  defaultConfig: ConfigFromSchema<TConfigSchema>;
  editor: EditorComponent<TConfigSchema>;
  renderer: RendererComponent;
}

const definitions: Record<WidgetKind, WidgetDefinition<z.ZodTypeAny>> = {
  [WidgetKind.CHART]: {
    kind: WidgetKind.CHART,
    schema: chartWidgetConfigSchema,
    defaultConfig: chartConfig({}),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
  [WidgetKind.TABLE]: {
    kind: WidgetKind.TABLE,
    schema: tableWidgetConfigSchema,
    defaultConfig: tableConfig({}),
    editor: TableWidgetEditor,
    renderer: TableWidgetRenderer,
  },
  [WidgetKind.TASKS]: {
    kind: WidgetKind.TASKS,
    schema: tableWidgetConfigSchema,
    defaultConfig: tableConfig({}),
    editor: TableWidgetEditor,
    renderer: TableWidgetRenderer,
  },
  [WidgetKind.CLOCK]: {
    kind: WidgetKind.CLOCK,
    schema: chartWidgetConfigSchema,
    defaultConfig: chartConfig({
      settings: {
        chartType: "pie",
        xAxis: "segment",
        yAxis: "value",
        groupBy: "segment",
        valueFormat: "number",
        refreshInterval: 60,
      },
    }),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
  [WidgetKind.WEATHER]: {
    kind: WidgetKind.WEATHER,
    schema: chartWidgetConfigSchema,
    defaultConfig: chartConfig({
      settings: {
        chartType: "line",
        xAxis: "date",
        yAxis: "temperature",
        groupBy: "location",
        valueFormat: "number",
        refreshInterval: 300,
      },
      data: { tableId: "weather_table",
        filters: [],
       },
    }),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
  [WidgetKind.KPI]: {
    kind: WidgetKind.KPI,
    schema: chartWidgetConfigSchema,
    defaultConfig: chartConfig({
      settings: {
        chartType: "kpi",
        xAxis: "label",
        yAxis: "value",
        groupBy: "label",
        valueFormat: "number",
        refreshInterval: 60,
      },
    }),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
  [WidgetKind.CUSTOM]: {
    kind: WidgetKind.CUSTOM,
    schema: chartWidgetConfigSchema,
    defaultConfig: chartConfig({}),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
};

export const widgetKindEnum = WidgetKind;

export const getWidgetDefinition = (kind: WidgetKind) => definitions[kind];

export const widgetRegistry = definitions;

