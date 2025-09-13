/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, requireTenantAccess, getUserId } from '@/lib/session';
import { ANAFIntegration } from '@/lib/anaf/anaf-integration';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const userId = getUserId(sessionResult);
  if (!sessionResult.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { invoiceId } = await params;
    const invoiceIdNum = parseInt(invoiceId);
    
    if (isNaN(invoiceIdNum)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Get tenant ID from request headers
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Check tenant access
    const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
    if (tenantAccessError) {
      return tenantAccessError;
    }

    // Get submission log for this invoice
    const submissionLog = await prisma.anafSubmissionLog.findFirst({
      where: {
        invoiceId: invoiceIdNum,
        tenantId: parseInt(tenantId),
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    if (!submissionLog) {
      return NextResponse.json(
        { 
          error: 'No ANAF submission found for this invoice',
          status: 'not_submitted'
        },
        { status: 404 }
      );
    }

    if (!submissionLog.submissionId) {
      return NextResponse.json(
        { 
          error: 'No submission ID available for this invoice',
          status: 'no_submission_id'
        },
        { status: 400 }
      );
    }

    // Download response from ANAF
    try {
      const anafIntegration = new ANAFIntegration();
      const downloadResult = await anafIntegration.downloadResponse(
        submissionLog.submissionId,
        parseInt(tenantId)
      );

      if (downloadResult.success && downloadResult.content) {
        // Update submission log with response
        await prisma.anafSubmissionLog.update({
          where: { id: submissionLog.id },
          data: {
            responseXml: downloadResult.content,
            updatedAt: new Date(),
          },
        });

        // Return the response content
        return new NextResponse(downloadResult.content, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="${downloadResult.filename || `anaf_response_${submissionLog.submissionId}.xml`}"`,
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: downloadResult.error || 'Failed to download response from ANAF',
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error downloading ANAF response:', error);
      
      // If we have a stored response, return that
      if (submissionLog.responseXml) {
        return new NextResponse(submissionLog.responseXml, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="anaf_response_${submissionLog.submissionId}.xml"`,
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to download response from ANAF',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in download-response API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while downloading the response'
      },
      { status: 500 }
    );
  }
}
