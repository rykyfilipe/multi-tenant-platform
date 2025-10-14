import { WidgetType } from "@/generated/prisma";
import { chartWidgetConfigSchema } from "../schemas/chart-v2";
import { tableWidgetConfigSchemaV2 } from "../schemas/table-v2";
import { kpiWidgetConfigSchemaV2 } from "../schemas/kpi-v2";
import { clockWidgetConfigSchema } from "../schemas/clock-v2";
import { weatherWidgetConfigSchema } from "../schemas/weather-v2";
import { textWidgetConfigSchemaV1 } from "../schemas/text-v1";
import { notesWidgetConfigSchemaV1 } from "../schemas/notes-v1";
import { baseWidgetConfigSchema } from "../schemas/base";
import { z } from "zod";
import { ChartWidgetEditorV2 as ChartWidgetEditor } from "../ui/editors/ChartWidgetEditorV2";
import { TableWidgetEditorV2 as TableWidgetEditor } from "../ui/editors/TableWidgetEditorV2";
import { KPIWidgetEditorV2 as KPIWidgetEditor } from "../ui/editors/KPIWidgetEditorV2";
import { ClockWidgetEditor } from "../ui/editors/ClockWidgetEditor";
import { WeatherWidgetEditor } from "../ui/editors/WeatherWidgetEditor";
import { TasksWidgetEditor } from "../ui/editors/TasksWidgetEditor";
import { TextWidgetEditor } from "../ui/editors/TextWidgetEditor";
import { NotesWidgetEditor } from "../ui/editors/NotesWidgetEditor";
import { ChartWidgetRenderer } from "../ui/renderers/ChartWidgetRenderer";
import { TableWidgetRenderer } from "../ui/renderers/TableWidgetRenderer";
import { KPIWidgetRenderer } from "../ui/renderers/KPIWidgetRenderer";
import { ClockWidgetRenderer } from "../ui/renderers/ClockWidgetRenderer";
import { WeatherWidgetRenderer } from "../ui/renderers/WeatherWidgetRenderer";
import { TasksWidgetRenderer } from "../ui/renderers/TasksWidgetRenderer";
import { TextWidgetRenderer } from "../ui/renderers/TextWidgetRenderer";
import { NotesWidgetRenderer } from "../ui/renderers/NotesWidgetRenderer";
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
  isEditMode?: boolean;
  isSelected?: boolean;
}>;

export interface WidgetDefinition<TConfigSchema extends z.ZodTypeAny> {
  type: WidgetType;
  schema: TConfigSchema;
  defaultConfig: ConfigFromSchema<TConfigSchema>;
  editor: EditorComponent<TConfigSchema>;
  renderer: RendererComponent;
}

