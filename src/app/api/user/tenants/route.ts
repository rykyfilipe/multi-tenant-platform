/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";

/**
 * GET - Get all tenants the current user belongs to
 */
export async function GET(request: NextRequest) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const userId = getUserId(sessionResult);

  try {
    // Get all UserTenant relationships for this user
    const userTenants = await prisma.userTenant.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        lastAccessedAt: 'desc', // Most recently accessed first
      },
    });

    // Get user's active tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeTenantId: true },
    });

    const tenants = userTenants.map(ut => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      logoUrl: ut.tenant.logoUrl,
      role: ut.role,
      joinedAt: ut.joinedAt,
      lastAccessedAt: ut.lastAccessedAt,
      isActive: ut.tenant.id === user?.activeTenantId,
    }));

    return NextResponse.json({
      tenants,
      activeTenantId: user?.activeTenantId,
    });
  } catch (error: any) {
    console.error("Error fetching user tenants:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}

