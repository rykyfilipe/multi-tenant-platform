/**
 * ANAF Invoice Upload API Route
 * 
 * POST /api/anaf/invoice/upload
 * 
 * Uploads an invoice to ANAF e-Factura system
 * Uses Bearer token authentication (NOT mTLS)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ANAFInvoiceService } from '@/lib/anaf/services/anafInvoiceService';
import { ANAFAuthService } from '@/lib/anaf/services/anafAuthService';
import { ANAFCertificateService } from '@/lib/anaf/certificate-service';

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

    // Parse request body
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId || typeof invoiceId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Verify user is authenticated with ANAF
    const isAuthenticated = await ANAFAuthService.isAuthenticated(userId, tenantId);
    
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: 'Not authenticated with ANAF',
          message: 'Please connect to ANAF first.',
          action: 'connect_anaf',
        },
        { status: 401 }
      );
    }

    // Check certificate validity
    const certInfo = await ANAFCertificateService.getCertificateInfo(userId, tenantId);
    
    if (!certInfo) {
      return NextResponse.json(
        {
          error: 'Digital certificate not found',
          message: 'Please upload your ANAF digital certificate.',
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

    // Warn if certificate expires soon (< 30 days)
    if (certInfo.daysUntilExpiry <= 30) {
      console.warn(
        `[ANAF Upload] Certificate expires in ${certInfo.daysUntilExpiry} days for user ${userId}`
      );
    }

    // Upload invoice to ANAF
    const result = await ANAFInvoiceService.uploadInvoice(invoiceId, userId, tenantId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to submit invoice',
          timestamp: result.timestamp,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId: result.requestId,
      status: result.status,
      message: result.message,
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
