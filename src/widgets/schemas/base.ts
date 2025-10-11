import { z } from "zod";
import { WidgetType } from "@/generated/prisma";

export const widgetPositionSchema = z.object({
  x: z.coerce.number().int().nonnegative(),
  y: z.coerce.number().int().nonnegative(),
  w: z.coerce.number().int().positive(),
  h: z.coerce.number().int().positive(),
  minW: z.coerce.number().int().positive().optional(),
  minH: z.coerce.number().int().positive().optional(),
  maxW: z.coerce.number().int().positive().optional(),
  maxH: z.coerce.number().int().positive().optional(),
  static: z.boolean().optional(),
});

export const widgetMetadataSchema = z.record(z.string(), z.unknown()).optional();

export const refreshSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  interval: z.number().int().positive().default(30000), // 30 seconds
  lastRefresh: z.date().optional(),
});

export const baseWidgetConfigSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
  style: z.record(z.string(), z.unknown()).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  refresh: refreshSettingsSchema.optional(),
  metadata: widgetMetadataSchema.optional(),
});

export const widgetTypeSchema = z.nativeEnum(WidgetType);

export const baseWidgetSchema = z.object({
  id: z.number().int().positive(),
  tenantId: z.number().int().positive(),
  dashboardId: z.number().int().positive(),
  type: widgetTypeSchema,
  title: z.string().max(255).nullable(),
  description: z.string().max(1024).nullable(),
  position: widgetPositionSchema,
  config: baseWidgetConfigSchema,
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int(),
  version: z.number().int().positive(),
  schemaVersion: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const createWidgetPayloadSchema = z.object({
  tenantId: z.number().int().positive().optional(),
  dashboardId: z.number().int().positive().optional(),
  type: widgetTypeSchema.optional(),
  title: z.string().max(255).nullable().optional(),
  description: z.string().max(1024).nullable().optional(),
  position: widgetPositionSchema.optional(),
  config: baseWidgetConfigSchema.optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  schemaVersion: z.number().int().positive().optional(),
  createdBy: z.number().int().positive().optional(),
  updatedBy: z.number().int().positive().optional(),
});

export const updateWidgetPatchSchema = z
  .object({
    title: z.string().max(255).nullable().optional(),
    description: z.string().max(1024).nullable().optional(),
    position: widgetPositionSchema.optional(),
    config: baseWidgetConfigSchema.optional(),
    isVisible: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    schemaVersion: z.number().int().positive().optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Update patch must include at least one field",
  });

export const draftOperationSchema = z.discriminatedUnion("kind", [
  z
    .object({
      id: z.string(),
      kind: z.literal("create"),
      widgetId: z.number().int().positive().optional(),
      expectedVersion: z.number().int().positive().optional(),
      widget: createWidgetPayloadSchema,
    })
    .strict(),
  z
    .object({
      id: z.string(),
      kind: z.literal("update"),
      widgetId: z.number().int().positive(),
      expectedVersion: z.number().int().positive().optional(),
      patch: updateWidgetPatchSchema,
    })
    .strict(),
  z
    .object({
      id: z.string(),
      kind: z.literal("delete"),
      widgetId: z.number().int().positive(),
      expectedVersion: z.number().int().positive(),
    })
    .strict(),
]);

export type DraftOperationInput = z.infer<typeof draftOperationSchema>;

export const operationKindSchema = z.enum(["create", "update", "delete"]);

export const savePendingRequestSchema = z.object({
  actorId: z.number().int().nonnegative(),
  operations: z.array(draftOperationSchema),
});

export const resolveConflictSchema = z.object({
  widgetId: z.number().int().positive(),
  strategy: z.enum(["keepLocal", "acceptRemote", "manual"]),
  mergedConfig: baseWidgetConfigSchema.optional(),
});

export type SavePendingRequestInput = z.infer<typeof savePendingRequestSchema>;

