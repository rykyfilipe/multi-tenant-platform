import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWidgetService } from "@/widgets/services/factory";
import { assertWidgetsV2Enabled } from "@/lib/featureFlag";
import { getWidgetDefinition } from "@/widgets/registry/widget-registry";
import { WidgetType } from "@/generated/prisma";
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

const widgetPathSchema = z.array(z.coerce.number().int().min(0)).max(2).optional();

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
  { params }: { params: Promise<{ tenantId: string; dashboardId: string; widgetPath?: string[] }> }
) {
  try {
    console.log('🚀 [DEBUG] GET request started');
    console.log('📋 [DEBUG] Raw params:', params);
    
    assertWidgetsV2Enabled();

    console.log('🔍 [DEBUG] Awaiting params...');
    const resolvedParams = await params;
    console.log('✅ [DEBUG] Params resolved:', resolvedParams);

    console.log('🔍 [DEBUG] Parsing tenantDashboardSchema...');
    const { tenantId, dashboardId } = tenantDashboardSchema.parse(resolvedParams);
    console.log('✅ [DEBUG] tenantDashboardSchema parsed:', { tenantId, dashboardId });
    
    console.log('🔍 [DEBUG] Parsing widgetPathSchema...');
    const pathSegments = widgetPathSchema.parse(resolvedParams.widgetPath);
    console.log('✅ [DEBUG] widgetPathSchema parsed:', pathSegments);

  if (isDraftRequest(pathSegments)) {
    console.log('🎯 [DEBUG] Processing drafts list request');
    console.log('🔍 [DEBUG] Calling widgetService.listDrafts...');
    const drafts = await widgetService.listDrafts({ tenantId, dashboardId });
    console.log('✅ [DEBUG] listDrafts result:', typeof drafts, drafts);
    return NextResponse.json(drafts);
  }

  console.log('🔍 [DEBUG] Processing search params...');
  const kindsParam = request.nextUrl.searchParams
    .getAll("kind")
    .map((value) => value.toUpperCase())
    .filter((value) => value in WidgetType) as (keyof typeof WidgetType)[];

  console.log('🔍 [DEBUG] Parsing listWidgetsParamsSchema...');
  const searchParams = listWidgetsParamsSchema.partial({ tenantId: true, dashboardId: true }).parse({
    cursor: request.nextUrl.searchParams.get("cursor")
      ? Number(request.nextUrl.searchParams.get("cursor"))
      : undefined,
    limit: request.nextUrl.searchParams.get("limit")
      ? Number(request.nextUrl.searchParams.get("limit"))
      : undefined,
    includeConfig: request.nextUrl.searchParams.get("includeConfig") === "true",
    types: kindsParam.map((value) => WidgetType[value]),
  });
  console.log('✅ [DEBUG] searchParams parsed:', searchParams);

  if (pathSegments && pathSegments.length === 1) {
    console.log('🎯 [DEBUG] Processing single widget request');
    console.log('🔍 [DEBUG] Parsing widgetId...');
    const widgetId = widgetIdSchema.parse(pathSegments[0]);
    console.log('✅ [DEBUG] widgetId parsed:', widgetId);
    
    console.log('🔍 [DEBUG] Calling widgetService.get...');
    const widget = await widgetService.get({ tenantId, dashboardId, widgetId });
    console.log('✅ [DEBUG] widget result:', typeof widget, widget);

    return NextResponse.json({ widget });
  }

  console.log('🎯 [DEBUG] Processing widgets list request with params:', {
    tenantId,
    dashboardId,
    cursor: searchParams.cursor,
    limit: searchParams.limit,
    includeConfig: searchParams.includeConfig,
    types: searchParams.types,
  });
  
  console.log('🔍 [DEBUG] Calling widgetService.list...');
  const widgets = await widgetService.list({
    tenantId,
    dashboardId,
    cursor: searchParams.cursor,
    limit: searchParams.limit,
    includeConfig: searchParams.includeConfig,
    types: searchParams.types,
  });
  
  console.log('✅ [DEBUG] widgets result:', typeof widgets, widgets);
  console.log('📋 [DEBUG] Widgets loaded successfully:', widgets.items?.length || 0);
  return NextResponse.json(widgets);
  } catch (error) {
    console.error('❌ [ERROR] GET request failed:', error);
    console.error('❌ [ERROR] Error details:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; dashboardId: string; widgetPath?: string[] }> }
) {
  try {
    console.log('🚀 [DEBUG] POST request started');
    console.log('📋 [DEBUG] Raw params:', params);
    
    assertWidgetsV2Enabled();

    console.log('🔍 [DEBUG] Awaiting params...');
    const resolvedParams = await params;
    console.log('✅ [DEBUG] Params resolved:', resolvedParams);

    console.log('🔍 [DEBUG] Parsing tenantDashboardSchema...');
    const { tenantId, dashboardId } = tenantDashboardSchema.parse(resolvedParams);
    console.log('✅ [DEBUG] tenantDashboardSchema parsed:', { tenantId, dashboardId });
    
    console.log('🔍 [DEBUG] Parsing widgetPathSchema...');
    const pathSegments = widgetPathSchema.parse(resolvedParams.widgetPath);
    console.log('✅ [DEBUG] widgetPathSchema parsed:', pathSegments);

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
    console.log('🎯 [DEBUG] Processing save endpoint request');
    console.log('🔍 [DEBUG] Getting request body...');
    const requestBody = await request.json();
    console.log('📦 [DEBUG] Request body received:', JSON.stringify(requestBody, null, 2));
    
    console.log('🔍 [DEBUG] Parsing savePendingRequestPayloadSchema...');
    const data = savePendingRequestPayloadSchema.parse(requestBody);
    console.log('✅ [DEBUG] savePendingRequestPayloadSchema parsed:', data);
    
    console.log('🔍 [DEBUG] Calling widgetService.savePending...');
    const response = await widgetService.savePending({
      tenantId,
      dashboardId,
      actorId: data.actorId,
      operations: data.operations as DraftOperation[],
    });
    console.log('✅ [DEBUG] savePending result:', typeof response, response);

    return NextResponse.json(response);
  }

  console.log('🎯 [DEBUG] Processing widget creation request');
  console.log('🔍 [DEBUG] Getting raw request body...');
  const rawBody = await request.json();
  console.log('📦 [DEBUG] Raw body received:', JSON.stringify(rawBody, null, 2));

  console.log('🔍 [DEBUG] Parsing createWidgetPayloadSchema...');
  const data = createWidgetPayloadSchema.parse({
    tenantId,
    dashboardId,
    ...rawBody,
  });
  console.log('✅ [DEBUG] createWidgetPayloadSchema parsed:', data);
  
  console.log('🔍 [DEBUG] Getting widget definition...');
  const definition = getWidgetDefinition(data.kind || WidgetType.CHART);
  console.log('✅ [DEBUG] Widget definition:', definition);

  const actorId = getActorId(request);
  console.log('✅ [DEBUG] Actor ID:', actorId);

  console.log('🔍 [DEBUG] Calling widgetService.savePending for widget creation...');
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
          kind: definition.type,
          title: data.title ?? null,
          description: data.description ?? null,
          position: data.position ?? { x: 0, y: 0, w: 4, h: 4 },
          config: data.config ?? { settings: {} },
          isVisible: data.isVisible ?? true,
          sortOrder: data.sortOrder ?? 0,
          schemaVersion: data.schemaVersion ?? 1,
          createdBy: actorId,
          updatedBy: actorId,
        },
      },
    ],
  });
  console.log('✅ [DEBUG] savePending result:', typeof result, result);

  return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('❌ [ERROR] POST request failed:', error);
    console.error('❌ [ERROR] Error details:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; dashboardId: string; widgetPath?: string[] }> }
) {
  assertWidgetsV2Enabled();

  const resolvedParams = await params;
  const { tenantId, dashboardId } = tenantDashboardSchema.parse(resolvedParams);
  const pathSegments = widgetPathSchema.parse(resolvedParams.widgetPath);

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
  { params }: { params: Promise<{ tenantId: string; dashboardId: string; widgetPath?: string[] }> }
) {
  assertWidgetsV2Enabled();

  const resolvedParams = await params;
  const { tenantId, dashboardId } = tenantDashboardSchema.parse(resolvedParams);
  const pathSegments = widgetPathSchema.parse(resolvedParams.widgetPath);

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
  { params }: { params: Promise<{ tenantId: string; dashboardId: string; widgetPath?: string[] }> }
) {
  assertWidgetsV2Enabled();

  const resolvedParams = await params;
  const { tenantId, dashboardId } = tenantDashboardSchema.parse(resolvedParams);
  const pathSegments = widgetPathSchema.parse(resolvedParams.widgetPath);

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
