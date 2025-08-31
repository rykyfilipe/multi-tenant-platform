/** @format */

import {
	checkUserTenantAccess,
	getUserFromRequest,
	hashPassword,
	verifyLogin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPlanLimit, getCurrentCounts } from "@/lib/planLimits";
import { checkPlanPermission } from "@/lib/planConstants";
import {
	sendInvitationEmail,
	generateInvitationToken,
	generateInvitationUrl,
} from "@/lib/email";

const userSchema = z.object({
	email: z.string().email(),
	role: z.enum(["VIEWER", "ADMIN", "EDITOR"]).default("VIEWER"),
});

export async function GET(
	request: Request,
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

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const users = await prisma.user.findMany({
			where: {
				tenantId: Number(tenantId),
				id: { not: Number(userId) },
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				profileImage: true,
			},
		});

		// if (!users || users.length <= 0)
		// 	return NextResponse.json(
		// 		{ error: "No users found for this tenant!" },
		// 		{ status: 404 },
		// 	);

		return NextResponse.json(users, { status: 200 });
	} catch (error) {
		console.error("Error fetching tenant:", error);
		return NextResponse.json(
			{ error: "Failed to fetch tenant" },
			{ status: 500 },
		);
	}
}
export async function POST(
	request: Request,
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

	if (role !== "ADMIN")
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsedData = userSchema.parse(body);

		// Verificăm permisiunea de plan pentru crearea utilizatorilor
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { subscriptionPlan: true },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Verifică dacă planul permite crearea utilizatorilor
		if (!checkPlanPermission(user.subscriptionPlan, "canCreateUsers")) {
			return NextResponse.json(
				{
					error: "User creation is not available in your current plan. Upgrade to Pro or Enterprise to invite team members.",
					plan: "users",
				},
				{ status: 403 },
			);
		}

		// Verificăm limitele planului pentru utilizatori
		const currentCounts = await getCurrentCounts(userId);
		const userLimit = await checkPlanLimit(
			userId,
			"users",
			currentCounts.users,
		);

		if (!userLimit.allowed) {
			return NextResponse.json(
				{
					error: `Plan limit exceeded. You can only have ${userLimit.limit} user(s). Upgrade your plan to add more users.`,
					limit: userLimit.limit,
					current: userLimit.current,
					plan: "users",
				},
				{ status: 403 },
			);
		}

		const existingUser = await prisma.user.findUnique({
			where: {
				email: parsedData.email,
			},
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "User with this email already exists" },
				{ status: 400 },
			);
		}

		// Check for existing invitation
		const existingInvitation = await prisma.invitation.findFirst({
			where: {
				email: parsedData.email,
				tenantId: Number(tenantId),
				accepted: false,
				expiresAt: {
					gt: new Date(),
				},
			},
		});

		if (existingInvitation) {
			return NextResponse.json(
				{ error: "An invitation has already been sent to this email address" },
				{ status: 400 },
			);
		}

		// Get admin user info for email
		const adminUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { firstName: true, lastName: true },
		});

		// Get tenant info for email
		const tenant = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
			select: { name: true },
		});

		// Generate invitation token
		const invitationToken = generateInvitationToken();
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		// Create invitation in database
		const invitation = await prisma.invitation.create({
			data: {
				email: parsedData.email,
				firstName: "", // Will be filled by user during registration
				lastName: "", // Will be filled by user during registration
				role: parsedData.role,
				tenantId: Number(tenantId),
				token: invitationToken,
				expiresAt,
			},
		});

		// Send invitation email
		const invitationUrl = generateInvitationUrl(invitationToken);
		const emailSent = await sendInvitationEmail({
			email: parsedData.email,
			firstName: "", // Will be filled by user during registration
			lastName: "", // Will be filled by user during registration
			role: parsedData.role,
			tenantName: tenant?.name || "Your Organization",
			adminName: `${adminUser?.firstName} ${adminUser?.lastName}`,
			invitationUrl,
		});

		if (!emailSent) {
			// If email failed, delete the invitation
			await prisma.invitation.delete({
				where: { id: invitation.id },
			});
			return NextResponse.json(
				{ error: "Failed to send invitation email. Please try again." },
				{ status: 500 },
			);
		}

		const response = NextResponse.json(
			{
				message: "Invitation sent successfully",
				invitation: {
					id: invitation.id,
					email: invitation.email,
					role: invitation.role,
					expiresAt: invitation.expiresAt,
				},
			},
			{ status: 201 },
		);

		return response;
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
}
