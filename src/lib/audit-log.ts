/** @format */

import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * Audit Log Actions
 */
export const AUDIT_ACTIONS = {
  // User actions
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_ROLE_CHANGED: "user.role_changed",
  USER_DEACTIVATED: "user.deactivated",
  USER_ACTIVATED: "user.activated",
  
  // Invitation actions
  INVITATION_SENT: "invitation.sent",
  INVITATION_RESENT: "invitation.resent",
  INVITATION_CANCELLED: "invitation.cancelled",
  INVITATION_ACCEPTED: "invitation.accepted",
  
  // Permission actions
  PERMISSION_GRANTED: "permission.granted",
  PERMISSION_REVOKED: "permission.revoked",
  PERMISSION_UPDATED: "permission.updated",
  TEMPLATE_APPLIED: "permission.template_applied",
  BULK_PERMISSIONS_UPDATED: "permission.bulk_updated",
  
  // Dashboard permissions
  DASHBOARD_PERMISSION_GRANTED: "dashboard_permission.granted",
  DASHBOARD_PERMISSION_REVOKED: "dashboard_permission.revoked",
  DASHBOARD_PERMISSION_UPDATED: "dashboard_permission.updated",
  
  // Table permissions
  TABLE_PERMISSION_GRANTED: "table_permission.granted",
  TABLE_PERMISSION_REVOKED: "table_permission.revoked",
  TABLE_PERMISSION_UPDATED: "table_permission.updated",
} as const;

/**
 * Resource Types
 */
export const RESOURCE_TYPES = {
  USER: "user",
  INVITATION: "invitation",
  TABLE_PERMISSION: "table_permission",
  COLUMN_PERMISSION: "column_permission",
  DASHBOARD_PERMISSION: "dashboard_permission",
  DASHBOARD: "dashboard",
  TABLE: "table",
} as const;

interface AuditLogData {
  tenantId: number;
  userId: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  changes?: any;
  metadata?: any;
  request?: NextRequest;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    const ipAddress = data.request?.headers.get("x-forwarded-for") || data.request?.headers.get("x-real-ip") || null;
    const userAgent = data.request?.headers.get("user-agent") || null;

    await prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        changes: data.changes || null,
        metadata: data.metadata || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log user deactivation
 */
export async function logUserDeactivation(
  tenantId: number,
  adminId: number,
  targetUserId: number,
  request?: NextRequest
) {
  await createAuditLog({
    tenantId,
    userId: adminId,
    action: AUDIT_ACTIONS.USER_DEACTIVATED,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: targetUserId,
    metadata: {
      deactivatedBy: adminId,
    },
    request,
  });
}

/**
 * Log user activation
 */
export async function logUserActivation(
  tenantId: number,
  adminId: number,
  targetUserId: number,
  request?: NextRequest
) {
  await createAuditLog({
    tenantId,
    userId: adminId,
    action: AUDIT_ACTIONS.USER_ACTIVATED,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: targetUserId,
    metadata: {
      activatedBy: adminId,
    },
    request,
  });
}

/**
 * Log role change
 */
export async function logRoleChange(
  tenantId: number,
  adminId: number,
  targetUserId: number,
  oldRole: string,
  newRole: string,
  request?: NextRequest
) {
  await createAuditLog({
    tenantId,
    userId: adminId,
    action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: targetUserId,
    changes: {
      role: {
        from: oldRole,
        to: newRole,
      },
    },
    request,
  });
}

/**
 * Log permission template application
 */
export async function logTemplateApplication(
  tenantId: number,
  adminId: number,
  templateId: string,
  userIds: number[],
  affectedResources: {
    tablePermissions: number;
    dashboardPermissions: number;
  },
  request?: NextRequest
) {
  await createAuditLog({
    tenantId,
    userId: adminId,
    action: AUDIT_ACTIONS.TEMPLATE_APPLIED,
    resourceType: RESOURCE_TYPES.TABLE_PERMISSION,
    metadata: {
      templateId,
      targetUserIds: userIds,
      affectedPermissions: affectedResources,
    },
    request,
  });
}

/**
 * Log dashboard permission change
 */
export async function logDashboardPermissionChange(
  tenantId: number,
  adminId: number,
  targetUserId: number,
  dashboardId: number,
  changes: any,
  request?: NextRequest
) {
  await createAuditLog({
    tenantId,
    userId: adminId,
    action: AUDIT_ACTIONS.DASHBOARD_PERMISSION_UPDATED,
    resourceType: RESOURCE_TYPES.DASHBOARD_PERMISSION,
    resourceId: dashboardId,
    changes: {
      userId: targetUserId,
      permissions: changes,
    },
    request,
  });
}

/**
 * Log invitation resend
 */
export async function logInvitationResend(
  tenantId: number,
  adminId: number,
  invitationId: string,
  email: string,
  request?: NextRequest
) {
  await createAuditLog({
    tenantId,
    userId: adminId,
    action: AUDIT_ACTIONS.INVITATION_RESENT,
    resourceType: RESOURCE_TYPES.INVITATION,
    metadata: {
      invitationId,
      email,
    },
    request,
  });
}

/**
 * Log user deletion
 */
export async function logUserDeletion(
  tenantId: number,
  adminId: number,
  targetUserId: number,
  targetUserEmail: string,
  request?: NextRequest
) {
  await createAuditLog({
    tenantId,
    userId: adminId,
    action: AUDIT_ACTIONS.USER_DELETED,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: targetUserId,
    metadata: {
      deletedUserEmail: targetUserEmail,
    },
    request,
  });
}

/**
 * Get audit logs for a tenant
 */
export async function getAuditLogs(
  tenantId: number,
  filters?: {
    userId?: number;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
) {
  const where: any = { tenantId };

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = filters.action;
  if (filters?.resourceType) where.resourceType = filters.resourceType;
  
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: filters?.limit || 100,
  });
}

