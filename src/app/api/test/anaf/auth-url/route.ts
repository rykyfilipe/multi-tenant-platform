import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import { ANAFOAuthService } from '@/lib/anaf/oauth-service';

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }

    const userId = getUserId(sessionResult);
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const parsedTenantId = parseInt(tenantId);

    try {
      const authUrl = await ANAFOAuthService.getAuthUrl(userId, parsedTenantId);
      
      return NextResponse.json({
        success: true,
        authUrl,
        message: 'Authorization URL generated successfully',
      });

    } catch (error) {
      console.error('Error generating ANAF auth URL:', error);
      return NextResponse.json(
        { 
          error: 'Failed to generate authorization URL',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in ANAF auth URL generation:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to generate authorization URL'
      },
      { status: 500 }
    );
  }
}
