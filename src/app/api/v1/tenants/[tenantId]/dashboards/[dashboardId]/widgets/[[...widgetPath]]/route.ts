import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWidgetService } from "@/widgets/services/factory";
import { assertWidgetsV2Enabled } from "@/lib/featureFlag";
import { getWidgetDefinition } from "@/widgets/registry/widget-registry";
import { WidgetKind } from "@/generated/prisma";
import {
  createWidgetPayloadSchema,
  updateWidgetPatchSchema,
} from "@/widgets/schemas/base";
import {
  listWidgetsParamsSchema,
  savePendingRequestPayloadSchema,
  createDraftParamsSchema,
  updateDraftParamsSchema,
  applyDraftParamsSchema,
  resolveDraftParamsSchema,
  resolveDraftBodySchema,
} from "@/widgets/domain/dto";
import type { DraftOperation } from "@/widgets/domain/entities";

const widgetPathSchema = z.array(z.coerce.number().int().positive()).max(2).optional();

const tenantDashboardSchema = z.object({
  tenantId: z.coerce.number().int().positive(),
  dashboardId: z.coerce.number().int().positive(),
});

const widgetIdSchema = z.coerce.number().int().positive();

const widgetService = getWidgetService();

const getActorId = (request: NextRequest): number => {
  const header = request.headers.get("x-user-id");
  return header ? Number(header) : 0;
};

