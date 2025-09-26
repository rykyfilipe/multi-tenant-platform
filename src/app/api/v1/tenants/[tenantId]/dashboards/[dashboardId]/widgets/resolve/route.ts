import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertWidgetsV2Enabled } from "@/lib/featureFlag";
import { getWidgetService } from "@/widgets/services/factory";
import { resolveConflictSchema } from "@/widgets/schemas/base";

const paramsSchema = z.object({
  tenantId: z.coerce.number().int().positive(),
  dashboardId: z.coerce.number().int().positive(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string; dashboardId: string } }
) {
  assertWidgetsV2Enabled();
  const { tenantId, dashboardId } = paramsSchema.parse(params);
  const payload = resolveConflictSchema.parse(await request.json());

  const service = getWidgetService();
  const result = await service.resolveConflictApi({
    tenantId,
    dashboardId,
    widgetId: payload.widgetId,
    strategy: payload.strategy,
    mergedConfig: payload.mergedConfig,
    actorId: Number(request.headers.get("x-user-id") ?? 0),
  });

  return NextResponse.json(result);
}
