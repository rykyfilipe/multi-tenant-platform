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

    // Get token info if authenticated
    let tokenInfo = null;
    if (isAuthenticated) {
      try {
        const token = await ANAFAuthService.getStoredToken(userId, tenantId);
        if (token) {
          const now = Date.now();
          const expiresAt = token.expiresAt.getTime();
          const expiresIn = Math.max(0, Math.floor((expiresAt - now) / 1000)); // seconds
          const willRefreshSoon = (expiresAt - now) < 5 * 60 * 1000; // <5 minutes
          
          tokenInfo = {
            expiresAt: token.expiresAt.toISOString(),
            expiresIn, // seconds
            expiresInMinutes: Math.floor(expiresIn / 60),
            willRefreshSoon,
            hasRefreshToken: !!token.refreshToken,
            isExpired: expiresIn <= 0,
          };
        }
      } catch (error) {
        console.error('[ANAF Auth Status] Error getting token info:', error);
      }
    }

    // Check certificate status
    const certInfo = await ANAFCertificateService.getCertificateInfo(userId, tenantId);

    return NextResponse.json({
      authenticated: isAuthenticated,
      hasCertificate: !!certInfo,
      certificateValid: certInfo?.isValid || false,
      token: tokenInfo,
      certificate: certInfo ? {
        commonName: certInfo.subject,
        organization: certInfo.issuer, // Use issuer as organization for now
        issuer: certInfo.issuer,
        validFrom: certInfo.validFrom,
        validTo: certInfo.validTo,
        daysUntilExpiry: certInfo.daysUntilExpiry,
        isValid: certInfo.isValid,
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
