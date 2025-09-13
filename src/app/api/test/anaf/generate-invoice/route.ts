import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import { ANAFXMLGenerator } from '@/lib/anaf/xml-generator';
import { ANAFIntegration } from '@/lib/anaf/anaf-integration';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }

    const userId = getUserId(sessionResult);
    const body = await request.json();
    const { invoiceId, tenantId } = body;

    if (!invoiceId || !tenantId) {
      return NextResponse.json({ 
        error: 'Invoice ID and Tenant ID are required' 
      }, { status: 400 });
    }

    const parsedInvoiceId = parseInt(invoiceId);
    const parsedTenantId = parseInt(tenantId);

    try {
      const anafIntegration = new ANAFIntegration();
      const invoiceData = await (anafIntegration as any).getInvoiceData(parsedInvoiceId, parsedTenantId);

      if (!invoiceData) {
        return NextResponse.json(
          { error: 'Invoice not found or access denied' },
          { status: 404 }
        );
      }

      // Generate XML using the new XML generator
      const xmlContent = ANAFXMLGenerator.generateXML({
        invoiceData: invoiceData.invoice,
        companyData: invoiceData.company,
        customerData: invoiceData.customer,
        language: 'ro',
        includeSignature: false // Don't include signature for testing
      });

      return NextResponse.json({
        success: true,
        xmlContent,
        message: 'Invoice XML generated successfully',
        data: {
          invoiceId: parsedInvoiceId,
          invoiceNumber: invoiceData.invoice.invoiceNumber,
          xmlLength: xmlContent.length,
        },
      });

    } catch (error) {
      console.error('Error generating invoice XML:', error);
      return NextResponse.json(
        { 
          error: 'Failed to generate invoice XML',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in invoice XML generation:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to generate invoice XML'
      },
      { status: 500 }
    );
  }
}
