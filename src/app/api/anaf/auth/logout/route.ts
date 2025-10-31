/**
 * ANAF Auth Logout API Route
 * POST /api/anaf/auth/logout
 * 
 * Revokes OAuth2 tokens and disconnects ANAF integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      );
    }

    // Delete OAuth tokens from database
    await prisma.aNAFOAuthToken.deleteMany({
      where: {
        userId,
        tenantId,
      },
    });

    // Log audit event
    await prisma.aNAFAuditLog.create({
      data: {
        userId,
        tenantId,
        action: 'oauth_disconnect',
        status: 'success',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Disconnected from ANAF successfully',
    });
  } catch (error) {
    console.error('[ANAF Auth Logout] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed - Use POST' },
    { status: 405 }
  );
}
