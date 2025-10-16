/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

const customRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
  icon: z.string().optional().default("👤"),
  permissions: z.object({
    tables: z.object({
      canRead: z.boolean(),
      canEdit: z.boolean(),
      canDelete: z.boolean(),
    }).optional(),
    dashboards: z.object({
      canView: z.boolean(),
      canEdit: z.boolean(),
      canDelete: z.boolean(),
      canShare: z.boolean(),
    }).optional(),
    columns: z.object({
      canRead: z.boolean(),
      canEdit: z.boolean(),
    }).optional(),
  }),
});

/**
 * GET - Get all custom roles for a tenant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { tenantId } = await params;

  try {
    const customRoles = await prisma.customRole.findMany({
      where: {
        tenantId: Number(tenantId),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customRoles);
  } catch (error: any) {
    console.error("Error fetching custom roles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch custom roles" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new custom role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { tenantId } = await params;
  const userId = getUserId(sessionResult);
  const role = sessionResult.user.role;

  // Only admins can create custom roles
  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized - Only admins can create custom roles" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsedData = customRoleSchema.parse(body);

    // Check if role name already exists
    const existingRole = await prisma.customRole.findUnique({
      where: {
        tenantId_name: {
          tenantId: Number(tenantId),
          name: parsedData.name,
        },
      },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "A role with this name already exists" },
        { status: 400 }
      );
    }

    // Create custom role
    const customRole = await prisma.customRole.create({
      data: {
        tenantId: Number(tenantId),
        name: parsedData.name,
        description: parsedData.description,
        color: parsedData.color,
        icon: parsedData.icon,
        permissions: parsedData.permissions as any,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log creation
    await createAuditLog({
      tenantId: Number(tenantId),
      userId,
      action: "custom_role.created",
      resourceType: "custom_role",
      resourceId: customRole.id,
      metadata: {
        roleName: customRole.name,
        permissions: parsedData.permissions,
      },
      request,
    });

    return NextResponse.json(customRole, { status: 201 });
  } catch (error: any) {
    console.error("Error creating custom role:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid role data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create custom role" },
      { status: 500 }
    );
  }
}

