import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, xmlContent, config, invoiceId } = await request.json();

    if (!accessToken || !xmlContent) {
      return NextResponse.json({
        success: false,
        error: 'Access token and XML content are required'
      }, { status: 400 });
    }

    const baseUrl = config.baseUrl || process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest';

    // Submit invoice to ANAF
    const response = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/xml',
        'User-Agent': 'ANAF-Test-UI/1.0'
      },
      body: xmlContent,
      signal: AbortSignal.timeout(60000)
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        submissionId: data.submissionId || data.id || 'unknown',
        status: data.status || 'submitted',
        message: data.message || 'Invoice submitted successfully',
        invoiceId: invoiceId,
        response: data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${data.message || 'Unknown error'}`,
        invoiceId: invoiceId,
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