const definitions: Record<WidgetType, WidgetDefinition<z.ZodTypeAny>> = {
  [WidgetType.CHART]: {
    type: WidgetType.CHART,
    schema: chartWidgetConfigSchema,
    defaultConfig: {
      settings: {
        chartType: "bar",
        refreshInterval: 60,
        processingMode: "raw",
        aggregationFunction: "sum",
        enableTopN: false,
        topNCount: 10,
      },
      style: {
        theme: "platinum",
        backgroundColor: "#FFFFFF",
        textColor: "#000000",
        fontSize: "sm",
        fontWeight: "normal",
        padding: "md",
        borderRadius: "xl",
        borderWidth: 1,
        shadow: "medium",
        glassEffect: false,
        backdropBlur: "none",
        showLegend: true,
        showGrid: true,
        legendPosition: "bottom",
        chartOpacity: 1,
        shine: false,
        glow: false,
      },
      data: {
        tableId: "default_table",
        filters: [],
        mappings: {
          x: "dimension",
          y: ["value"],
        },
      },
      refresh: {
        enabled: false,
        interval: 30000,
      },
      metadata: {},
    },
    editor: ChartWidgetEditor,
    renderer: ChartWidgetRenderer,
  },
  [WidgetType.TABLE]: {
    type: WidgetType.TABLE,
    schema: tableWidgetConfigSchemaV2,
    defaultConfig: {
      settings: {
        aggregation: {
          enabled: false,
          groupBy: undefined,
          columns: [],
          showSummaryRow: true,
          showGroupTotals: false,
        },
        pagination: {
          enabled: true,
          pageSize: 50,
        },
        sorting: {
          enabled: true,
          defaultColumn: undefined,
          defaultDirection: "asc",
        },
        showRowNumbers: true,
        showColumnHeaders: true,
        alternateRowColors: true,
        refreshInterval: 60,
      },
      style: {
        theme: "platinum",
        backgroundColor: "#FFFFFF",
        textColor: "#000000",
        borderColor: "#E5E7EB",
        headerBackgroundColor: "#F9FAFB",
        headerTextColor: "#374151",
        evenRowColor: "#FFFFFF",
        oddRowColor: "#F9FAFB",
        hoverRowColor: "#F3F4F6",
        selectedRowColor: "#EBF4FF",
        fontSize: "sm",
        headerFontSize: "base",
        fontWeight: "normal",
        headerFontWeight: "semibold",
        padding: "sm",
        borderWidth: "1",
        borderRadius: "md",
        columnMinWidth: 100,
        columnMaxWidth: 300,
        shadow: "subtle",
        stripedRows: true,
        hoverEffects: true,
        summaryRowStyle: {
          backgroundColor: "#F3F4F6",
          textColor: "#374151",
          fontWeight: "semibold",
          borderTop: true,
        },
      },
      data: {
        databaseId: undefined,
        tableId: undefined,
        filters: [],
        columns: [],
      },
      refresh: {
        enabled: false,
        interval: 30000,
      },
      metadata: {},
    },
    editor: TableWidgetEditor,
    renderer: TableWidgetRenderer,
  },
  [WidgetType.TASKS]: {
    type: WidgetType.TASKS,
    schema: z.object({
      settings: z.object({
        title: z.string().default("My Tasks"),
        showCompleted: z.boolean().default(true),
        showProgress: z.boolean().default(true),
        allowInlineEdit: z.boolean().default(true),
        allowDragReorder: z.boolean().default(true),
        defaultPriority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).default("DD/MM/YYYY"),
        maxTasks: z.number().min(1).max(100).default(50),
      }),
      style: z.object({
        theme: z.enum(["premium-light", "premium-dark", "minimal", "luxury", "platinum", "obsidian", "pearl"]).default("premium-light"),
        layout: z.enum(["list", "card", "kanban"]).default("list"),
        density: z.enum(["compact", "comfortable", "spacious"]).default("comfortable"),
        backgroundColor: z.string().default("#ffffff"),
        textColor: z.string().default("#000000"),
        accentColor: z.string().default("#3b82f6"),
        borderColor: z.string().default("#e5e7eb"),
        borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]).default("md"),
        shadow: z.enum(["none", "sm", "md", "lg", "medium", "subtle", "bold"]).default("sm"),
        padding: z.enum(["tight", "comfortable", "spacious", "lg", "md", "sm"]).default("comfortable"),
        showPriorityColors: z.boolean().default(true),
        showDueDates: z.boolean().default(true),
      }),
      data: z.object({
        tasks: z.array(z.object({
          id: z.string(),
          title: z.string(),
          description: z.string().optional(),
          completed: z.boolean(),
          priority: z.enum(["low", "medium", "high", "urgent"]),
          dueDate: z.string().optional(), // ISO string
          assignee: z.string().optional(),
          progress: z.number().optional(),
          tags: z.array(z.string()).optional(),
        })).optional().default([]),
      }).optional().default({ tasks: [] }),
      refresh: z.object({
        enabled: z.boolean().default(false),
        interval: z.number().default(300000),
      }),
    }),
    defaultConfig: {
      settings: {
        title: "My Tasks",
        showCompleted: true,
        showProgress: true,
        allowInlineEdit: true,
        allowDragReorder: true,
        defaultPriority: "medium",
        dateFormat: "DD/MM/YYYY",
        maxTasks: 50,
      },
      style: {
        theme: "platinum",
        layout: "list",
        density: "comfortable",
        backgroundColor: "#FFFFFF",
        textColor: "#000000",
        accentColor: "#1a1a1a",
        borderColor: "#E5E5E5",
        borderRadius: "lg",
        shadow: "medium",
        padding: "lg",
        showPriorityColors: true,
        showDueDates: true,
      },
      data: {
        tasks: [],
      },
      refresh: {
        enabled: false,
        interval: 300000,
      },
    },
    editor: TasksWidgetEditor,
    renderer: TasksWidgetRenderer,
  },
  [WidgetType.CLOCK]: {
    type: WidgetType.CLOCK,
    schema: clockWidgetConfigSchema,
    defaultConfig: {
      settings: {
        timezone: "local",
        format: "24h",
        showDate: true,
        showSeconds: true,
        showTimezone: false,
        clockType: "digital",
        dateFormat: "DD/MM/YYYY",
      },
      style: {
        backgroundColor: "#FFFFFF",
        backgroundGradient: { enabled: false, from: "#FFFFFF", to: "#F3F4F6", direction: "to-br" },
        borderRadius: 16,
        border: { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" },
        shadow: { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
        padding: { x: 32, y: 24 },
        alignment: "center",
        time: {
          fontSize: 64,
          fontFamily: "Courier New, monospace",
          fontWeight: "700",
          color: "#111827",
          gradient: { enabled: false, from: "#3B82F6", to: "#8B5CF6" },
          letterSpacing: 2,
          showSeparatorBlink: true,
        },
        date: {
          fontSize: 16,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: "500",
          color: "#6B7280",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginTop: 8,
        },
        seconds: {
          fontSize: 24,
          color: "#9CA3AF",
          opacity: 0.7,
        },
        analog: {
          faceColor: "#FFFFFF",
          borderColor: "#E5E7EB",
          borderWidth: 8,
          numbersColor: "#374151",
          numbersSize: 14,
          showNumbers: true,
          hourHand: { color: "#111827", width: 6, length: 50 },
          minuteHand: { color: "#374151", width: 4, length: 70 },
          secondHand: { color: "#EF4444", width: 2, length: 75 },
          centerDot: { color: "#111827", size: 12 },
        },
        timezone: {
          fontSize: 12,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: "400",
          color: "#9CA3AF",
          marginTop: 8,
        },
        animation: {
          enabled: true,
          duration: 400,
          easing: "easeInOut",
        },
      },
      refresh: {
        enabled: true,
        interval: 1000,
      },
      metadata: {},
    },
    editor: ClockWidgetEditor,
    renderer: ClockWidgetRenderer,
  },
  [WidgetType.WEATHER]: {
    type: WidgetType.WEATHER,
    schema: weatherWidgetConfigSchema,
    defaultConfig: {
      settings: {
        location: "",
        units: "metric",
        showForecast: true,
        forecastDays: 5,
        showHumidity: true,
        showWindSpeed: true,
        showPressure: false,
        showUVIndex: false,
        showFeelsLike: true,
      },
      style: {
        backgroundColor: "#FFFFFF",
        backgroundGradient: { enabled: false, from: "#FFFFFF", to: "#E0F2FE", direction: "to-b" },
        borderRadius: 16,
        border: { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" },
        shadow: { enabled: true, size: "md" },
        padding: { x: 24, y: 20 },
        layout: "detailed",
        temperature: {
          fontSize: 56,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: "700",
          color: "#111827",
          gradient: { enabled: false, from: "#F59E0B", to: "#EF4444" },
          showUnit: true,
          unitSize: 24,
        },
        location: {
          fontSize: 18,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: "600",
          color: "#374151",
        },
        condition: {
          fontSize: 14,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: "500",
          color: "#6B7280",
          textTransform: "capitalize",
        },
        icon: {
          size: 80,
          color: "#3B82F6",
          style: "filled",
          gradient: { from: "#60A5FA", to: "#3B82F6" },
          animation: true,
        },
        details: {
          fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: "400",
          color: "#6B7280",
          iconSize: 16,
          iconColor: "#9CA3AF",
          spacing: 12,
          labelColor: "#9CA3AF",
        },
        forecast: {
          cardBackground: "#F9FAFB",
          cardBorderRadius: 8,
          cardPadding: 12,
          fontSize: 12,
          fontWeight: "500",
          dayColor: "#374151",
          tempColor: "#111827",
          iconSize: 32,
          spacing: 8,
        },
        animation: {
          enabled: true,
          duration: 500,
        },
      },
      refresh: {
        enabled: true,
        interval: 300000,
      },
      metadata: {},
    },
    editor: WeatherWidgetEditor,
    renderer: WeatherWidgetRenderer,
  },
  [WidgetType.KPI]: {
    type: WidgetType.KPI,
    schema: kpiWidgetConfigSchemaV2,
    defaultConfig: {
      settings: {
        layout: "grid",
        columns: 2,
        showTrend: true,
        showComparison: false,
        showTargets: false,
        refreshInterval: 60,
      },
      style: {
        theme: "platinum",
        backgroundColor: "#FFFFFF",
        textColor: "#000000",
        accentColor: undefined,
        fontSize: "2xl",
        fontWeight: "bold",
        padding: "lg",
        borderRadius: "xl",
        gap: "md",
        valueSize: "3xl",
        labelSize: "sm",
        trendSize: "xs",
        shadow: "medium",
        glassEffect: false,
        shine: false,
        glow: false,
        positiveColor: "#16a34a",
        negativeColor: "#dc2626",
        neutralColor: "#6b7280",
      },
      data: {
        databaseId: undefined,
        tableId: undefined,
        filters: [],
        metric: {
          field: "id",
          label: "Total Count",
          aggregations: [{ function: "count", label: "Total" }],
          format: "number",
          showTrend: true,
          showComparison: false,
        },
      },
      refresh: {
        enabled: false,
        interval: 30000,
      },
      metadata: {},
    },
    editor: KPIWidgetEditor,
    renderer: KPIWidgetRenderer,
  },
  
  [WidgetType.TEXT]: {
    type: WidgetType.TEXT,
    schema: textWidgetConfigSchemaV1,
    defaultConfig: {
      settings: {
        content: "Click to edit...",
        bold: false,
        italic: false,
        underline: false,
        alignment: "left",
        fontSize: "normal",
      },
      style: {
        textColor: "#000000",
        backgroundColor: "transparent",
        backgroundOpacity: 1,
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
        borderRadius: 8,
        border: {
          enabled: false,
          width: 1,
          color: "rgba(0, 0, 0, 0.1)",
          style: "solid"
        },
        shadow: {
          enabled: false,
          size: "md"
        },
        fontFamily: "Inter, system-ui, sans-serif",
        lineHeight: 1.5,
        letterSpacing: 0,
      },
      data: {},
      metadata: {},
      refresh: {
        enabled: false,
        interval: 60000,
      },
    },
    editor: TextWidgetEditor,
    renderer: TextWidgetRenderer,
  },
  
  [WidgetType.NOTES]: {
    type: WidgetType.NOTES,
    schema: notesWidgetConfigSchemaV1,
    defaultConfig: {
      settings: {
        showDates: true,
        dateFormat: "relative",
        layout: "grid",
        columns: 2,
        allowInlineEdit: true,
        allowDelete: true,
        maxNotes: 20,
        defaultColor: "yellow",
        // Level 2 features
        enableSearch: true,
        enableTags: true,
        enablePinning: true,
        enableChecklists: true,
        showPinnedFirst: true,
        // Level 3 features
        enableMarkdown: false,
        enableReminders: false,
        enableLinking: false,
      },
      style: {
        backgroundColor: "transparent",
        padding: "md",
        cardBorderRadius: 12,
        cardShadow: "md",
        cardPadding: 16,
        titleFontSize: 16,
        contentFontSize: 14,
        fontFamily: "Inter, system-ui, sans-serif",
        gap: 12,
      },
      data: {
        notes: [],
      },
      metadata: {},
      refresh: {
        enabled: false,
        interval: 60000,
      },
    },
    editor: NotesWidgetEditor,
    renderer: NotesWidgetRenderer,
  },
};

export const widgetTypeEnum = WidgetType;

export const getWidgetDefinition = (type: WidgetType) => definitions[type];

export const widgetRegistry = definitions;

