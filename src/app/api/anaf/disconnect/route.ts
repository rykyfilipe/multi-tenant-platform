import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import { ANAFOAuthService } from '@/lib/anaf/oauth-service';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }
    
    const userId = getUserId(sessionResult);
    if (!sessionResult.user.email) {
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
        success: false,
        error: "User not associated with any tenant"
      }, { status: 400 });
    }

    const tenantId = userResult.tenantId;
    await ANAFOAuthService.revokeAccess(userId, tenantId);

    return NextResponse.json({
      success: true,
      message: "Successfully disconnected from ANAF"
    });

  } catch (error) {
    console.error('Error disconnecting from ANAF:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
