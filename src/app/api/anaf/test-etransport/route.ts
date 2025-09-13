/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import { ANAFAPIService } from '@/lib/anaf/anaf-api-service';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }
    
    const userId = getUserId(sessionResult);
    if (!sessionResult.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userResult = await prisma.user.findFirst({
      where: { email: sessionResult.user.email },
    });

    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userResult.tenantId) {
      return NextResponse.json({ 
        success: false,
        error: "User not associated with any tenant"
      }, { status: 400 });
    }

    const tenantId = userResult.tenantId;
    
    const body = await request.json();
    const { 
      action, 
      documentData, 
      cif, 
      uploadId, 
      documentId, 
      days = 7, 
      environment = 'test' 
    } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: "Action is required (upload, status, list, download)"
      }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'upload':
        if (!documentData || !cif) {
          return NextResponse.json({
            success: false,
            error: "Document data and CIF are required for upload"
          }, { status: 400 });
        }
        result = await ANAFAPIService.uploadToETransport(
          userId,
          tenantId,
          documentData,
          cif,
          environment
        );
        break;

      case 'status':
        if (!uploadId) {
          return NextResponse.json({
            success: false,
            error: "Upload ID is required for status check"
          }, { status: 400 });
        }
        result = await ANAFAPIService.checkETransportStatus(
          userId,
          tenantId,
          uploadId,
          environment
        );
        break;

      case 'list':
        if (!cif) {
          return NextResponse.json({
            success: false,
            error: "CIF is required for document list"
          }, { status: 400 });
        }
        result = await ANAFAPIService.getETransportList(
          userId,
          tenantId,
          days,
          cif,
          environment
        );
        break;

      case 'download':
        if (!documentId) {
          return NextResponse.json({
            success: false,
            error: "Document ID is required for download"
          }, { status: 400 });
        }
        result = await ANAFAPIService.downloadETransportDocument(
          userId,
          tenantId,
          documentId,
          environment
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action. Must be one of: upload, status, list, download"
        }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing e-Transport:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
