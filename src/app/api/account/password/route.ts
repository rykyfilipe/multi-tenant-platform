/** @format */

import { hashPassword, verifyPassword } from "@/lib/auth";
import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import prisma from "@/lib/prisma";

import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const { user } = sessionResult;
	const userId = parseInt(user.id);

	// Verifică că user-ul curent este admin și membru în tenant

	try {
		const user = await prisma.user.findFirst({
			where: {
				id: userId,
			},
		});

		return NextResponse.json({ status: 200, password: user?.password });
	} catch (error) {
		console.error("Error fetching permissions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch permissions" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request) {
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const { user } = sessionResult;
	const userId = parseInt(user.id);
	const body = await request.json();

	try {
		// Get current user from database
		const currentUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, password: true },
		});

		if (!currentUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Check if this is a password change (has oldPassword) or initial password set
		if (body.oldPassword && body.newPassword) {
			// Password change scenario - verify old password
			if (!currentUser.password) {
				return NextResponse.json(
					{ error: "No existing password found. Use password set instead." },
					{ status: 400 },
				);
			}

			// Verify old password
			const isOldPasswordValid = await verifyPassword(
				body.oldPassword,
				currentUser.password,
			);
			if (!isOldPasswordValid) {
				return NextResponse.json(
					{ error: "Current password is incorrect" },
					{ status: 400 },
				);
			}

			// Validate new password
			if (!body.newPassword || body.newPassword.length < 6) {
				return NextResponse.json(
					{ error: "New password must be at least 6 characters long" },
					{ status: 400 },
				);
			}

			// Hash and update with new password
			const hashedNewPassword = await hashPassword(body.newPassword);

			await prisma.user.update({
				where: { id: userId },
				data: { password: hashedNewPassword },
			});

			return NextResponse.json({
				status: 200,
				message: "Password changed successfully",
				password: "Password updated", // Don't return actual hash
			});
		} else if (body.password) {
			// Initial password set scenario
			if (currentUser.password) {
				return NextResponse.json(
					{ error: "Password already exists. Use change password instead." },
					{ status: 400 },
				);
			}

			// Validate password
			if (!body.password || body.password.length < 6) {
				return NextResponse.json(
					{ error: "Password must be at least 6 characters long" },
					{ status: 400 },
				);
			}

			// Hash and set initial password
			const hashedPassword = await hashPassword(body.password);

			await prisma.user.update({
				where: { id: userId },
				data: { password: hashedPassword },
			});

			return NextResponse.json({
				status: 200,
				message: "Password set successfully",
				password: "Password set", // Don't return actual hash
			});
		} else {
			return NextResponse.json(
				{
					error:
						"Invalid request. Either provide 'password' for initial set or 'oldPassword' and 'newPassword' for change.",
				},
				{ status: 400 },
			);
		}
	} catch (error) {
		console.error("Error updating password:", error);
		return NextResponse.json(
			{ error: "Failed to update password" },
			{ status: 500 },
		);
	}
}
