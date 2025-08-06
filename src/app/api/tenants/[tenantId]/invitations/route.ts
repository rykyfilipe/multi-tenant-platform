/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, verifyLogin } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
