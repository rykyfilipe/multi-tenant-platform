/**
 * ANAF Auth Login API Route
 * GET /api/anaf/auth/login
 * 
 * Initiates OAuth2 authorization code flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Build OAuth2 authorization URL
    const clientId = process.env.ANAF_CLIENT_ID;
    const redirectUri = process.env.ANAF_REDIRECT_URI;
    const authUrl = process.env.ANAF_AUTH_URL || 'https://logincert.anaf.ro/anaf-oauth2/v1/authorize';

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'ANAF OAuth2 not configured' },
        { status: 500 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({ userId, tenantId, timestamp: Date.now() })
    ).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'efactura',
      state,
    });

    const authorizationUrl = `${authUrl}?${params.toString()}`;

    return NextResponse.json({
      authUrl: authorizationUrl,
    });
  } catch (error) {
    console.error('[ANAF Auth Login] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
