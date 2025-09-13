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
    const { accessToken, xmlContent, config, invoiceId, tenantId } = body;

    if (!accessToken || !xmlContent || !invoiceId || !tenantId) {
      return NextResponse.json({ 
        error: 'Access token, XML content, invoice ID, and tenant ID are required' 
      }, { status: 400 });
    }

    const parsedInvoiceId = parseInt(invoiceId);
    const parsedTenantId = parseInt(tenantId);

    try {
      const anafIntegration = new ANAFIntegration();
      
      // Submit the invoice to ANAF
      const result = await anafIntegration.submitInvoice(parsedInvoiceId, parsedTenantId, {
        userId,
        submissionType: 'test',
        language: 'ro',
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          submissionId: result.submissionId,
          status: result.status,
          message: 'Invoice submitted to ANAF successfully',
          data: {
            invoiceId: parsedInvoiceId,
            submissionId: result.submissionId,
            status: result.status,
            timestamp: result.timestamp,
          },
        });
      } else {
        return NextResponse.json(
          { 
            error: 'Failed to submit invoice to ANAF',
            message: result.error || 'Unknown error',
            details: result.message
          },
          { status: 400 }
        );
      }

    } catch (error) {
      console.error('Error submitting invoice to ANAF:', error);
      return NextResponse.json(
        { 
          error: 'Failed to submit invoice to ANAF',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in invoice submission:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to submit invoice to ANAF'
      },
      { status: 500 }
    );
  }
}
