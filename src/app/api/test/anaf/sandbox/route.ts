import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest';
    
    // Test sandbox connectivity
    const endpoints = [
      { path: '/health', name: 'Health Check' },
      { path: '/api/v1/status', name: 'Status Endpoint' },
      { path: '/api/v1/invoices', name: 'Invoices Endpoint' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'ANAF-Test-UI/1.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });

        results.push({
          endpoint: endpoint.name,
          url: `${baseUrl}${endpoint.path}`,
          status: response.status,
          accessible: response.status === 401 || response.status === 200, // 401 is expected for protected endpoints
          message: response.status === 401 ? 'Requires authentication (expected)' : 
                   response.status === 200 ? 'Accessible' : 
                   `Unexpected status: ${response.status}`
        });
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          url: `${baseUrl}${endpoint.path}`,
          status: 0,
          accessible: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const allAccessible = results.every(r => r.accessible);
    
    return NextResponse.json({
      success: allAccessible,
      baseUrl,
      results,
      message: allAccessible ? 'Sandbox is accessible' : 'Some endpoints are not accessible'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
