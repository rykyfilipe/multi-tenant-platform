/**
 * ANAF Auth Status API Route
 * GET /api/anaf/auth/status
 * 
 * Returns OAuth2 authentication status for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    const userId = parseInt(session.user.id);
    const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    if (!tenantId) {
      return NextResponse.json(
        { authenticated: false, error: 'No tenant found' },
        { status: 200 }
      );
    }

    // Check if OAuth tokens exist in database
    const anafAuth = await prisma.aNAFOAuthToken.findFirst({
      where: {
        userId,
        tenantId,
      },
    });

    const isAuthenticated = !!anafAuth && anafAuth.expiresAt > new Date();

    return NextResponse.json({
      authenticated: isAuthenticated,
      expiresAt: anafAuth?.expiresAt,
    });
  } catch (error) {
    console.error('[ANAF Auth Status] Error:', error);
    
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
