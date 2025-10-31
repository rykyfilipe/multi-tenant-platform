/**
 * ANAF Auth Login API Route
 * GET /api/anaf/auth/login
 * 
 * Initiates OAuth2 authorization code flow with mutual TLS
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ANAFAuthService } from '@/lib/anaf/services/anafAuthService';
import { ANAFCertificateService } from '@/lib/anaf/certificate-service';

export async function GET(request: NextRequest) {
  try {
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
        { error: 'No tenant found' },
        { status: 400 }
      );
    }

    // Verify user has uploaded certificate
    const certInfo = await ANAFCertificateService.getCertificateInfo(userId, tenantId);
    
    if (!certInfo) {
      return NextResponse.json(
        {
          error: 'Digital certificate required',
          message: 'Please upload your digital certificate before connecting to ANAF.',
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
        },
        { status: 400 }
      );
    }

    // Generate OAuth2 authorization URL
    const authorizationUrl = await ANAFAuthService.getAuthorizationUrl(userId, tenantId);

    return NextResponse.json({
      authUrl: authorizationUrl,
      certificateInfo: {
        validUntil: certInfo.validTo,
        daysUntilExpiry: certInfo.daysUntilExpiry,
      },
    });
  } catch (error) {
    console.error('[ANAF Auth Login] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to generate authorization URL',
      },
      { status: 500 }
    );
  }
}
