import { WidgetKind } from "@/generated/prisma";
import { chartWidgetConfigSchema } from "../schemas/chart";
import { tableWidgetConfigSchema } from "../schemas/table";
import { kpiWidgetConfigSchema } from "../schemas/kpi";
import { baseWidgetConfigSchema } from "../schemas/base";
import { z } from "zod";
import { ChartWidgetEditor } from "../ui/editors/ChartWidgetEditor";
import { TableWidgetEditor } from "../ui/editors/TableWidgetEditor";
import { KPIWidgetEditor } from "../ui/editors/KPIWidgetEditor";
import { ChartWidgetRenderer } from "../ui/renderers/ChartWidgetRenderer";
import { TableWidgetRenderer } from "../ui/renderers/TableWidgetRenderer";
import { KPIWidgetRenderer } from "../ui/renderers/KPIWidgetRenderer";
import { ClockWidgetRenderer } from "../ui/renderers/ClockWidgetRenderer";
import { WeatherWidgetRenderer } from "../ui/renderers/WeatherWidgetRenderer";
import { CustomWidgetRenderer } from "../ui/renderers/CustomWidgetRenderer";
import { WidgetEntity } from "../domain/entities";

type ConfigFromSchema<T extends z.ZodTypeAny> = z.infer<T>;

type EditorComponent<T extends z.ZodTypeAny> = React.ComponentType<{
  value: ConfigFromSchema<T>;
  onChange: (value: ConfigFromSchema<T>) => void;
  tenantId: number;
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
    defaultConfig: chartWidgetConfigSchema.parse({
      settings: {
        chartType: "bar",
        xAxis: "dimension",
        yAxis: "value",
        refreshInterval: 60,
        valueFormat: "number",
      },
      style: {
        theme: "premium-light",
        showLegend: true,
        showGrid: true,
      },
      data: {
        tableId: "default_table",
        filters: [],
        mappings: {
          x: "dimension",
          y: "value",
        },
      },
    }),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
  [WidgetKind.TABLE]: {
    kind: WidgetKind.TABLE,
    schema: tableWidgetConfigSchema,
    defaultConfig: tableWidgetConfigSchema.parse({
      settings: {
        columns: [
          {
            id: "column_1",
            label: "Column 1",
            sortable: true,
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
    }),
    editor: TableWidgetEditor,
    renderer: TableWidgetRenderer,
  },
  [WidgetKind.TASKS]: {
    kind: WidgetKind.TASKS,
    schema: tableWidgetConfigSchema,
    defaultConfig: tableWidgetConfigSchema.parse({
      settings: {
        columns: [
          {
            id: "task",
            label: "Task",
            sortable: true,
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
        tableId: "default_tasks",
        filters: [],
        sort: [],
      },
    }),
    editor: TableWidgetEditor,
    renderer: KPIWidgetRenderer,
  },
  [WidgetKind.CLOCK]: {
    kind: WidgetKind.CLOCK,
    schema: chartWidgetConfigSchema,
    defaultConfig: chartWidgetConfigSchema.parse({
      settings: {
        chartType: "pie",
        xAxis: "category",
        yAxis: "value",
        refreshInterval: 60,
        valueFormat: "number",
      },
      style: {
        theme: "premium-light",
        showLegend: true,
        showGrid: false,
      },
      data: {
        tableId: "default_clock",
        filters: [],
        mappings: {
          x: "category",
          y: "value",
        },
      },
    }),
    editor: ChartWidgetEditor,
    renderer: ClockWidgetRenderer,
  },
  [WidgetKind.WEATHER]: {
    kind: WidgetKind.WEATHER,
    schema: chartWidgetConfigSchema,
    defaultConfig: chartWidgetConfigSchema.parse({
      settings: {
        chartType: "line",
        xAxis: "date",
        yAxis: "temperature",
        refreshInterval: 300,
        valueFormat: "number",
      },
      style: {
        theme: "premium-light",
        showLegend: true,
        showGrid: true,
      },
      data: {
        tableId: "default_weather",
        filters: [],
        mappings: {
          x: "date",
          y: "temperature",
        },
      },
    }),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
  [WidgetKind.KPI]: {
    kind: WidgetKind.KPI,
    schema: kpiWidgetConfigSchema,
    defaultConfig: kpiWidgetConfigSchema.parse({
      settings: {
        valueField: "value",
        label: "KPI Value",
        format: "number",
        showTrend: true,
        showComparison: false,
        aggregation: "sum",
      },
      style: {
        theme: "premium-light",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        valueColor: "#2563eb",
        labelColor: "#666666",
        trendColor: "#22c55e",
        size: "medium",
        alignment: "center",
      },
      data: {
        tableId: "default_kpi",
        filters: [],
      },
    }),
    editor: KPIWidgetEditor,
    renderer: KPIWidgetRenderer,
  },
  [WidgetKind.CUSTOM]: {
    kind: WidgetKind.CUSTOM,
    schema: baseWidgetConfigSchema,
    defaultConfig: baseWidgetConfigSchema.parse({
      settings: {},
      style: {},
      data: {},
    }),
    editor: ChartWidgetEditor,
    renderer: CustomWidgetRenderer,
  },
};

export const widgetKindEnum = WidgetKind;

export const getWidgetDefinition = (kind: WidgetKind) => definitions[kind];

export const widgetRegistry = definitions;

