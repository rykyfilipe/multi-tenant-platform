/**
 * ANAF Certificate Upload API Route
 * 
 * POST /api/anaf/certificate/upload
 * 
 * Uploads a digital certificate for ANAF e-Factura integration.
 * Accepts PKCS12 format (.pfx / .p12) with password.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ANAFCertificateService } from '@/lib/anaf/certificate-service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
        { error: 'Tenant not found' },
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const certificateFile = formData.get('certificate') as File;
    const password = formData.get('password') as string;

    if (!certificateFile) {
      return NextResponse.json(
        { error: 'Certificate file is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Certificate password is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/x-pkcs12',
      'application/x-p12',
      'application/octet-stream',
    ];
    
    const fileName = certificateFile.name.toLowerCase();
    const hasValidExtension = fileName.endsWith('.pfx') || fileName.endsWith('.p12');
    
    if (!hasValidExtension && !allowedTypes.includes(certificateFile.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          message: 'Only .pfx and .p12 certificate files are allowed',
        },
        { status: 400 }
      );
    }

    // Check file size
    if (certificateFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await certificateFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // First, validate the certificate
    const validation = await ANAFCertificateService.validateCertificate(buffer, password);
    
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid certificate',
          message: validation.errors.join(', '),
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Upload certificate
    const result = await ANAFCertificateService.uploadCertificate(
      userId,
      tenantId,
      buffer,
      password
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to upload certificate',
          message: result.error,
        },
        { status: 500 }
      );
    }

    // Return success with certificate info and warnings
    return NextResponse.json({
      success: true,
      certificateId: result.certificateId,
      message: 'Certificate uploaded successfully',
      info: result.info,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error('[ANAF Certificate Upload] Error:', error);
    
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
      message: 'Use POST to upload certificate',
    },
    { status: 405 }
  );
}
