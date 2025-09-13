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
    if (!sessionResult.user.email) {
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
        success: false,
        error: "No tenants found"
      }, { status: 400 });
    }

    // Get auth URL for the first tenant
    const tenantId = userTenants[0].tenantId;
    const authUrl = await ANAFOAuthService.getAuthUrl(userId, tenantId);

    return NextResponse.json({
      success: true,
      authUrl: authUrl,
      tenantId: tenantId
    });

  } catch (error) {
    console.error('Error getting ANAF auth URL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
