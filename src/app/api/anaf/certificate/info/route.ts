/**
 * ANAF Certificate Info API Route
 * GET /api/anaf/certificate/info
 * 
 * Returns information about the uploaded digital certificate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Get certificate info
    const certificateInfo = await ANAFCertificateService.getCertificateInfo(userId, tenantId);

    if (!certificateInfo) {
      return NextResponse.json(
        { certificate: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      certificate: certificateInfo,
    });
  } catch (error) {
    console.error('[ANAF Certificate Info] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
