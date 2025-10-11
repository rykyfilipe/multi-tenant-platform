import { Prisma, PrismaClient, WidgetDraft, Widget, WidgetType } from "@/generated/prisma";
import type {
  ConflictMetadata,
  DraftCreateOperation,
  DraftDeleteOperation,
  DraftUpdateOperation,
  WidgetAuditInput,
  WidgetConfig,
  WidgetEntity,
  WidgetDraftEntity,
  DraftOperation,
  WidgetPosition,
} from "../domain/entities";
import type {
  ApplyPendingChangesParams,
  CreateDraftParams,
  DeleteWidgetParams,
  ListWidgetsParams,
  ListWidgetsResponse,
  ResolveConflictParams,
  SavePendingOperationResult,
  SavePendingRequest,
  SavePendingResponse,
  UpdateDraftParams,
  ApplyDraftParams,
} from "../domain/dto";
import { getWidgetDefinition } from "../registry/widget-registry";
import { recordConflict, recordDuration, recordSaveAttempt } from "../metrics/prometheus";
import { createWidgetPayloadSchema, draftOperationSchema, updateWidgetPatchSchema } from "../schemas/base";

export class WidgetService {
  constructor(private readonly prisma: PrismaClient) {}

  private async getWidgetOrThrow<TConfig extends WidgetConfig = WidgetConfig>(
    tenantId: number,
    dashboardId: number,
    widgetId: number
  ) {
    const widget = await this.prisma.widget.findFirst({
      where: { id: widgetId, tenantId, dashboardId },
      select: this.selectWidget(true),
    });
    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`);
    }
    return widget as unknown as WidgetEntity<TConfig>;
  }

  async resolveConflictApi<TConfig extends WidgetConfig = WidgetConfig>({
    tenantId,
    dashboardId,
    widgetId,
    strategy,
    actorId,
    mergedConfig,
  }: {
    tenantId: number;
    dashboardId: number;
    widgetId: number;
    strategy: "keepLocal" | "acceptRemote" | "manual";
    actorId: number;
    mergedConfig?: TConfig;
  }): Promise<
    | { status: "resolved"; widget: WidgetEntity<TConfig>; conflict?: ConflictMetadata<TConfig> }
    | { status: "acknowledged"; conflict: ConflictMetadata<TConfig> }
  > {
    const widget = await this.getWidgetOrThrow<TConfig>(tenantId, dashboardId, widgetId);

    if (strategy === "acceptRemote") {
      await this.createAudit(this.prisma, {
        tenantId,
        dashboardId,
        widgetId,
        actorId,
        operation: "RESOLVE_CONFLICT",
        diff: { resolution: strategy, widget },
      });
      return {
        status: "resolved",
        widget,
      };
    }

    if (strategy === "manual") {
      if (!mergedConfig) {
        throw new Error("mergedConfig is required for manual conflict resolution");
      }

      const definition = getWidgetDefinition(widget.type);
      definition.schema.parse(mergedConfig);

      const updated = await this.prisma.widget.update({
        where: { id: widgetId },
        data: {
          config: mergedConfig as unknown as Prisma.InputJsonValue,
          updatedBy: actorId,
          version: { increment: 1 },
        },
        select: this.selectWidget(true),
      });

      await this.createAudit(this.prisma, {
        tenantId,
        dashboardId,
        widgetId,
        actorId,
        operation: "RESOLVE_CONFLICT",
        diff: { resolution: strategy, before: widget, after: updated },
      });

      const updatedWidget = updated as unknown as WidgetEntity<TConfig>;
      return {
        status: "resolved",
        widget: updatedWidget,
      };
    }

    const conflict: ConflictMetadata<TConfig> = {
      widgetId,
      localVersion: widget.version,
      remoteVersion: widget.version,
      remoteWidget: widget,
      diff: { before: widget },
    };

    return { status: "acknowledged", conflict };
  }

  async list<TConfig extends WidgetConfig = WidgetConfig>(params: ListWidgetsParams): Promise<ListWidgetsResponse<TConfig>> {
    const { tenantId, dashboardId, limit = 50, cursor, includeConfig = false, types } = params;

    console.log('[WidgetService.list] Query params:', { tenantId, dashboardId, limit, cursor, includeConfig, types });

    const where: Prisma.WidgetWhereInput = {
      tenantId,
      dashboardId,
      // Only add type filter if types array has items
      ...(types && types.length > 0 ? { type: { in: types } } : {}),
    };

    console.log('[WidgetService.list] Where clause:', where);

    const items = await this.prisma.widget.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: "asc" },
      select: this.selectWidget(includeConfig),
    });

    console.log('[WidgetService.list] Found items:', items.length);

    const hasNext = items.length > limit;
    const reduced = hasNext ? items.slice(0, -1) : items;
    const nextCursor = hasNext ? reduced[reduced.length - 1]?.id ?? null : null;
    const total = await this.prisma.widget.count({ where });

    console.log('[WidgetService.list] Returning:', { itemsCount: reduced.length, nextCursor, total });

    return {
      items: reduced as unknown as WidgetEntity<TConfig>[],
      nextCursor,
      total,
    };
  }

  async listDrafts<TConfig extends WidgetConfig = WidgetConfig>({
    tenantId,
    dashboardId,
  }: {
    tenantId: number;
    dashboardId: number;
  }): Promise<{
    drafts: WidgetDraftEntity<TConfig>[];
  }> {
    const drafts = await this.prisma.widgetDraft.findMany({
      where: {
        tenantId,
        dashboardId,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        widget: true,
      },
    });

    return {
      drafts: drafts.map((draft) =>
        this.mapDraft(draft as WidgetDraft & { widget: Widget | null }) as WidgetDraftEntity<TConfig>
      ),
    };
  }

  private mapDraft<TConfig extends WidgetConfig = WidgetConfig>(
    draft: WidgetDraft & { widget?: Widget | null }
  ): WidgetDraftEntity<TConfig> {
    const operations: DraftOperation<TConfig>[] = Array.isArray(draft.operations)
      ? ((draft.operations as unknown) as DraftOperation<TConfig>[])
      : [];

    const conflictMeta = draft.conflictMeta
      ? ((draft.conflictMeta as unknown) as ConflictMetadata<TConfig>)
      : null;

    const widgetSnapshot = draft.widget
      ? ({
          ...draft.widget,
          config: draft.widget.config as unknown as TConfig,
          position: draft.widget.position as unknown as WidgetPosition,
        } as WidgetEntity<TConfig>)
      : null;

    return {
      id: draft.id,
      tenantId: draft.tenantId,
      dashboardId: draft.dashboardId,
      widgetId: draft.widgetId,
      type: draft.type,
      title: draft.title,
      description: draft.description,
      position: (draft.position as unknown as WidgetPosition | null) ?? null,
      config: draft.config as unknown as TConfig,
      version: draft.version,
      schemaVersion: draft.schemaVersion,
      status: draft.status,
      operations,
      conflictMeta,
      widgetSnapshot,
      note: draft.note,
      createdBy: draft.createdBy,
      updatedBy: draft.updatedBy,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      appliedAt: draft.appliedAt,
    };
  }

  async deleteDraft({
    tenantId,
    dashboardId,
    draftId,
    actorId,
  }: {
    tenantId: number;
    dashboardId: number;
    draftId: number;
    actorId: number;
  }) {
    const draft = await this.prisma.widgetDraft.findFirst({
      where: { id: draftId, tenantId, dashboardId },
    });

    if (!draft) {
      throw new Error(`Draft ${draftId} not found`);
    }

    await this.prisma.widgetDraft.delete({ where: { id: draftId } });

    await this.createAudit(this.prisma, {
      tenantId,
      dashboardId,
      widgetId: draft.widgetId ?? undefined,
      draftId,
      actorId,
      operation: "DELETE",
      diff: { draft },
    });
  }

  async get<TConfig extends WidgetConfig = WidgetConfig>({
    tenantId,
    dashboardId,
    widgetId,
    includeConfig = true,
  }: {
    tenantId: number;
    dashboardId: number;
    widgetId: number;
    includeConfig?: boolean;
  }): Promise<WidgetEntity<TConfig> | null> {
    const widget = await this.prisma.widget.findFirst({
      where: { tenantId, dashboardId, id: widgetId },
      select: this.selectWidget(includeConfig),
    });

    return widget as unknown as WidgetEntity<TConfig> | null;
  }

  async createDraft<TConfig extends WidgetConfig = WidgetConfig>(
    params: CreateDraftParams<TConfig>
  ): Promise<WidgetDraftEntity<TConfig>> {
    const { tenantId, dashboardId, actorId, widgetId, kind, position, config, title, description, note, operations }
      = params;

    const definition = getWidgetDefinition(kind);
    definition.schema.parse(config);

    const draft = await this.prisma.widgetDraft.create({
      data: {
        tenantId,
        dashboardId,
        widgetId: widgetId ?? null,
        kind,
        position: position ? (position as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        config: config as unknown as Prisma.InputJsonValue,
        title: title ?? null,
        description: description ?? null,
        note: note ?? null,
        operations: operations ? (operations as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        createdBy: actorId,
        updatedBy: actorId,
      },
      include: { widget: true },
    });

    await this.createAudit(this.prisma, {
      tenantId,
      dashboardId,
      widgetId: draft.widgetId ?? undefined,
      draftId: draft.id,
      actorId,
      operation: "APPLY_PENDING",
      diff: { draft },
    });

    return this.mapDraft<TConfig>(draft as WidgetDraft & { widget: Widget | null });
  }

  async updateDraft<TConfig extends WidgetConfig = WidgetConfig>(
    params: UpdateDraftParams<TConfig>
  ): Promise<WidgetDraftEntity<TConfig>> {
    const { tenantId, dashboardId, draftId, actorId, patch } = params;

    const draft = await this.prisma.widgetDraft.findFirst({
      where: { id: draftId, tenantId, dashboardId },
      include: { widget: true },
    });

    if (!draft) {
      throw new Error(`Draft ${draftId} not found`);
    }

    if (patch.config) {
      const definition = getWidgetDefinition(draft.type as WidgetType);
      definition.schema.parse(patch.config as TConfig);
    }

    const updated = await this.prisma.widgetDraft.update({
      where: { id: draftId },
      data: {
        ...this.serializeDraftPatch({
          ...patch,
          operations: patch.operations,
        } as Partial<WidgetDraft & { config: TConfig }>),
        updatedBy: actorId,
      },
      include: { widget: true },
    });

    await this.createAudit(this.prisma, {
      tenantId,
      dashboardId,
      widgetId: updated.widgetId ?? undefined,
      draftId: updated.id,
      actorId,
      operation: "UPDATE",
      diff: { before: draft, after: updated },
    });

    return this.mapDraft<TConfig>(updated as WidgetDraft & { widget: Widget | null });
  }

  async applyDraft(
    params: ApplyDraftParams
  ): Promise<SavePendingResponse> {
    const draft = await this.prisma.widgetDraft.findFirst({
      where: {
        id: params.draftId,
        tenantId: params.tenantId,
        dashboardId: params.dashboardId,
      },
    });

    if (!draft) {
      throw new Error(`Draft ${params.draftId} not found`);
    }

    const operations = (draft.operations as unknown as DraftOperation[]) ?? [];

    const response = await this.savePending({
      tenantId: params.tenantId,
      dashboardId: params.dashboardId,
      actorId: params.actorId,
      operations,
    });

    const status = response.conflicts.length ? "CONFLICT" : "APPLIED";

    await this.prisma.widgetDraft.update({
      where: { id: draft.id },
      data: {
        status,
        conflictMeta: response.conflicts.length
          ? (response.conflicts as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        appliedAt: response.conflicts.length ? null : new Date(),
        updatedBy: params.actorId,
      },
    });

    return response;
  }

  async resolveConflict<TConfig extends WidgetConfig = WidgetConfig>(
    params: ResolveConflictParams<TConfig>
  ): Promise<WidgetDraft> {
    const { tenantId, dashboardId, draftId, actorId, merge } = params;

    const draft = await this.prisma.widgetDraft.findFirst({
      where: { id: draftId, tenantId, dashboardId },
    });

    if (!draft) {
      throw new Error(`Draft ${draftId} not found`);
    }

    const definition = getWidgetDefinition(draft.type as WidgetType);
    if (merge.config) {
      definition.schema.parse(merge.config as TConfig);
    }

    const updatedDraft = await this.prisma.widgetDraft.update({
      where: { id: draftId },
      data: {
        ...this.serializeDraftPatch(merge as Partial<WidgetDraft & { config: TConfig }>),
        status: "READY",
        conflictMeta: Prisma.JsonNull,
        updatedBy: actorId,
      },
    });

    await this.createAudit(this.prisma, {
      tenantId,
      dashboardId,
      widgetId: updatedDraft.widgetId ?? undefined,
      draftId,
      actorId,
      operation: "RESOLVE_CONFLICT",
      diff: { draftBefore: draft, draftAfter: updatedDraft, merge },
    });

    return updatedDraft;
  }

  async delete(params: DeleteWidgetParams): Promise<void> {
    const { tenantId, dashboardId, widgetId, actorId, expectedVersion } = params;

    await this.prisma.$transaction(async (tx) => {
      const widget = await tx.widget.findFirst({
        where: { id: widgetId, tenantId, dashboardId },
      });

      if (!widget) {
        // Widget doesn't exist - this is actually a successful outcome for delete operation
        // Just return without error since the widget is already deleted
        return;
      }

      if (widget.version !== expectedVersion) {
        throw new Error(`Version conflict for widget ${widgetId}`);
      }

      await tx.widget.delete({ where: { id: widgetId } });

      await this.createAudit(tx, {
        tenantId,
        dashboardId,
        widgetId,
        actorId,
        operation: "DELETE",
        diff: { before: widget, after: null },
      });
    });
  }

  async savePending<TConfig extends WidgetConfig = WidgetConfig>(
    request: SavePendingRequest<TConfig>
  ): Promise<SavePendingResponse<TConfig>> {
    const results: SavePendingOperationResult<TConfig>[] = [];
    const conflicts: ConflictMetadata<TConfig>[] = [];
    const start = Date.now();

    recordSaveAttempt();

    await this.prisma.$transaction(async (tx) => {
      for (const op of request.operations) {
        const validatedOp = draftOperationSchema.parse(op);
        switch (validatedOp.kind) {
          case "create": {
            const createResult = await this.handleCreate(tx, request, validatedOp as DraftCreateOperation<TConfig>);
            results.push({ widget: createResult });
            break;
          }
          case "update": {
            const updateResult = await this.handleUpdate(tx, request, validatedOp as DraftUpdateOperation<TConfig>);
            results.push(updateResult);
            if (updateResult.conflict) {
              conflicts.push({
                ...updateResult.conflict,
                diff: {
                  before: updateResult.conflict.remoteWidget,
                  after: updateResult.widget,
                  patch: validatedOp.patch,
                },
              } as ConflictMetadata<TConfig>);
            }
            break;
          }
          case "delete": {
            const deleteResult = await this.handleDelete(tx, request, validatedOp as DraftDeleteOperation);
            results.push(deleteResult);
            if (deleteResult.conflict) {
              conflicts.push({
                ...deleteResult.conflict,
                diff: { before: deleteResult.conflict.remoteWidget, operation: "delete" },
              } as ConflictMetadata<TConfig>);
            }
            break;
          }
          default:
            throw new Error(`Unsupported operation ${(validatedOp as { kind: string }).kind}`);
        }
      }
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    conflicts.forEach(() => recordConflict());
    recordDuration(Date.now() - start);

    // Invalidate cache after widget operations to ensure consistency
    if (results.length > 0 || conflicts.length > 0) {
      try {
        // Access the global prisma client to invalidate cache
        const { default: globalPrisma } = await import("@/lib/prisma");
        if (globalPrisma?.invalidateCacheByTags) {
          globalPrisma.invalidateCacheByTags(["widget"]);
        }
      } catch (error) {
        console.warn("Failed to invalidate widget cache:", error);
      }
    }

    return { results, conflicts };
  }

  async applyPendingChanges<TConfig extends WidgetConfig = WidgetConfig>(
    params: ApplyPendingChangesParams<TConfig>
  ) {
    return this.savePending(params);
  }

  private selectWidget(includeConfig: boolean) {
    return {
      id: true,
      tenantId: true,
      dashboardId: true,
      type: true,
      title: true,
      description: true,
      position: true,
      config: includeConfig,
      isVisible: true,
      sortOrder: true,
      version: true,
      schemaVersion: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
    } satisfies Prisma.WidgetSelect;
  }

  private async handleCreate<TConfig extends WidgetConfig = WidgetConfig>(
    tx: Prisma.TransactionClient,
    request: SavePendingRequest<TConfig>,
    op: DraftCreateOperation<TConfig>
  ): Promise<WidgetEntity<TConfig>> {
    const validated = createWidgetPayloadSchema.parse({
      ...op.widget,
      tenantId: request.tenantId,
      dashboardId: request.dashboardId,
      createdBy: request.actorId,
      updatedBy: request.actorId,
    });

    const definition = getWidgetDefinition(validated.type || WidgetType.CHART);
    definition.schema.parse(validated.config as TConfig);

    const widget = await tx.widget.create({
      data: {
        tenantId: validated.tenantId!,
        dashboardId: validated.dashboardId!,
        type: validated.type || WidgetType.CHART,
        title: validated.title ?? null,
        description: validated.description ?? null,
        position: validated.position as unknown as Prisma.InputJsonValue,
        config: validated.config as unknown as Prisma.InputJsonValue,
        isVisible: validated.isVisible ?? true,
        sortOrder: validated.sortOrder ?? 0,
        schemaVersion: validated.schemaVersion ?? 1,
        createdBy: validated.createdBy ?? request.actorId,
        updatedBy: validated.updatedBy ?? request.actorId,
      },
      select: this.selectWidget(true),
    });

    await this.createAudit(tx, {
      tenantId: request.tenantId,
      dashboardId: request.dashboardId,
      widgetId: widget.id,
      actorId: request.actorId,
      operation: "CREATE",
      diff: { before: null, after: widget },
    });

    return widget as unknown as WidgetEntity<TConfig>;
  }

  private async handleUpdate<TConfig extends WidgetConfig = WidgetConfig>(
    tx: Prisma.TransactionClient,
    request: SavePendingRequest<TConfig>,
    op: DraftUpdateOperation<TConfig>
  ): Promise<SavePendingOperationResult<TConfig>> {
    const widget = await tx.widget.findFirst({
      where: {
        id: op.widgetId,
        tenantId: request.tenantId,
        dashboardId: request.dashboardId,
      },
    });

    if (!widget) {
      // Widget doesn't exist - return a conflict to indicate the widget is not available for update
      return {
        widget: {
          id: op.widgetId,
          tenantId: request.tenantId,
          dashboardId: request.dashboardId,
          type: WidgetType.CHART,
          title: null,
          description: null,
          position: { x: 0, y: 0, w: 4, h: 4 },
          config: getWidgetDefinition(WidgetType.CHART).defaultConfig as TConfig,
          isVisible: true,
          sortOrder: 0,
          version: 1,
          schemaVersion: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: request.actorId,
          updatedBy: request.actorId,
        } as unknown as WidgetEntity<TConfig>,
        conflict: {
          widgetId: op.widgetId,
          localVersion: op.expectedVersion || 1,
          remoteVersion: 1,
          remoteWidget: {
            id: op.widgetId,
            tenantId: request.tenantId,
            dashboardId: request.dashboardId,
            type: WidgetType.CHART,
            title: null,
            description: null,
            position: { x: 0, y: 0, w: 4, h: 4 },
            config: getWidgetDefinition(WidgetType.CHART).defaultConfig as TConfig,
            isVisible: true,
            sortOrder: 0,
            version: 1,
            schemaVersion: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: request.actorId,
            updatedBy: request.actorId,
          } as unknown as WidgetEntity<TConfig>,
        },
      };
    }

    if (op.expectedVersion && widget.version !== op.expectedVersion) {
      return {
        widget: widget as unknown as WidgetEntity<TConfig>,
        conflict: {
          widgetId: widget.id,
          localVersion: op.expectedVersion,
          remoteVersion: widget.version,
          remoteWidget: widget as unknown as WidgetEntity<TConfig>,
          suggestedMerge: {
            ...widget,
            ...op.patch,
            version: widget.version,
            updatedAt: widget.updatedAt,
          } as Partial<WidgetEntity<TConfig>>,
        },
      };
    }

    const validatedPatch = updateWidgetPatchSchema.parse(op.patch ?? {});

    if (validatedPatch.config) {
      const definition = getWidgetDefinition(widget.type as WidgetType);
      definition.schema.parse(validatedPatch.config as TConfig);
    }

    const updated = await tx.widget.update({
      where: { id: widget.id },
      data: {
        ...this.serializeWidgetPatch(validatedPatch as Partial<WidgetEntity<TConfig>>),
        version: { increment: 1 },
        updatedBy: request.actorId,
      },
      select: this.selectWidget(true),
    });

    await this.createAudit(tx, {
      tenantId: request.tenantId,
      dashboardId: request.dashboardId,
      widgetId: widget.id,
      actorId: request.actorId,
      operation: "UPDATE",
      diff: { before: widget, after: updated },
    });

    return { widget: updated as unknown as WidgetEntity<TConfig> };
  }

  private async handleDelete<TConfig extends WidgetConfig = WidgetConfig>(
    tx: Prisma.TransactionClient,
    request: SavePendingRequest<TConfig>,
    op: DraftDeleteOperation
  ): Promise<SavePendingOperationResult<TConfig>> {
    const widget = await tx.widget.findFirst({
      where: {
        id: op.widgetId,
        tenantId: request.tenantId,
        dashboardId: request.dashboardId,
      },
    });

    if (!widget) {
      // Widget doesn't exist - this is actually a successful outcome for delete operation
      // Return null widget to indicate successful deletion of non-existent widget
      return { widget: null as unknown as WidgetEntity<TConfig> };
    }

    if (op.expectedVersion !== undefined && widget.version !== op.expectedVersion) {
      return {
        widget: widget as unknown as WidgetEntity<TConfig>,
        conflict: {
          widgetId: widget.id,
          localVersion: op.expectedVersion,
          remoteVersion: widget.version,
          remoteWidget: widget as unknown as WidgetEntity<TConfig>,
        },
      };
    }

    await tx.widget.delete({ where: { id: widget.id } });

    await this.createAudit(tx, {
      tenantId: request.tenantId,
      dashboardId: request.dashboardId,
      widgetId: widget.id,
      actorId: request.actorId,
      operation: "DELETE",
      diff: { before: widget, after: null },
    });

    return { widget: widget as unknown as WidgetEntity<TConfig> };
  }

  private async createAudit(tx: Prisma.TransactionClient, input: WidgetAuditInput) {
    await tx.widgetAudit.create({
      data: {
        tenantId: input.tenantId,
        dashboardId: input.dashboardId,
        widgetId: input.widgetId ?? null,
        draftId: input.draftId ?? null,
        actorId: input.actorId ?? null,
        operation: input.operation,
        diff: input.diff as unknown as Prisma.InputJsonValue,
        metadata: (input.metadata ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private serializeDraftPatch<TConfig extends WidgetConfig = WidgetConfig>(
    patch: Partial<WidgetDraft & { config: TConfig }>
  ): Prisma.WidgetDraftUncheckedUpdateInput {
    const data: Prisma.WidgetDraftUncheckedUpdateInput = {};

    if (patch.title !== undefined) data.title = patch.title;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.type !== undefined) data.type = patch.type;
    if (patch.position !== undefined) {
      data.position = patch.position ? (patch.position as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
    if (patch.config !== undefined) {
      data.config = patch.config as unknown as Prisma.InputJsonValue;
    }
    if (patch.version !== undefined) data.version = patch.version;
    if (patch.schemaVersion !== undefined) data.schemaVersion = patch.schemaVersion;
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.operations !== undefined) {
      data.operations = patch.operations as unknown as Prisma.InputJsonValue;
    }
    if (patch.conflictMeta !== undefined) {
      data.conflictMeta = patch.conflictMeta
        ? (patch.conflictMeta as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (patch.note !== undefined) data.note = patch.note;
    if (patch.widgetId !== undefined) data.widgetId = patch.widgetId ?? null;
    if (patch.appliedAt !== undefined) data.appliedAt = patch.appliedAt;

    return data;
  }

  private serializeWidgetPatch<TConfig extends WidgetConfig = WidgetConfig>(
    patch: Partial<WidgetEntity<TConfig>>
  ): Prisma.WidgetUncheckedUpdateInput {
    const data: Prisma.WidgetUncheckedUpdateInput = {};

    if (patch.title !== undefined) data.title = patch.title;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.type !== undefined) data.type = patch.type;
    if (patch.position !== undefined) {
      data.position = patch.position ? (patch.position as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
    if (patch.config !== undefined) {
      data.config = patch.config as unknown as Prisma.InputJsonValue;
    }
    if (patch.isVisible !== undefined) data.isVisible = patch.isVisible;
    if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder;
    if (patch.schemaVersion !== undefined) data.schemaVersion = patch.schemaVersion;

    return data;
  }
}

