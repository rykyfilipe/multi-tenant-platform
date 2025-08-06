/** @format */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const acceptInvitationSchema = z.object({
	token: z.string(),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { token, password } = acceptInvitationSchema.parse(body);

		// Find the invitation
		const invitation = await prisma.invitation.findUnique({
			where: { token },
			include: { tenant: true },
		});

		if (!invitation) {
			return NextResponse.json(
				{ error: "Invalid or expired invitation token" },
				{ status: 400 },
			);
		}

		if (invitation.accepted) {
			return NextResponse.json(
				{ error: "This invitation has already been accepted" },
				{ status: 400 },
			);
		}

		if (invitation.expiresAt < new Date()) {
			return NextResponse.json(
				{ error: "This invitation has expired" },
				{ status: 400 },
			);
		}

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: invitation.email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "A user with this email already exists" },
				{ status: 400 },
			);
		}

		// Hash the password
		const hashedPassword = await hashPassword(password);

		// Create the user
		const user = await prisma.user.create({
			data: {
				email: invitation.email,
				firstName: invitation.firstName,
				lastName: invitation.lastName,
				password: hashedPassword,
				role: invitation.role,
				tenantId: invitation.tenantId,
			},
		});

		// Get all tables for the tenant to create permissions
		const tables = await prisma.table.findMany({
			where: {
				database: {
					tenantId: invitation.tenantId,
				},
			},
			include: {
				columns: true,
			},
		});

		// Create table permissions
		await Promise.all(
			tables.map((table) =>
				prisma.tablePermission.create({
					data: {
						tenantId: invitation.tenantId,
						userId: user.id,
						tableId: table.id,
						canDelete: false,
						canRead: true,
						canEdit:
							invitation.role === "EDITOR" || invitation.role === "ADMIN",
					},
				}),
			),
		);

		// Create column permissions
		await Promise.all(
			tables.flatMap((table) =>
				table.columns.map((column) =>
					prisma.columnPermission.create({
						data: {
							tenantId: invitation.tenantId,
							userId: user.id,
							columnId: column.id,
							canRead: true,
							canEdit:
								invitation.role === "EDITOR" || invitation.role === "ADMIN",
							tableId: table.id,
						},
					}),
				),
			),
		);

		// Mark invitation as accepted
		await prisma.invitation.update({
			where: { id: invitation.id },
			data: { accepted: true },
		});

		const { password: _, ...safeUser } = user;

		return NextResponse.json(
			{
				message: "Account created successfully! You can now log in.",
				user: safeUser,
			},
			{ status: 201 },
		);
	} catch (error: any) {
		console.error("Error accepting invitation:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to accept invitation" },
			{ status: 400 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const token = searchParams.get("token");

		if (!token) {
			return NextResponse.json(
				{ error: "Invitation token is required" },
				{ status: 400 },
			);
		}

		// Find the invitation
		const invitation = await prisma.invitation.findUnique({
			where: { token },
			include: { tenant: true },
		});

		if (!invitation) {
			return NextResponse.json(
				{ error: "Invalid invitation token" },
				{ status: 404 },
			);
		}

		if (invitation.accepted) {
			return NextResponse.json(
				{ error: "This invitation has already been accepted" },
				{ status: 400 },
			);
		}

		if (invitation.expiresAt < new Date()) {
			return NextResponse.json(
				{ error: "This invitation has expired" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			invitation: {
				email: invitation.email,
				firstName: invitation.firstName,
				lastName: invitation.lastName,
				role: invitation.role,
				tenantName: invitation.tenant.name,
				expiresAt: invitation.expiresAt,
			},
		});
	} catch (error: any) {
		console.error("Error validating invitation:", error);
		return NextResponse.json(
			{ error: "Failed to validate invitation" },
			{ status: 500 },
		);
	}
}
