/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { checkPlanLimit } from "@/lib/planLimits";
import { checkPlanPermission } from "@/lib/planConstants";
import { z } from "zod";

const TablePublicSchema = z.object({
	isPublic: z.boolean(),
});

export async function PATCH(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const { tenantId, databaseId, tableId } = await params;
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

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
		const parsedData = TablePublicSchema.parse(body);

		// Verificăm că baza de date există și aparține tenant-ului
		const database = await prisma.database.findFirst({
			where: {
				id: Number(databaseId),
				tenantId: Number(tenantId),
			},
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		// Verificăm că tabela există și aparține bazei de date corecte
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Verificăm permisiunea de plan pentru tabele publice
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { subscriptionPlan: true },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Verifică dacă planul permite crearea tabelelor publice
		if (parsedData.isPublic && !checkPlanPermission(user.subscriptionPlan, "canMakeTablesPublic")) {
			return NextResponse.json(
				{
					error: "Public tables are not available in your current plan. Upgrade to Pro or Business to make tables public.",
					plan: "publicTables",
				},
				{ status: 403 },
			);
		}

		// Verificăm limita de tabele publice dacă încercăm să facem tabela publică
		if (parsedData.isPublic && !table.isPublic) {
			const currentPublicTableCount = await prisma.table.count({
				where: {
					database: { tenantId: Number(tenantId) },
					isPublic: true,
				},
			});

			const publicTableLimitCheck = await checkPlanLimit(userId, "publicTables", currentPublicTableCount + 1);

			if (!publicTableLimitCheck.allowed) {
				return NextResponse.json(
					{
						error: "Public table limit exceeded",
						details: `You have ${currentPublicTableCount} public tables and your plan allows ${publicTableLimitCheck.limit} public tables.`,
						limit: publicTableLimitCheck.limit,
						current: currentPublicTableCount,
					},
					{ status: 403 },
				);
			}
		}

		// Actualizăm setarea publică a tabelei
		const updatedTable = await prisma.table.update({
			where: {
				id: Number(tableId),
			},
			data: {
				isPublic: parsedData.isPublic,
			},
		});

		return NextResponse.json(updatedTable);
	} catch (error) {
		console.error("Error updating table public setting:", error);
		return NextResponse.json(
			{ error: "Failed to update table public setting" },
			{ status: 500 },
		);
	}
}
