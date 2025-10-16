/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";

/**
 * Reactivate a deactivated user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { tenantId, userId: userIdToActivate } = await params;
  const userId = getUserId(sessionResult);
  const role = sessionResult.user.role;

  // Check tenant access
  const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
  if (tenantAccessError) {
    return tenantAccessError;
  }

  // Only admins can reactivate users
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized - Only admins can reactivate users" }, { status: 401 });
  }

  try {
    // Verify user exists and is in the tenant
    const userToActivate = await prisma.user.findFirst({
      where: {
        id: Number(userIdToActivate),
        tenantId: Number(tenantId),
      },
    });

    if (!userToActivate) {
      return NextResponse.json(
        { error: "User not found in this tenant" },
        { status: 404 }
      );
    }

    // Check if user is already active
    if (userToActivate.isActive) {
      return NextResponse.json(
        { error: "User is already active" },
        { status: 400 }
      );
    }

    // Reactivate user
    const activatedUser = await prisma.user.update({
      where: { id: Number(userIdToActivate) },
      data: {
        isActive: true,
        deactivatedAt: null,
        deactivatedBy: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "User reactivated successfully",
      user: activatedUser,
    });
  } catch (error: any) {
    console.error("Error reactivating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reactivate user" },
      { status: 500 }
    );
  }
}

