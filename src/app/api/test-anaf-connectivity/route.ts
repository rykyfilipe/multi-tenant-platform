/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { ANAFOAuthService } from '@/lib/anaf/oauth-service';

export async function GET(request: NextRequest) {
  try {
    
    // Test the TestOauth service as per ANAF documentation
    const connectivityResult = await ANAFOAuthService.testSandboxConnectivity();
    
    return NextResponse.json({
      success: connectivityResult.success,
      message: connectivityResult.success ? 'ANAF sandbox is accessible' : 'ANAF sandbox returned error',
      data: {
        status: connectivityResult.status,
        statusText: connectivityResult.statusText,
        url: 'https://api.anaf.ro/TestOauth/jaxrs/hello?name=Test%20Connectivity',
        response: connectivityResult.response,
        timestamp: connectivityResult.timestamp,
        note: connectivityResult.status === 401 ? '401 Unauthorized is expected for TestOauth without authentication - this indicates the service is working correctly' : undefined
      }
    });

  } catch (error) {
    console.error('ANAF connectivity test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'ANAF connectivity test failed'
    }, { status: 500 });
  }
}
