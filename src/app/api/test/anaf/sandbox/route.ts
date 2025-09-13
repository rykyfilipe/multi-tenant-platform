import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }

    const userId = getUserId(sessionResult);

    // Test ANAF sandbox connectivity
    const anafBaseUrl = process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest';
    const testUrl = `${anafBaseUrl}/status`;

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MultiTenantPlatform/1.0',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseText = await response.text();
      
      // Try to parse as JSON, but don't fail if it's not JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawResponse: responseText.substring(0, 500) };
      }

      return NextResponse.json({
        success: true,
        message: 'ANAF sandbox is accessible',
        data: {
          status: response.status,
          statusText: response.statusText,
          url: testUrl,
          response: responseData,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (fetchError) {
      console.error('ANAF sandbox connectivity test failed:', fetchError);
      
      return NextResponse.json({
        success: false,
        message: 'ANAF sandbox is not accessible',
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        data: {
          url: testUrl,
          timestamp: new Date().toISOString(),
        },
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error in ANAF sandbox test:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to test ANAF sandbox connectivity'
      },
      { status: 500 }
    );
  }
}
