/** @format */

import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

import { NextResponse } from "next/server";
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; userId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId, userId: userIdToUpdate } = await params;

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	// Verifică că user-ul curent este admin și membru în tenant
	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (!isMember || role !== "ADMIN")
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	try {
		const tablePermissions = await prisma.tablePermission.findMany({
			where: {
				tenantId: Number(tenantId),
				userId: Number(userIdToUpdate),
			},
		});
		const columnsPermissions = await prisma.columnPermission.findMany({
			where: {
				tenantId: Number(tenantId),
				userId: Number(userIdToUpdate),
			},
		});

		return NextResponse.json(
			{ tablePermissions, columnsPermissions },
			{
				status: 200,
			},
		);
	} catch (error) {
		console.error("Error fetching permissions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch permissions" },
			{ status: 500 },
		);
	}
}
