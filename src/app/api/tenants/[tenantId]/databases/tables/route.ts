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
		if (role === "ADMIN") {
			// Pentru admin, returnăm toate tabelele din tenant
			const tables = await prisma.table.findMany({
				where: {
					database: {
						tenantId: Number(tenantId),
					},
				},
				include: {
					database: true,
					columns: true,
				},
			});

	
			return NextResponse.json(tables, { status: 200 });
		}

		// Pentru utilizatorii non-admin, returnăm doar tabelele la care au acces


		const tablePermissions = await prisma.tablePermission.findMany({
			where: {
				userId: userId,
				table: {
					database: {
						tenantId: Number(tenantId),
					},
				},
			},
			include: {
				table: {
					include: {
						database: true,
						columns: true,
					},
				},
			},
		});



		const accessibleTables = tablePermissions
			.filter((permission: { canRead: boolean }) => permission.canRead)
			.map((permission: { table: unknown }) => permission.table);


		return NextResponse.json(accessibleTables, { status: 200 });
	} catch (error) {
		console.error("Error fetching tables:", error);
		console.error(
			"Error stack:",
			error instanceof Error ? error.stack : "No stack trace",
		);
		return NextResponse.json(
			{
				error: "Failed to fetch tables",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
