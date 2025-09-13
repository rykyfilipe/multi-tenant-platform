/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import { ANAFAPIService } from '@/lib/anaf/anaf-api-service';
import prisma from '@/lib/prisma';

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

    const userResult = await prisma.user.findFirst({
      where: { email: sessionResult.user.email },
    });

    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userResult.tenantId) {
      return NextResponse.json({ 
        success: false,
        error: "User not associated with any tenant"
      }, { status: 400 });
    }

    const tenantId = userResult.tenantId;
    
    // Test basic connectivity (no authentication required)
    const basicTest = await ANAFAPIService.testConnectivity('MultiTenantPlatform Test');
    
    // Test authenticated connectivity (requires valid token)
    const authTest = await ANAFAPIService.testAuthenticatedConnectivity(
      userId, 
      tenantId, 
      'MultiTenantPlatform Authenticated Test'
    );

    return NextResponse.json({
      success: true,
      tests: {
        basic: basicTest,
        authenticated: authTest
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing ANAF connectivity:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
