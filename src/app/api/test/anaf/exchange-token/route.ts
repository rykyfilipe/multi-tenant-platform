import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import { ANAFIntegration } from '@/lib/anaf/anaf-integration';

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }

    const userId = getUserId(sessionResult);
    const body = await request.json();
    const { tenantId, authCode } = body;

    if (!tenantId || !authCode) {
      return NextResponse.json({ 
        error: 'Tenant ID and authorization code are required' 
      }, { status: 400 });
    }

    const parsedTenantId = parseInt(tenantId);

    try {
      const anafIntegration = new ANAFIntegration();
      const result = await anafIntegration.exchangeCodeForToken(authCode, userId, parsedTenantId);

      if (result.success) {
        return NextResponse.json({
          success: true,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: (result as any).expiresIn || 3600, // Default to 1 hour if not provided
          message: 'Token exchange successful',
        });
      } else {
        return NextResponse.json(
          { 
            error: 'Token exchange failed',
            message: result.error || 'Unknown error'
          },
          { status: 400 }
        );
      }

    } catch (error) {
      console.error('Error exchanging ANAF authorization code:', error);
      return NextResponse.json(
        { 
          error: 'Failed to exchange authorization code',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in ANAF token exchange:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to exchange authorization code'
      },
      { status: 500 }
    );
  }
}
