/** @format */

import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkPlanPermission } from "@/lib/planConstants";

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

	// Verifică că user-ul este membru în tenant
	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Admins pot vedea permisiunile oricui, utilizatorii obișnuiți doar ale lor
	if (role !== "ADMIN" && userId.toString() !== userIdToUpdate) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Verificăm permisiunea de plan pentru gestionarea permisiunilor
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { subscriptionPlan: true },
	});

	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	// Verifică dacă planul permite gestionarea permisiunilor
	if (!checkPlanPermission(user.subscriptionPlan, "canManagePermissions")) {
		return NextResponse.json(
			{
				error:
					"Permission management is not available in your current plan. Upgrade to Pro or Enterprise to manage user permissions.",
				plan: "permissions",
			},
			{ status: 403 },
		);
	}

	try {
		const tablePermissions = await prisma.tablePermission.findMany({
			where: {
				tenantId: Number(tenantId),
				userId: Number(userIdToUpdate),
			},
			include: {
				table: {
					include: {
						database: true,
					},
				},
			},
		});
		const columnsPermissions = await prisma.columnPermission.findMany({
			where: {
				tenantId: Number(tenantId),
				userId: Number(userIdToUpdate),
			},
			include: {
				column: {
					include: {
						table: {
							include: {
								database: true,
							},
						},
					},
				},
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

	// Verifică că user-ul este membru în tenant
	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Doar admins pot modifica permisiunile
	if (role !== "ADMIN") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	try {
		const body = await request.json();
		const { tablePermissions, columnsPermissions } = body;

		if (!tablePermissions || !columnsPermissions) {
			return NextResponse.json(
				{ error: "Invalid permissions data" },
				{ status: 400 },
			);
		}

		// Update table permissions
		for (const permission of tablePermissions) {
			const existingPermission = await prisma.tablePermission.findFirst({
				where: {
					tenantId: Number(tenantId),
					userId: Number(userIdToUpdate),
					tableId: permission.tableId,
				},
			});

			if (existingPermission) {
				await prisma.tablePermission.update({
					where: { id: existingPermission.id },
					data: {
						canRead: permission.canRead,
						canEdit: permission.canEdit,
						canDelete: permission.canDelete,
					},
				});
			} else {
				await prisma.tablePermission.create({
					data: {
						tenantId: Number(tenantId),
						userId: Number(userIdToUpdate),
						tableId: permission.tableId,
						canRead: permission.canRead,
						canEdit: permission.canEdit,
						canDelete: permission.canDelete,
					},
				});
			}
		}

		// Update column permissions
		for (const permission of columnsPermissions) {
			const existingPermission = await prisma.columnPermission.findFirst({
				where: {
					tenantId: Number(tenantId),
					userId: Number(userIdToUpdate),
					columnId: permission.columnId,
				},
			});

			if (existingPermission) {
				await prisma.columnPermission.update({
					where: { id: existingPermission.id },
					data: {
						canRead: permission.canRead,
						canEdit: permission.canEdit,
					},
				});
			} else {
				await prisma.columnPermission.create({
					data: {
						tenantId: Number(tenantId),
						userId: Number(userIdToUpdate),
						columnId: permission.columnId,
						tableId: permission.tableId,
						canRead: permission.canRead,
						canEdit: permission.canEdit,
					},
				});
			}
		}

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
