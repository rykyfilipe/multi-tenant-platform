import { NextResponse, type NextRequest } from "next/server";
import { isWidgetsV2Enabled } from "@/lib/featureFlag";

const widgetsApiMatcher = /^\/api\/v1\/tenants\/(\d+)\/dashboards\/(\d+)\/widgets/;

export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  if (widgetsApiMatcher.test(url)) {
    if (!isWidgetsV2Enabled()) {
      return new NextResponse("Widgets V2 disabled", { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/v1/tenants/:tenantId/dashboards/:dashboardId/widgets/:path*",
  ],
};
