/**
 * ANAF Auth Status API Route
 * GET /api/anaf/auth/status
 * 
 * Returns OAuth2 authentication status and certificate info for current user
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
      return NextResponse.json({
        authenticated: false,
        hasCertificate: false,
        certificateValid: false,
      });
    }

    const userId = parseInt(session.user.id);
    const tenantId = session.user.tenantId ? parseInt(session.user.tenantId) : null;

    if (!tenantId) {
      return NextResponse.json({
        authenticated: false,
        hasCertificate: false,
        certificateValid: false,
        error: 'No tenant found',
      });
    }

    // Check OAuth authentication status
    const isAuthenticated = await ANAFAuthService.isAuthenticated(userId, tenantId);

    // Check certificate status
    const certInfo = await ANAFCertificateService.getCertificateInfo(userId, tenantId);

    return NextResponse.json({
      authenticated: isAuthenticated,
      hasCertificate: !!certInfo,
      certificateValid: certInfo?.isValid || false,
      certificateInfo: certInfo ? {
        subject: certInfo.subject,
        issuer: certInfo.issuer,
        validFrom: certInfo.validFrom,
        validTo: certInfo.validTo,
        daysUntilExpiry: certInfo.daysUntilExpiry,
        serialNumber: certInfo.serialNumber,
      } : null,
    });
  } catch (error) {
    console.error('[ANAF Auth Status] Error:', error);
    
    return NextResponse.json({
      authenticated: false,
      hasCertificate: false,
      certificateValid: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
