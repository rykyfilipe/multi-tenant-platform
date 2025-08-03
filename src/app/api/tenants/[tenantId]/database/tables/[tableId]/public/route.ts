/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { checkPlanLimit, getCurrentCounts } from "@/lib/planLimits";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; tableId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId, tableId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const { isPublic } = body;

		// Verificăm dacă tabela aparține tenant-ului
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				database: {
					tenantId: Number(tenantId),
				},
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Dacă vrem să facem tabela publică, verificăm limitele
		if (isPublic) {
			const currentCounts = await getCurrentCounts(userId);
			const publicTableLimit = await checkPlanLimit(
				userId,
				"publicTables",
				currentCounts.publicTables,
			);

			if (!publicTableLimit.allowed) {
				return NextResponse.json(
					{
						error: `Plan limit exceeded. You can only have ${publicTableLimit.limit} public table(s). Upgrade your plan to make more tables public.`,
						limit: publicTableLimit.limit,
						current: publicTableLimit.current,
						plan: "publicTables",
					},
					{ status: 403 },
				);
			}
		}

		// Actualizăm tabela
		const updatedTable = await prisma.table.update({
			where: { id: Number(tableId) },
			data: { isPublic },
		});

		return NextResponse.json(updatedTable, { status: 200 });
	} catch (error) {
		console.error("Error updating table public status:", error);
		return NextResponse.json(
			{ error: "Failed to update table" },
			{ status: 500 },
		);
	}
}
