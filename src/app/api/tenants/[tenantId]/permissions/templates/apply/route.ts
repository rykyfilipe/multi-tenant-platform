/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getTemplateById, applyTemplateToTables, applyTemplateToDashboards } from "@/lib/permission-templates";

const applyTemplateSchema = z.object({
  templateId: z.string(),
  userIds: z.array(z.number()).min(1, "At least one user is required"),
  applyToTables: z.boolean().default(true),
  applyToDashboards: z.boolean().default(true),
  tableIds: z.array(z.number()).optional(), // If empty, apply to all tables
  dashboardIds: z.array(z.number()).optional(), // If empty, apply to all dashboards
});

/**
 * POST - Apply a permission template to multiple users
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

  // Only admins can apply templates
  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized - Only admins can apply permission templates" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsedData = applyTemplateSchema.parse(body);

    // Get template
    const template = getTemplateById(parsedData.templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const results = {
      tablePermissions: 0,
      dashboardPermissions: 0,
      users: parsedData.userIds.length,
    };

    // Apply to tables
    if (parsedData.applyToTables && template.permissions.tables) {
      let tableIds = parsedData.tableIds;
      
      // If no specific tables, get all tables in tenant
      if (!tableIds || tableIds.length === 0) {
        const tables = await prisma.table.findMany({
          where: {
            database: {
              tenantId: Number(tenantId),
            },
          },
          select: { id: true },
        });
        tableIds = tables.map(t => t.id);
      }

      // Apply template to each user for each table
      for (const targetUserId of parsedData.userIds) {
        for (const tableId of tableIds) {
          // Upsert permission
          await prisma.tablePermission.upsert({
            where: {
              userId_tableId: {
                userId: targetUserId,
                tableId: tableId,
              },
            },
            create: {
              userId: targetUserId,
              tableId: tableId,
              tenantId: Number(tenantId),
              canRead: template.permissions.tables!.canRead,
              canEdit: template.permissions.tables!.canEdit,
              canDelete: template.permissions.tables!.canDelete,
            },
            update: {
              canRead: template.permissions.tables!.canRead,
              canEdit: template.permissions.tables!.canEdit,
              canDelete: template.permissions.tables!.canDelete,
            },
          });
          results.tablePermissions++;
        }
      }
    }

    // Apply to dashboards
    if (parsedData.applyToDashboards && template.permissions.dashboards) {
      let dashboardIds = parsedData.dashboardIds;
      
      // If no specific dashboards, get all dashboards in tenant
      if (!dashboardIds || dashboardIds.length === 0) {
        const dashboards = await prisma.dashboard.findMany({
          where: {
            tenantId: Number(tenantId),
          },
          select: { id: true },
        });
        dashboardIds = dashboards.map(d => d.id);
      }

      // Apply template to each user for each dashboard
      for (const targetUserId of parsedData.userIds) {
        for (const dashboardId of dashboardIds) {
          // Upsert permission
          await prisma.dashboardPermission.upsert({
            where: {
              userId_dashboardId: {
                userId: targetUserId,
                dashboardId: dashboardId,
              },
            },
            create: {
              userId: targetUserId,
              dashboardId: dashboardId,
              tenantId: Number(tenantId),
              canView: template.permissions.dashboards!.canView,
              canEdit: template.permissions.dashboards!.canEdit,
              canDelete: template.permissions.dashboards!.canDelete,
              canShare: template.permissions.dashboards!.canShare,
            },
            update: {
              canView: template.permissions.dashboards!.canView,
              canEdit: template.permissions.dashboards!.canEdit,
              canDelete: template.permissions.dashboards!.canDelete,
              canShare: template.permissions.dashboards!.canShare,
            },
          });
          results.dashboardPermissions++;
        }
      }
    }

    return NextResponse.json({
      message: `Template "${template.name}" applied successfully`,
      results,
    });
  } catch (error: any) {
    console.error("Error applying template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to apply template" },
      { status: 500 }
    );
  }
}

