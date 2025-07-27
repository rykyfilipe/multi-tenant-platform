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

export async function PATCH(
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
		const body = await request.json();
		const { tablePermissions, columnsPermissions } = body;

		if (!tablePermissions || !columnsPermissions) {
			return NextResponse.json(
				{ error: "Invalid permissions data" },
				{ status: 400 },
			);
		}
		console.log("Updating permissions for user:", columnsPermissions);
		console.log("Table Permissions:", tablePermissions);

		// Update table permissions
		Promise.all(
			tablePermissions.map((permission: any) =>
				prisma.tablePermission.updateMany({
					where: {
						tenantId: Number(tenantId),
						userId: Number(userIdToUpdate),
						tableId: permission.tableId,
					},
					data: {
						canRead: permission.canRead,
						canEdit: permission.canEdit,
						canDelete: permission.canDelete,
					},
				}),
			),
		);

		Promise.all(
			// Update column permissions
			columnsPermissions.map((permission: any) =>
				prisma.columnPermission.updateMany({
					where: {
						tenantId: Number(tenantId),
						userId: Number(userIdToUpdate),
						columnId: permission.columnId,
					},
					data: {
						canRead: permission.canRead,
						canEdit: permission.canEdit,
					},
				}),
			),
		);

		return NextResponse.json(
			{ message: "Permissions updated successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error fetching permissions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch permissions" },
			{ status: 500 },
		);
	}
}
