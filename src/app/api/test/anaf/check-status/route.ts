import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, submissionId, config } = await request.json();

    if (!accessToken || !submissionId) {
      return NextResponse.json({
        success: false,
        error: 'Access token and submission ID are required'
      }, { status: 400 });
    }

    const baseUrl = config.baseUrl || process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest';

    // Check invoice status
    const response = await fetch(`${baseUrl}/api/v1/invoices/${submissionId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'ANAF-Test-UI/1.0'
      },
      signal: AbortSignal.timeout(30000)
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        status: data.status || 'unknown',
        message: data.message || 'Status retrieved successfully',
        submissionId: data.submissionId || submissionId,
        timestamp: data.timestamp || new Date().toISOString(),
        response: data
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
