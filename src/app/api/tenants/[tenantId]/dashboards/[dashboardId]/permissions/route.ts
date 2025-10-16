/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";
import { z } from "zod";

const dashboardPermissionSchema = z.object({
  userId: z.number(),
  canView: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canShare: z.boolean().optional(),
});

const bulkPermissionsSchema = z.object({
  permissions: z.array(dashboardPermissionSchema),
});

/**
 * GET - Get all permissions for a dashboard
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; dashboardId: string }> }
) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { tenantId, dashboardId } = await params;
  const userId = getUserId(sessionResult);
  const role = sessionResult.user.role;

  // Check tenant access
  const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
  if (tenantAccessError) {
    return tenantAccessError;
  }

  // Only admins or dashboard creator can view permissions
  if (role !== "ADMIN") {
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: Number(dashboardId),
        tenantId: Number(tenantId),
        createdBy: userId,
      },
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: "Unauthorized - Only admins or dashboard creators can view permissions" },
        { status: 401 }
      );
    }
  }

  try {
    const permissions = await prisma.dashboardPermission.findMany({
      where: {
        dashboardId: Number(dashboardId),
        tenantId: Number(tenantId),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(permissions);
  } catch (error: any) {
    console.error("Error fetching dashboard permissions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard permissions" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update dashboard permissions (bulk)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; dashboardId: string }> }
) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { tenantId, dashboardId } = await params;
  const userId = getUserId(sessionResult);
  const role = sessionResult.user.role;

  // Check tenant access
  const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
  if (tenantAccessError) {
    return tenantAccessError;
  }

  // Only admins can modify permissions
  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized - Only admins can modify dashboard permissions" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsedData = bulkPermissionsSchema.parse(body);

    // Verify dashboard exists
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: Number(dashboardId),
        tenantId: Number(tenantId),
      },
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    // Process each permission
    const results = [];
    for (const perm of parsedData.permissions) {
      // Check if permission already exists
      const existing = await prisma.dashboardPermission.findUnique({
        where: {
          userId_dashboardId: {
            userId: perm.userId,
            dashboardId: Number(dashboardId),
          },
        },
      });

      if (existing) {
        // Update existing permission
        const updated = await prisma.dashboardPermission.update({
          where: { id: existing.id },
          data: {
            canView: perm.canView ?? existing.canView,
            canEdit: perm.canEdit ?? existing.canEdit,
            canDelete: perm.canDelete ?? existing.canDelete,
            canShare: perm.canShare ?? existing.canShare,
          },
        });
        results.push(updated);
      } else {
        // Create new permission
        const created = await prisma.dashboardPermission.create({
          data: {
            userId: perm.userId,
            dashboardId: Number(dashboardId),
            tenantId: Number(tenantId),
            canView: perm.canView ?? false,
            canEdit: perm.canEdit ?? false,
            canDelete: perm.canDelete ?? false,
            canShare: perm.canShare ?? false,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json({
      message: "Dashboard permissions updated successfully",
      permissions: results,
    });
  } catch (error: any) {
    console.error("Error updating dashboard permissions:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid permission data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update dashboard permissions" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a user's dashboard permission
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; dashboardId: string }> }
) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { tenantId, dashboardId } = await params;
  const userId = getUserId(sessionResult);
  const role = sessionResult.user.role;

  // Check tenant access
  const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
  if (tenantAccessError) {
    return tenantAccessError;
  }

  // Only admins can delete permissions
  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized - Only admins can delete dashboard permissions" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get("userId");

    if (!userIdToRemove) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    await prisma.dashboardPermission.deleteMany({
      where: {
        userId: Number(userIdToRemove),
        dashboardId: Number(dashboardId),
        tenantId: Number(tenantId),
      },
    });

    return NextResponse.json({
      message: "Dashboard permission removed successfully",
    });
  } catch (error: any) {
    console.error("Error deleting dashboard permission:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete dashboard permission" },
      { status: 500 }
    );
  }
}

