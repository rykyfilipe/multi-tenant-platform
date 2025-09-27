import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const tableColumnSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  width: z.number().int().positive().max(800).optional(),
  sortable: z.boolean().default(true),
  format: z.enum(["text", "number", "currency", "date", "percentage", "badge", "link"]).default("text"),
});

export const tableSettingsSchema = z.object({
  columns: z.array(tableColumnSchema).min(1),
  pageSize: z.number().int().positive().max(200).default(25),
  enableExport: z.boolean().default(false),
  stickyHeader: z.boolean().default(true),
});

export const tableStyleSchema = z.object({
  theme: z.enum(["premium-light", "premium-dark", "auto"]).default("premium-light"),
  density: z.enum(["comfortable", "compact", "expanded"]).default("comfortable"),
  showRowBorders: z.boolean().default(false),
  zebraStripes: z.boolean().default(true),
});

export const tableDataSchema = z.object({
  databaseId: z.number().optional(),
  tableId: z.string().optional(),
  filters: z
    .array(
      z.object({
        column: z.string().optional(),
        operator: z.enum(["=", "!=", ">", "<", ">=", "<=", "contains", "startsWith", "endsWith"]).optional(),
        value: z.union([z.string(), z.number(), z.boolean(), z.date()]).optional(),
      })
    )
    .default([]),
  sort: z
    .array(
      z.object({
        column: z.string().min(1),
        direction: z.enum(["asc", "desc"]),
      })
    )
    .default([]),
});

export const tableWidgetConfigSchema = baseWidgetConfigSchema.extend({
  settings: tableSettingsSchema,
  style: tableStyleSchema,
  data: tableDataSchema,
});

export type TableWidgetConfig = z.infer<typeof tableWidgetConfigSchema>;

