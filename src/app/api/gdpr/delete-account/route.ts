/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/error-logger";
import { z } from "zod";

const deleteAccountSchema = z.object({
	confirmation: z.literal("DELETE_MY_ACCOUNT"),
	reason: z.string().optional(),
});

/**
 * GDPR Right to be Forgotten Endpoint
 * Permanently deletes all user data
 */
export async function POST(request: NextRequest) {
	try {
		const sessionResult = await requireAuthAPI();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const { user } = sessionResult;

		const body = await request.json();
		const { confirmation, reason } = deleteAccountSchema.parse(body);

		// Log account deletion request
		logger.warn("GDPR account deletion requested", {
			component: "GDPRDeleteAccount",
			userId: parseInt(user.id),
			userEmail: user.email,
			reason,
			ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
		});

		// Start transaction for data deletion
		await prisma.$transaction(async (tx) => {
			// 1. Delete user's rows data
			if (user.tenantId) {
				// Get all tables in user's tenant
				const tables = await tx.table.findMany({
					where: {
						database: {
							tenantId: user.tenantId,
						},
					},
					select: { id: true },
				});

				// Delete all rows in user's tables
				for (const table of tables) {
					await tx.row.deleteMany({
						where: { tableId: table.id },
					});
				}

				// 2. Delete tables
				await tx.table.deleteMany({
					where: {
						database: {
							tenantId: user.tenantId,
						},
					},
				});

				// 3. Delete databases
				await tx.database.deleteMany({
					where: { tenantId: user.tenantId },
				});

				// 4. Delete tenant settings
				await tx.tenantSettings.deleteMany({
					where: { tenantId: user.tenantId },
				});

				// 5. Delete subscription data
				await tx.subscription.deleteMany({
					where: { tenantId: user.tenantId },
				});

				// 6. Delete tenant
				await tx.tenant.delete({
					where: { id: user.tenantId },
				});
			}

			// 7. Delete user activity logs
			await tx.activityLog.deleteMany({
				where: { userId: parseInt(user.id) },
			});

			// 8. Delete user preferences
			await tx.userPreference.deleteMany({
				where: { userId: parseInt(user.id) },
			});

			// 9. Delete user invitations
			await tx.invitation.deleteMany({
				where: { 
					OR: [
						{ invitedBy: parseInt(user.id) },
						{ email: user.email },
					],
				},
			});

			// 10. Delete user sessions
			await tx.session.deleteMany({
				where: { userId: parseInt(user.id) },
			});

			// 11. Delete user accounts (OAuth providers)
			await tx.account.deleteMany({
				where: { userId: parseInt(user.id) },
			});

			// 12. Finally, delete the user
			await tx.user.delete({
				where: { id: parseInt(user.id) },
			});
		});

		// Log successful deletion
		logger.warn("GDPR account deletion completed", {
			component: "GDPRDeleteAccount",
			userId: parseInt(user.id),
			userEmail: user.email,
			reason,
		});

		// Return success response
		return NextResponse.json({
			success: true,
			message: "Account and all associated data have been permanently deleted",
			deletedAt: new Date().toISOString(),
		});

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ 
					error: "Invalid request data",
					details: error.errors,
				},
				{ status: 400 }
			);
		}

		logger.error("Failed to delete user account", error as Error, {
			component: "GDPRDeleteAccount",
		});

		return NextResponse.json(
			{ error: "Failed to delete account. Please contact support." },
			{ status: 500 }
		);
	}
}
