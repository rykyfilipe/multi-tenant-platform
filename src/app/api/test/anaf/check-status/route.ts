import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import { ANAFIntegration } from '@/lib/anaf/anaf-integration';

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }

    const userId = getUserId(sessionResult);
    const body = await request.json();
    const { accessToken, submissionId, config, invoiceId, tenantId } = body;

    if (!submissionId || !invoiceId || !tenantId) {
      return NextResponse.json({ 
        error: 'Submission ID, invoice ID, and tenant ID are required' 
      }, { status: 400 });
    }

    const parsedInvoiceId = parseInt(invoiceId);
    const parsedTenantId = parseInt(tenantId);

    try {
      const anafIntegration = new ANAFIntegration();
      
      // Check the status of the submission
      const result = await anafIntegration.getInvoiceStatus(parsedInvoiceId.toString(), parsedTenantId);

      if (result.status === 'success') {
        return NextResponse.json({
          success: true,
          status: result.status,
          message: 'Status checked successfully',
          data: {
            submissionId,
            status: result.status,
            details: result.message || 'No additional details',
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        return NextResponse.json(
          { 
            error: 'Failed to check submission status',
            message: result.error || 'Unknown error'
          },
          { status: 400 }
        );
      }

    } catch (error) {
      console.error('Error checking submission status:', error);
      return NextResponse.json(
        { 
          error: 'Failed to check submission status',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in status check:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to check submission status'
      },
      { status: 500 }
    );
  }
}