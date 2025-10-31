/**
 * ANAF Certificate Revoke API Route
 * POST /api/anaf/certificate/revoke
 * 
 * Revokes (deletes) the uploaded digital certificate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
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

    // Delete certificate from database
    const deleted = await prisma.aNAFCertificate.deleteMany({
      where: {
        userId,
        tenantId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'No certificate found to revoke' },
        { status: 404 }
      );
    }

    // Log audit event
    await prisma.aNAFAuditLog.create({
      data: {
        userId,
        tenantId,
        action: 'certificate_revoke',
        status: 'success',
        metadata: {
          timestamp: new Date().toISOString(),
          deletedCount: deleted.count,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Certificate revoked successfully',
    });
  } catch (error) {
    console.error('[ANAF Certificate Revoke] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed - Use POST' },
    { status: 405 }
  );
}
