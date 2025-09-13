import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import { ANAFOAuthService } from '@/lib/anaf/oauth-service';

export async function GET(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }
    
    const userId = getUserId(sessionResult);
    if (!sessionResult.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userResult = await require('@/lib/prisma').prisma.user.findFirst({
      where: { email: sessionResult.user.email },
    });

    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's tenants
    const userTenants = await require('@/lib/prisma').prisma.userTenant.findMany({
      where: { userId: userResult.id },
      include: { tenant: true }
    });

    if (userTenants.length === 0) {
      return NextResponse.json({ 
        success: true, 
        isAuthenticated: false,
        message: "No tenants found"
      });
    }

    // Check authentication for the first tenant (or you could check all)
    const tenantId = userTenants[0].tenantId;
    const authenticated = await ANAFOAuthService.isAuthenticated(userId, tenantId);

    return NextResponse.json({
      success: true,
      isAuthenticated: authenticated,
      tenantId: tenantId
    });

  } catch (error) {
    console.error('Error checking ANAF status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
