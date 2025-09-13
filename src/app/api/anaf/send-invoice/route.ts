/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, requireTenantAccess, getUserId } from '@/lib/session';
import { ANAFIntegration } from '@/lib/anaf/anaf-integration';
import { z } from 'zod';
import prisma from '@/lib/prisma';
const SendInvoiceSchema = z.object({
  invoiceId: z.number().min(1, 'Invoice ID is required'),
  submissionType: z.enum(['automatic', 'manual']).default('manual'),
  language: z.string().optional().default('ro'),
});

export async function POST(request: NextRequest) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const userId = getUserId(sessionResult);
  if (!sessionResult.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate request body
    const parseResult = SendInvoiceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: parseResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { invoiceId, submissionType, language } = parseResult.data;

    // Get tenant ID from request headers or body
    const tenantId = request.headers.get('x-tenant-id') || body.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Check tenant access
    const tenantAccessError = requireTenantAccess(sessionResult, tenantId.toString());
    if (tenantAccessError) {
      return tenantAccessError;
    }

    // Initialize ANAF integration
    const anafIntegration = new ANAFIntegration();

    // Submit invoice
    const result = await anafIntegration.submitInvoice(invoiceId, parseInt(tenantId), {
      userId,
      submissionType,
      language,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Invoice submitted to ANAF successfully',
        data: {
          submissionId: result.submissionId,
          status: result.status,
          timestamp: result.timestamp,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to submit invoice to ANAF',
          message: result.message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in send-invoice API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while submitting the invoice'
      },
      { status: 500 }
    );
  }
}
