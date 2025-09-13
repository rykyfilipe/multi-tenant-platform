import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, clientId, redirectUri } = await request.json();

    if (!clientId || !redirectUri) {
      return NextResponse.json({
        success: false,
        error: 'Client ID and Redirect URI are required'
      }, { status: 400 });
    }

    // Generate OAuth authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'e-factura',
      state: 'test-state-' + Date.now()
    });

    const authUrl = `${baseUrl}/oauth/authorize?${params.toString()}`;

    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Authorization URL generated successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
