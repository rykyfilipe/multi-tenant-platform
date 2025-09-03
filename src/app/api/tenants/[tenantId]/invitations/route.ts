/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, verifyLogin, generateToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { sendInvitationEmail } from "@/lib/email";

const invitationSchema = z.object({
	email: z.string().email("Invalid email format"),
	role: z.enum(["EDITOR", "VIEWER"]),
});

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	if (role !== "ADMIN") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const invitations = await prisma.invitation.findMany({
			where: {
				tenantId: Number(tenantId),
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(invitations);
	} catch (error) {
		console.error("Error fetching invitations:", error);
		return NextResponse.json(
			{ error: "Failed to fetch invitations" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	if (role !== "ADMIN") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const parsedData = invitationSchema.parse(body);

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: parsedData.email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "A user with this email already exists" },
				{ status: 400 },
			);
		}

		// Check if invitation already exists
		const existingInvitation = await prisma.invitation.findFirst({
			where: {
				email: parsedData.email,
				tenantId: Number(tenantId),
				accepted: false,
			},
		});

		if (existingInvitation) {
			return NextResponse.json(
				{ error: "An invitation has already been sent to this email" },
				{ status: 400 },
			);
		}

		// Get tenant information
		const tenant = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
		});

		if (!tenant) {
			return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
		}

		// Generate invitation token
		const token = generateToken(
			{
				userId: 0,
				role: "INVITATION",
				email: parsedData.email,
				tenantId: Number(tenantId),
			} as any,
			"7d",
		);

		// Create invitation
		const invitation = await prisma.invitation.create({
			data: {
				email: parsedData.email,
				firstName: "", // Will be filled when user accepts invitation
				lastName: "", // Will be filled when user accepts invitation
				role: parsedData.role,
				tenantId: Number(tenantId),
				token,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		});

		// Store role information in the token payload for when user accepts
		// The role will be applied when the invitation is accepted

		// Send invitation email
		try {
			await sendInvitationEmail({
				to: parsedData.email,
				firstName: "", // Will be filled when user accepts invitation
				lastName: "", // Will be filled when user accepts invitation
				role: parsedData.role,
				tenantName: tenant.name,
				invitationUrl: `${process.env.NEXTAUTH_URL}/invite?token=${token}`,
			});
		} catch (emailError) {
			console.error("Failed to send invitation email:", emailError);
			// Don't fail the request if email fails, but log it
		}

		return NextResponse.json(invitation, { status: 201 });
	} catch (error: any) {
		console.error("Error creating invitation:", error);
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid invitation data", details: error.errors },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: error.message || "Failed to create invitation" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	if (role !== "ADMIN") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const invitationId = searchParams.get("id");

		if (!invitationId) {
			return NextResponse.json(
				{ error: "Invitation ID is required" },
				{ status: 400 },
			);
		}

		await prisma.invitation.delete({
			where: {
				id: invitationId,
				tenantId: Number(tenantId),
			},
		});

		return NextResponse.json({ message: "Invitation deleted successfully" });
	} catch (error) {
		console.error("Error deleting invitation:", error);
		return NextResponse.json(
			{ error: "Failed to delete invitation" },
			{ status: 500 },
		);
	}
}
