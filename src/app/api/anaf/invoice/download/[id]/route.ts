/**
 * ANAF Invoice Download API Route
 * 
 * GET /api/anaf/invoice/download/[id]
 * 
 * Downloads the validated invoice response from ANAF.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ANAFIntegration } from '@/lib/anaf/anaf-integration';
import { ANAFRateLimiter } from '@/lib/anaf/rate-limiter';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;
    const submissionId = params.id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      );
    }

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submission ID' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateLimitKey = `anaf_download_${userId}_${tenantId}`;
    const rateLimit = ANAFRateLimiter.checkRateLimit(rateLimitKey);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimit.retryAfter,
          message: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
        },
        { status: 429 }
      );
    }

    // Download invoice response from ANAF
    const anafIntegration = new ANAFIntegration();
    const result = await anafIntegration.downloadResponse(submissionId, tenantId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to download invoice response',
          message: result.error,
        },
        { status: 500 }
      );
    }

    // Return file as XML download
    return new NextResponse(result.content, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename || `anaf_response_${submissionId}.xml`}"`,
        'X-Submission-ID': submissionId,
      },
    });
  } catch (error) {
    console.error('[ANAF Download] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Use GET to download invoice response',
    },
    { status: 405 }
  );
}
