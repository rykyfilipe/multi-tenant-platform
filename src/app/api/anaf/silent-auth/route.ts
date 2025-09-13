/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { ANAFOAuthService } from '@/lib/anaf/oauth-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    
    // Get tenant ID from user
    const userResult = await prisma.user.findFirst({
      where: { id: userId },
      select: { tenantId: true }
    });

    if (!userResult?.tenantId) {
      return NextResponse.json({ error: 'User not found or no tenant' }, { status: 404 });
    }

    const tenantId = userResult.tenantId;

    // Check if already authenticated
    const isAuthenticated = await ANAFOAuthService.isAuthenticated(userId, tenantId);
    if (isAuthenticated) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already authenticated with ANAF',
        authenticated: true 
      });
    }

    // For silent auth, we need to use a different approach
    // Since ANAF OAuth2 requires user interaction, we can't do truly silent auth
    // But we can provide a better UX by opening a popup window
    
    const authUrl = await ANAFOAuthService.getAuthUrl(userId, tenantId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'ANAF authentication required',
      authUrl,
      requiresUserInteraction: true,
      popupInstructions: 'Please complete authentication in the popup window'
    });

  } catch (error) {
    console.error('Error in silent ANAF auth:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate ANAF authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
