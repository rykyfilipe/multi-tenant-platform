import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import { ANAFOAuthService } from '@/lib/anaf/oauth-service';
import prisma from '@/lib/prisma';

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

    const userResult = await prisma.user.findFirst({
      where: { email: sessionResult.user.email },
    });

    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's tenant (direct relationship in schema)
    if (!userResult.tenantId) {
      return NextResponse.json({ 
        success: true, 
        isAuthenticated: false,
        message: "User not associated with any tenant"
      });
    }

    const tenantId = userResult.tenantId;
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
