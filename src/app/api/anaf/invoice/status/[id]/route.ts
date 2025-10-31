/**
 * ANAF Invoice Status API Route
 * 
 * GET /api/anaf/invoice/status/[id]
 * 
 * Checks the status of an invoice submission to ANAF.
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
    const rateLimitKey = `anaf_status_${userId}_${tenantId}`;
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

    // Get invoice status from ANAF
    const anafIntegration = new ANAFIntegration();
    const result = await anafIntegration.getInvoiceStatus(submissionId, tenantId);

    if (result.status === 'error') {
      return NextResponse.json(
        {
          error: 'Failed to get invoice status',
          message: result.error,
          timestamp: result.timestamp,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: result.submissionId,
      status: result.status,
      message: result.message,
      timestamp: result.timestamp,
      responseData: result.responseData,
    });
  } catch (error) {
    console.error('[ANAF Status] Error:', error);
    
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
      message: 'Use GET to check invoice status',
    },
    { status: 405 }
  );
}
