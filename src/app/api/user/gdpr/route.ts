/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = getUserId(session);

		const user = await prisma.user.findUnique({
			where: { id: Number(userId) },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Prepare data export
		const userData = {
			personalInfo: {
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
			},
			subscription: {
				plan: user.subscriptionPlan,
				status: user.subscriptionStatus,
				currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
				stripeCustomerId: user.stripeCustomerId,
				stripeSubscriptionId: user.stripeSubscriptionId,
			},
			tenant: user.tenant
				? {
						id: user.tenant.id,
						name: user.tenant.name,
						address: user.tenant.address,
						companyEmail: user.tenant.companyEmail,
						phone: user.tenant.phone,
						website: user.tenant.website,
						createdAt: user.tenant.createdAt,
						updatedAt: user.tenant.updatedAt,
				  }
				: null,
			databases: user.tenant?.databases || [],

			exportedAt: new Date().toISOString(),
		};

		return NextResponse.json({
			success: true,
			data: userData,
		});
	} catch (error) {
		console.error("Error exporting user data:", error);
		return NextResponse.json(
			{ error: "Failed to export user data" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			include: {
				tenant: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// If user is admin of a tenant, delete the entire tenant
		if (user.role === "ADMIN" && user.tenant) {
			await prisma.tenant.delete({
				where: { id: user.tenant.id },
			});
		} else {
			// Delete just the user
			await prisma.user.delete({
				where: { id: user.id },
			});
		}

		return NextResponse.json({
			success: true,
			message: "Account and all associated data deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting user data:", error);
		return NextResponse.json(
			{ error: "Failed to delete user data" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { firstName, lastName, email } = body;

		// Validate required fields
		if (!firstName || !lastName || !email) {
			return NextResponse.json(
				{ error: "firstName, lastName, and email are required" },
				{ status: 400 },
			);
		}

		// Check if email is already taken by another user
		if (email !== session.user.email) {
			const existingUser = await prisma.user.findUnique({
				where: { email },
			});
			if (existingUser) {
				return NextResponse.json(
					{ error: "Email already in use" },
					{ status: 400 },
				);
			}
		}

		// Update user data
		const updatedUser = await prisma.user.update({
			where: { email: session.user.email },
			data: {
				firstName,
				lastName,
				email,
			},
		});

		return NextResponse.json({
			success: true,
			message: "User data updated successfully",
			user: {
				id: updatedUser.id,
				email: updatedUser.email,
				firstName: updatedUser.firstName,
				lastName: updatedUser.lastName,
			},
		});
	} catch (error) {
		console.error("Error updating user data:", error);
		return NextResponse.json(
			{ error: "Failed to update user data" },
			{ status: 500 },
		);
	}
}
