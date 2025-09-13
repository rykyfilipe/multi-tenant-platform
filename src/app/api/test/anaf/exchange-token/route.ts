import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, clientId, clientSecret, redirectUri, authCode } = await request.json();

    if (!clientId || !clientSecret || !redirectUri || !authCode) {
      return NextResponse.json({
        success: false,
        error: 'Client ID, Client Secret, Redirect URI, and Authorization Code are required'
      }, { status: 400 });
    }

    // Exchange authorization code for access token
    const response = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ANAF-Test-UI/1.0'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: authCode
      }).toString(),
      signal: AbortSignal.timeout(30000)
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
        message: 'Token obtained successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${data.message || 'Unknown error'}`,
        details: data
      }, { status: response.status });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
