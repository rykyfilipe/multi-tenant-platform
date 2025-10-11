import { WidgetType, WidgetDraftStatus } from "@/generated/prisma";
import {
  ConflictMetadata,
  DraftOperation,
  WidgetConfig,
  WidgetDraftEntity,
  WidgetEntity,
  WidgetPosition,
} from "./entities";
import { z } from "zod";
import {
  draftOperationSchema,
  savePendingRequestSchema,
  widgetPositionSchema,
  baseWidgetConfigSchema,
} from "../schemas/base";

export interface ListWidgetsParams {
  tenantId: number;
  dashboardId: number;
  cursor?: number;
  limit?: number;
  includeConfig?: boolean;
  types?: WidgetType[];
}

export interface ListWidgetsResponse<TConfig extends WidgetConfig = WidgetConfig> {
  items: WidgetEntity<TConfig>[];
  nextCursor: number | null;
  total: number;
}

export interface DraftListResponse {
  drafts: WidgetDraftEntity[];
}

export interface GetWidgetParams {
  tenantId: number;
  dashboardId: number;
  widgetId: number;
  includeConfig?: boolean;
}

export interface SavePendingRequest<TConfig extends WidgetConfig = WidgetConfig> {
  tenantId: number;
  dashboardId: number;
  actorId: number;
  operations: DraftOperation<TConfig>[];
}

export const listWidgetsParamsSchema = z.object({
  tenantId: z.number().int().positive(),
  dashboardId: z.number().int().positive(),
  cursor: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  includeConfig: z.boolean().optional(),
  types: z.array(z.nativeEnum(WidgetType)).optional(),
});

export const getWidgetParamsSchema = listWidgetsParamsSchema.pick({ tenantId: true, dashboardId: true }).extend({
  widgetId: z.number().int().positive(),
  includeConfig: z.boolean().optional(),
});

export const createDraftParamsSchema = z.object({
  tenantId: z.number().int().positive().optional(),
  dashboardId: z.number().int().positive().optional(),
  actorId: z.number().int().positive().optional(),
  widgetId: z.number().int().positive().optional(),
  type: z.nativeEnum(WidgetType).optional(),
  position: widgetPositionSchema.optional(),
  config: baseWidgetConfigSchema.optional(),
  title: z.string().max(255).optional(),
  description: z.string().max(1024).optional(),
  note: z.string().max(1024).optional(),
  operations: z.array(draftOperationSchema).optional(),
});

export const updateDraftParamsSchema = z.object({
  tenantId: z.number().int().positive(),
  dashboardId: z.number().int().positive(),
  draftId: z.number().int().positive(),
  actorId: z.number().int().positive(),
  patch: z
    .object({
      title: z.string().max(255).optional(),
      description: z.string().max(1024).optional(),
      position: widgetPositionSchema.optional(),
      config: baseWidgetConfigSchema.optional(),
      note: z.string().max(1024).optional(),
      status: z.nativeEnum(WidgetDraftStatus).optional(),
      operations: z.array(draftOperationSchema).optional(),
    })
    .partial(),
});

export const deleteWidgetParamsSchema = z.object({
  tenantId: z.number().int().positive(),
  dashboardId: z.number().int().positive(),
  widgetId: z.number().int().positive(),
  actorId: z.number().int().positive(),
  expectedVersion: z.number().int().positive(),
});

export interface DeleteWidgetParams {
  tenantId: number;
  dashboardId: number;
  widgetId: number;
  actorId: number;
  expectedVersion: number;
}

export const savePendingRequestPayloadSchema = savePendingRequestSchema;

export interface SavePendingOperationResult<TConfig extends WidgetConfig = WidgetConfig> {
  widget: WidgetEntity<TConfig> | null;
  conflict?: ConflictMetadata<TConfig>;
}

export interface SavePendingResponse<TConfig extends WidgetConfig = WidgetConfig> {
  results: SavePendingOperationResult<TConfig>[];
  conflicts: ConflictMetadata<TConfig>[];
}

export interface CreateDraftParams<TConfig extends WidgetConfig = WidgetConfig> {
  tenantId: number;
  dashboardId: number;
  actorId: number;
  widgetId?: number;
  type: WidgetType;
  position?: WidgetPosition;
  config: TConfig;
  title?: string;
  description?: string;
  note?: string;
  operations?: DraftOperation<TConfig>[];
}

export interface UpdateDraftParams<TConfig extends WidgetConfig = WidgetConfig> {
  tenantId: number;
  dashboardId: number;
  draftId: number;
  actorId: number;
  patch: Partial<Omit<WidgetDraftEntity<TConfig>, "id" | "tenantId" | "dashboardId" | "createdBy" | "createdAt">> & {
    operations?: DraftOperation<TConfig>[];
    status?: WidgetDraftStatus;
  };
}

export interface ResolveConflictParams<TConfig extends WidgetConfig = WidgetConfig> {
  tenantId: number;
  dashboardId: number;
  draftId: number;
  actorId: number;
  merge: Partial<WidgetEntity<TConfig>>;
}

export interface ApplyPendingChangesParams<TConfig extends WidgetConfig = WidgetConfig> {
  tenantId: number;
  dashboardId: number;
  actorId: number;
  operations: DraftOperation<TConfig>[];
}

export interface ApplyDraftParams {
  tenantId: number;
  dashboardId: number;
  draftId: number;
  actorId: number;
}

export const applyDraftParamsSchema = z.object({
  tenantId: z.number().int().positive(),
  dashboardId: z.number().int().positive(),
  draftId: z.number().int().positive(),
  actorId: z.number().int().positive(),
});

export const resolveDraftParamsSchema = z.object({
  tenantId: z.number().int().positive(),
  dashboardId: z.number().int().positive(),
  draftId: z.number().int().positive(),
  actorId: z.number().int().positive(),
});

export const resolveDraftBodySchema = z.object({
  merge: z
    .object({
      title: z.string().max(255).optional(),
      description: z.string().max(1024).optional(),
      position: widgetPositionSchema.optional(),
      config: baseWidgetConfigSchema.optional(),
      note: z.string().max(1024).optional(),
      operations: z.array(draftOperationSchema).optional(),
    })
    .partial(),
});

