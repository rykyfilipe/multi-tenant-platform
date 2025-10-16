/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";

/**
 * Deactivate a user (soft delete)
 * User can still be reactivated later
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { tenantId, userId: userIdToDeactivate } = await params;
  const userId = getUserId(sessionResult);
  const role = sessionResult.user.role;

  // Check tenant access
  const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
  if (tenantAccessError) {
    return tenantAccessError;
  }

  // Only admins can deactivate users
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized - Only admins can deactivate users" }, { status: 401 });
  }

  try {
    // Verify user exists and is in the tenant
    const userToDeactivate = await prisma.user.findFirst({
      where: {
        id: Number(userIdToDeactivate),
        tenantId: Number(tenantId),
      },
    });

    if (!userToDeactivate) {
      return NextResponse.json(
        { error: "User not found in this tenant" },
        { status: 404 }
      );
    }

    // Check if user is already deactivated
    if (!userToDeactivate.isActive) {
      return NextResponse.json(
        { error: "User is already deactivated" },
        { status: 400 }
      );
    }

    // Prevent deactivating the last admin
    if (userToDeactivate.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: {
          tenantId: Number(tenantId),
          role: "ADMIN",
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot deactivate the last admin. Assign another admin first." },
          { status: 400 }
        );
      }
    }

    // Deactivate user
    const deactivatedUser = await prisma.user.update({
      where: { id: Number(userIdToDeactivate) },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        deactivatedAt: true,
      },
    });

    // Delete active sessions to force logout
    await prisma.session.deleteMany({
      where: { userId: Number(userIdToDeactivate) },
    });

    return NextResponse.json({
      message: "User deactivated successfully",
      user: deactivatedUser,
    });
  } catch (error: any) {
    console.error("Error deactivating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to deactivate user" },
      { status: 500 }
    );
  }
}

