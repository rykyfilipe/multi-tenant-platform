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

    // If we have a submission ID, check status with ANAF
    if (submissionLog.submissionId) {
      try {
        const anafIntegration = new ANAFIntegration();
        const statusResult = await anafIntegration.getInvoiceStatus(
          submissionLog.submissionId,
          parseInt(tenantId)
        );

        // Update local status if it changed
        if (statusResult.status !== submissionLog.status) {
          await prisma.anafSubmissionLog.update({
            where: { id: submissionLog.id },
            data: {
              status: statusResult.status as any,
              message: statusResult.message,
              updatedAt: new Date(),
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            submissionId: submissionLog.submissionId,
            status: statusResult.status,
            message: statusResult.message,
            error: statusResult.error,
            submittedAt: submissionLog.submittedAt,
            updatedAt: new Date(),
            submissionType: submissionLog.submissionType,
            retryCount: submissionLog.retryCount,
          },
        });
      } catch (error) {
        console.error('Error checking ANAF status:', error);
        // Return local status if ANAF check fails
      }
    }

    // Return local status
    return NextResponse.json({
      success: true,
      data: {
        submissionId: submissionLog.submissionId,
        status: submissionLog.status,
        message: submissionLog.message,
        error: submissionLog.error,
        submittedAt: submissionLog.submittedAt,
        updatedAt: submissionLog.updatedAt,
        submissionType: submissionLog.submissionType,
        retryCount: submissionLog.retryCount,
      },
    });
  } catch (error) {
    console.error('Error in invoice-status API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while checking invoice status'
      },
      { status: 500 }
    );
  }
}
