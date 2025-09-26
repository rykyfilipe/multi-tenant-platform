import { WidgetKind } from "@/generated/prisma";
import { chartWidgetConfigSchema } from "../schemas/chart";
import { tableWidgetConfigSchema } from "../schemas/table";
import { z } from "zod";
import { ChartWidgetEditor } from "../ui/editors/ChartWidgetEditor";
import { TableWidgetEditor } from "../ui/editors/TableWidgetEditor";
import { ChartWidgetRenderer } from "../ui/renderers/ChartWidgetRenderer";
import { TableWidgetRenderer } from "../ui/renderers/TableWidgetRenderer";
import { WidgetEntity } from "../domain/entities";

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
    defaultConfig: chartWidgetConfigSchema.parse({
      settings: {
        chartType: "bar",
        xAxis: "",
        yAxis: "",
        refreshInterval: 60,
        valueFormat: "number",
      },
      style: {
        theme: "premium-light",
        showLegend: true,
        showGrid: true,
      },
      data: {
        tableId: "",
        filters: [],
        mappings: {},
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
        columns: [],
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
        tableId: "",
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
        columns: [],
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
        tableId: "",
        filters: [],
        sort: [],
      },
    }),
    editor: TableWidgetEditor,
    renderer: TableWidgetRenderer,
  },
  [WidgetKind.CLOCK]: {
    kind: WidgetKind.CLOCK,
    schema: chartWidgetConfigSchema,
    defaultConfig: chartWidgetConfigSchema.parse({
      settings: {
        chartType: "pie",
        xAxis: "",
        yAxis: "",
        refreshInterval: 60,
        valueFormat: "number",
      },
      style: {
        theme: "premium-light",
        showLegend: true,
        showGrid: false,
      },
      data: {
        tableId: "",
        filters: [],
        mappings: {},
      },
    }),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
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
        tableId: "",
        filters: [],
        mappings: {},
      },
    }),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
  [WidgetKind.KPI]: {
    kind: WidgetKind.KPI,
    schema: chartWidgetConfigSchema,
    defaultConfig: chartWidgetConfigSchema.parse({
      settings: {
        chartType: "bar",
        xAxis: "",
        yAxis: "",
        refreshInterval: 60,
        valueFormat: "number",
      },
      style: {
        theme: "premium-light",
        showLegend: false,
        showGrid: false,
      },
      data: {
        tableId: "",
        filters: [],
        mappings: {},
      },
    }),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
  [WidgetKind.CUSTOM]: {
    kind: WidgetKind.CUSTOM,
    schema: chartWidgetConfigSchema,
    defaultConfig: chartWidgetConfigSchema.parse({
      settings: {
        chartType: "bar",
        xAxis: "",
        yAxis: "",
        refreshInterval: 60,
        valueFormat: "number",
      },
      style: {
        theme: "premium-light",
        showLegend: true,
        showGrid: true,
      },
      data: {
        tableId: "",
        filters: [],
        mappings: {},
      },
    }),
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
};

export const widgetKindEnum = WidgetKind;

export const getWidgetDefinition = (kind: WidgetKind) => definitions[kind];

export const widgetRegistry = definitions;

