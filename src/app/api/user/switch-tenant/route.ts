/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS, RESOURCE_TYPES } from "@/lib/audit-log";

/**
 * POST - Switch user's active tenant
 */
export async function POST(request: NextRequest) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const userId = getUserId(sessionResult);

  try {
    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this tenant
    const userTenant = await prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: Number(tenantId),
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!userTenant || !userTenant.isActive) {
      return NextResponse.json(
        { error: "You don't have access to this tenant" },
        { status: 403 }
      );
    }

    // Update user's active tenant
    await prisma.user.update({
      where: { id: userId },
      data: {
        activeTenantId: Number(tenantId),
        // Also update legacy tenantId for backward compatibility
        tenantId: Number(tenantId),
      },
    });

    // Update lastAccessedAt for this tenant
    await prisma.userTenant.update({
      where: {
        userId_tenantId: {
          userId,
          tenantId: Number(tenantId),
        },
      },
      data: {
        lastAccessedAt: new Date(),
      },
    });

    // Log tenant switch
    await createAuditLog({
      tenantId: Number(tenantId),
      userId,
      action: "tenant.switched",
      resourceType: "tenant",
      resourceId: Number(tenantId),
      metadata: {
        tenantName: userTenant.tenant.name,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: userTenant.tenant.id,
        name: userTenant.tenant.name,
        role: userTenant.role,
      },
    });
  } catch (error: any) {
    console.error("Error switching tenant:", error);
    return NextResponse.json(
      { error: error.message || "Failed to switch tenant" },
      { status: 500 }
    );
  }
}

