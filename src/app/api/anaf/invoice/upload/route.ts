/**
 * ANAF Invoice Upload API Route
 * 
 * POST /api/anaf/invoice/upload
 * 
 * Uploads an invoice to ANAF e-Factura system.
 * Requires valid authentication and digital certificate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ANAFIntegration } from '@/lib/anaf/anaf-integration';
import { ANAFCertificateService } from '@/lib/anaf/certificate-service';
import { ANAFRateLimiter } from '@/lib/anaf/rate-limiter';

export async function POST(request: NextRequest) {
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

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateLimitKey = `anaf_upload_${userId}_${tenantId}`;
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

    // Parse request body
    const body = await request.json();
    const { invoiceId, submissionType = 'manual' } = body;

    if (!invoiceId || typeof invoiceId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Check if certificate exists
    const certInfo = await ANAFCertificateService.getCertificateInfo(userId, tenantId);
    
    if (!certInfo) {
      return NextResponse.json(
        {
          error: 'Digital certificate not found',
          message: 'Please upload your ANAF digital certificate before submitting invoices.',
          action: 'upload_certificate',
        },
        { status: 400 }
      );
    }

    if (!certInfo.isValid) {
      return NextResponse.json(
        {
          error: 'Certificate expired',
          message: 'Your digital certificate has expired. Please upload a new certificate.',
          action: 'upload_certificate',
          expiredAt: certInfo.validTo,
        },
        { status: 400 }
      );
    }

    // Warn if certificate expires soon
    if (certInfo.daysUntilExpiry <= 30) {
      console.warn(
        `[ANAF Upload] Certificate expires in ${certInfo.daysUntilExpiry} days for user ${userId}`
      );
    }

    // Submit invoice to ANAF
    const anafIntegration = new ANAFIntegration();
    const result = await anafIntegration.submitInvoice(invoiceId, tenantId, {
      userId,
      submissionType,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to submit invoice',
          message: result.error,
          timestamp: result.timestamp,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: result.submissionId,
      message: result.message,
      status: result.status,
      timestamp: result.timestamp,
      certificateInfo: {
        validUntil: certInfo.validTo,
        daysUntilExpiry: certInfo.daysUntilExpiry,
      },
    });
  } catch (error) {
    console.error('[ANAF Upload] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Use POST to upload invoices',
    },
    { status: 405 }
  );
}
