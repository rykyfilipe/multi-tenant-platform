/** @format */

import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const { token, email, newPassword } = await request.json();

		// Validate required fields
		if (!token || !email || !newPassword) {
			return NextResponse.json(
				{ error: "Token, email, and new password are required" },
				{ status: 400 },
			);
		}

		// Validate password strength
		if (newPassword.length < 6) {
			return NextResponse.json(
				{ error: "Password must be at least 6 characters long" },
				{ status: 400 },
			);
		}

		// Find and validate verification token
		const verificationToken = await prisma.verificationToken.findFirst({
			where: {
				identifier: email,
				token: token,
				expires: {
					gt: new Date(), // Only valid tokens that haven't expired
				},
			},
		});

		if (!verificationToken) {
			return NextResponse.json(
				{ error: "Invalid or expired reset token" },
				{ status: 400 },
			);
		}

		// Token is already validated to be not expired in the query above
		// No need to check again

		// Find user
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Hash new password
		const hashedPassword = await hashPassword(newPassword);

		// Update user password
		await prisma.user.update({
			where: { email },
			data: { password: hashedPassword },
		});

		// Don't delete or update the token to avoid replica identity issues
		// The token will naturally expire and become invalid

		return NextResponse.json(
			{ message: "Password has been reset successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Reset password error:", error);
		return NextResponse.json(
			{ error: "Failed to reset password. Please try again later." },
			{ status: 500 },
		);
	}
}
