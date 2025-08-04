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
		console.log("Tables API - Tenant ID:", tenantId);
		console.log("Tables API - User ID:", userId);
		console.log("Tables API - Role:", role);

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

			console.log("Tables API - Found tables:", tables.length);
			return NextResponse.json(tables, { status: 200 });
		}

		// Pentru utilizatorii non-admin, returnăm doar tabelele la care au acces
		console.log("Tables API - Fetching permissions for non-admin user");

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

		console.log("Tables API - Found permissions:", tablePermissions.length);

		const accessibleTables = tablePermissions
			.filter((permission) => permission.canRead)
			.map((permission) => permission.table);

		console.log("Tables API - Accessible tables:", accessibleTables.length);
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
