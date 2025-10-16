/** @format */

import prisma from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

/**
 * Check and revoke expired permissions
 * This should be run as a cron job or scheduled task
 */
export async function revokeExpiredPermissions() {
  const now = new Date();

  try {
    // Revoke expired table permissions
    const expiredTablePerms = await prisma.tablePermission.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    for (const perm of expiredTablePerms) {
      await prisma.tablePermission.delete({
        where: { id: perm.id },
      });

      await createAuditLog({
        tenantId: perm.tenantId,
        userId: perm.userId,
        action: "permission.auto_revoked_expired",
        resourceType: "table_permission",
        resourceId: perm.tableId,
        metadata: {
          expiredAt: perm.expiresAt,
          userEmail: perm.user.email,
        },
      });
    }

    // Revoke expired column permissions
    const expiredColumnPerms = await prisma.columnPermission.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });

    for (const perm of expiredColumnPerms) {
      await prisma.columnPermission.delete({
        where: { id: perm.id },
      });

      await createAuditLog({
        tenantId: perm.tenantId,
        userId: perm.userId,
        action: "permission.auto_revoked_expired",
        resourceType: "column_permission",
        resourceId: perm.columnId,
        metadata: {
          expiredAt: perm.expiresAt,
        },
      });
    }

    // Revoke expired dashboard permissions
    const expiredDashboardPerms = await prisma.dashboardPermission.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });

    for (const perm of expiredDashboardPerms) {
      await prisma.dashboardPermission.delete({
        where: { id: perm.id },
      });

      await createAuditLog({
        tenantId: perm.tenantId,
        userId: perm.userId,
        action: "permission.auto_revoked_expired",
        resourceType: "dashboard_permission",
        resourceId: perm.dashboardId,
        metadata: {
          expiredAt: perm.expiresAt,
        },
      });
    }

    return {
      success: true,
      revoked: {
        tablePermissions: expiredTablePerms.length,
        columnPermissions: expiredColumnPerms.length,
        dashboardPermissions: expiredDashboardPerms.length,
      },
    };
  } catch (error: any) {
    console.error("Error revoking expired permissions:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get permissions expiring soon (for notifications)
 */
export async function getPermissionsExpiringSoon(tenantId: number, daysAhead: number = 3) {
  const now = new Date();
  const expiryThreshold = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  try {
    const [tablePerms, columnPerms, dashboardPerms] = await Promise.all([
      prisma.tablePermission.findMany({
        where: {
          tenantId,
          expiresAt: {
            gt: now,
            lte: expiryThreshold,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          table: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.columnPermission.findMany({
        where: {
          tenantId,
          expiresAt: {
            gt: now,
            lte: expiryThreshold,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          column: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.dashboardPermission.findMany({
        where: {
          tenantId,
          expiresAt: {
            gt: now,
            lte: expiryThreshold,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          dashboard: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      tablePermissions: tablePerms,
      columnPermissions: columnPerms,
      dashboardPermissions: dashboardPerms,
      total: tablePerms.length + columnPerms.length + dashboardPerms.length,
    };
  } catch (error: any) {
    console.error("Error fetching expiring permissions:", error);
    throw error;
  }
}