const isDraftRequest = (segments: number[] | undefined) => segments && segments[0] === 0;
const isSaveEndpoint = (segments: number[] | undefined) => segments && segments[0] === 1;

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string; dashboardId: string; widgetPath?: string[] } }
) {
  assertWidgetsV2Enabled();

  const { tenantId, dashboardId } = tenantDashboardSchema.parse(params);
  const pathSegments = widgetPathSchema.parse(params.widgetPath);

  if (isDraftRequest(pathSegments)) {
    console.log('🎯 [DEBUG] Processing drafts list request');
    const drafts = await widgetService.listDrafts({ tenantId, dashboardId });
    console.log('📋 [DEBUG] Drafts loaded successfully:', drafts.length);
    return NextResponse.json(drafts);
  }

  const kindsParam = request.nextUrl.searchParams
    .getAll("kind")
    .map((value) => value.toUpperCase())
    .filter((value) => value in WidgetKind) as (keyof typeof WidgetKind)[];

  const searchParams = listWidgetsParamsSchema.partial({ tenantId: true, dashboardId: true }).parse({
    cursor: request.nextUrl.searchParams.get("cursor")
      ? Number(request.nextUrl.searchParams.get("cursor"))
      : undefined,
    limit: request.nextUrl.searchParams.get("limit")
      ? Number(request.nextUrl.searchParams.get("limit"))
      : undefined,
    includeConfig: request.nextUrl.searchParams.get("includeConfig") === "true",
    kinds: kindsParam.map((value) => WidgetKind[value]),
  });

  if (pathSegments && pathSegments.length === 1) {
    const widgetId = widgetIdSchema.parse(pathSegments[0]);
    const widget = await widgetService.get({ tenantId, dashboardId, widgetId });

    return NextResponse.json({ widget });
  }

  console.log('🎯 [DEBUG] Processing widgets list request with params:', {
    tenantId,
    dashboardId,
    cursor: searchParams.cursor,
    limit: searchParams.limit,
    includeConfig: searchParams.includeConfig,
    kinds: searchParams.kinds,
  });
  
  const widgets = await widgetService.list({
    tenantId,
    dashboardId,
    cursor: searchParams.cursor,
    limit: searchParams.limit,
    includeConfig: searchParams.includeConfig,
    kinds: searchParams.kinds,
  });
  
  console.log('📋 [DEBUG] Widgets loaded successfully:', widgets.items?.length || 0);
  return NextResponse.json(widgets);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string; dashboardId: string; widgetPath?: string[] } }
) {
  assertWidgetsV2Enabled();

  const { tenantId, dashboardId } = tenantDashboardSchema.parse(params);
  const pathSegments = widgetPathSchema.parse(params.widgetPath);

  if (isDraftRequest(pathSegments)) {
    console.log('🎯 [DEBUG] Processing draft creation request');
    
    const requestBody = await request.json();
    console.log('📦 [DEBUG] Request body received:', JSON.stringify(requestBody, null, 2));
    
    console.log('🏗️ [DEBUG] Creating parse object with:', {
      tenantId,
      dashboardId,
      actorId: getActorId(request),
      requestBodyKeys: Object.keys(requestBody)
    });
    
    const parseInput = {
      ...requestBody,
      tenantId,
      dashboardId,
      actorId: getActorId(request),
    };
    
    console.log('✅ [DEBUG] Parse input ready:', JSON.stringify(parseInput, null, 2));
    
    const body = createDraftParamsSchema.parse(parseInput);
    console.log('🎉 [DEBUG] Schema parsing successful');

    const draft = await widgetService.createDraft(body as any);
    console.log('📋 [DEBUG] Draft created successfully');
    return NextResponse.json(draft, { status: 201 });
  }

  if (isSaveEndpoint(pathSegments)) {
    const requestBody = await request.json();
    const data = savePendingRequestPayloadSchema.parse(requestBody);
    const response = await widgetService.savePending({
      tenantId,
      dashboardId,
      actorId: data.actorId,
      operations: data.operations as DraftOperation[],
    });

    return NextResponse.json(response);
  }

  const rawBody = await request.json();

  const data = createWidgetPayloadSchema.parse({
    tenantId,
    dashboardId,
    ...rawBody,
  });
  const definition = getWidgetDefinition(data.kind);

  const actorId = getActorId(request);

  const result = await widgetService.savePending({
    tenantId,
    dashboardId,
    actorId,
    operations: [
      {
        kind: "create",
        id: `create-${Date.now()}`,
        widget: {
          tenantId,
          dashboardId,
          kind: definition.kind,
          title: data.title ?? null,
          description: data.description ?? null,
          position: data.position,
          config: data.config,
          isVisible: data.isVisible ?? true,
          sortOrder: data.sortOrder ?? 0,
          schemaVersion: data.schemaVersion ?? 1,
          createdBy: actorId,
          updatedBy: actorId,
        },
      },
    ],
  });

  return NextResponse.json(result, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantId: string; dashboardId: string; widgetPath?: string[] } }
) {
  assertWidgetsV2Enabled();

  const { tenantId, dashboardId } = tenantDashboardSchema.parse(params);
  const pathSegments = widgetPathSchema.parse(params.widgetPath);

  if (!pathSegments || pathSegments.length !== 1) {
    return NextResponse.json({ error: "Widget or draft ID required" }, { status: 400 });
  }

  if (isDraftRequest(pathSegments)) {
    const [, draftIdSegment] = pathSegments;
    const draftId = widgetIdSchema.parse(draftIdSegment);
    const requestBody = await request.json();
    const payload = updateDraftParamsSchema.parse({
      tenantId,
      dashboardId,
      draftId,
      actorId: getActorId(request),
      patch: requestBody,
    });

    const draft = await widgetService.updateDraft(payload as any);
    return NextResponse.json(draft);
  }

  const widgetId = widgetIdSchema.parse(pathSegments[0]);
  const body = await request.json();

  const updateSchema = z.object({
    patch: updateWidgetPatchSchema,
    expectedVersion: z.number().int().positive().optional(),
  });

  const data = updateSchema.parse(body);

  const result = await widgetService.savePending({
    tenantId,
    dashboardId,
    actorId: getActorId(request),
    operations: [
      {
        kind: "update",
        id: `update-${widgetId}-${Date.now()}`,
        widgetId,
        patch: data.patch,
        expectedVersion: data.expectedVersion,
      },
    ],
  });

  return NextResponse.json(result);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantId: string; dashboardId: string; widgetPath?: string[] } }
) {
  assertWidgetsV2Enabled();

  const { tenantId, dashboardId } = tenantDashboardSchema.parse(params);
  const pathSegments = widgetPathSchema.parse(params.widgetPath);

  if (!pathSegments || pathSegments.length !== 1) {
    return NextResponse.json({ error: "Widget or draft ID required" }, { status: 400 });
  }

  if (isDraftRequest(pathSegments)) {
    const [, draftIdSegment] = pathSegments;
    const draftId = widgetIdSchema.parse(draftIdSegment);
    await widgetService.deleteDraft({
      tenantId,
      dashboardId,
      draftId,
      actorId: getActorId(request),
    });

    return NextResponse.json({ success: true });
  }

  const widgetId = widgetIdSchema.parse(pathSegments[0]);
  const body = await request.json().catch(() => null);

  const expectedVersion = z.number().optional().parse(body?.expectedVersion);

  await widgetService.delete({
    tenantId,
    dashboardId,
    widgetId,
    actorId: getActorId(request),
    expectedVersion: expectedVersion ?? 0,
  });

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string; dashboardId: string; widgetPath?: string[] } }
) {
  assertWidgetsV2Enabled();

  const { tenantId, dashboardId } = tenantDashboardSchema.parse(params);
  const pathSegments = widgetPathSchema.parse(params.widgetPath);

  if (isDraftRequest(pathSegments)) {
    if (!pathSegments || pathSegments.length < 2) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    const [, draftIdSegment, actionSegment] = pathSegments;
    const draftId = widgetIdSchema.parse(draftIdSegment);
    const action = actionSegment ?? "apply";

    if (action === 2) {
      const paramsPayload = resolveDraftParamsSchema.parse({
        tenantId,
        dashboardId,
        draftId,
        actorId: getActorId(request),
      });
      const requestBody = await request.json();
      const bodyPayload = resolveDraftBodySchema.parse(requestBody);

      const draft = await widgetService.resolveConflict({
        ...paramsPayload,
        merge: bodyPayload.merge,
      });

      return NextResponse.json(draft);
    }

    const payload = applyDraftParamsSchema.parse({
      tenantId,
      dashboardId,
      draftId,
      actorId: getActorId(request),
    });

    const result = await widgetService.applyDraft(payload);
    return NextResponse.json(result);
  }

  const body = await request.json();

  const data = savePendingRequestPayloadSchema.parse(body);

  const response = await widgetService.savePending({
    tenantId,
    dashboardId,
    actorId: data.actorId,
    operations: data.operations as DraftOperation[],
  });

  return NextResponse.json(response);
}
