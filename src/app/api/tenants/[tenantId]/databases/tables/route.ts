/** @format */

import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId } = await params;
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const { user } = sessionResult;
	const userId = user.id;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		if (role === "ADMIN") {
			// Pentru admin, returnăm toate tabelele din tenant, dar excludem tabelele protejate
			const tables = await prisma.table.findMany({
				where: {
					database: {
						tenantId: Number(tenantId),
					},
					isProtected: false, // Excludem tabelele protejate
				},
				include: {
					database: true,
					columns: {
						orderBy: {
							order: "asc",
						},
					},
				},
			});

			// Serializăm datele pentru a evita probleme cu tipurile Prisma
			const serializedTables = tables.map((table) => ({
				...table,
				createdAt: table.createdAt?.toISOString(),
				updatedAt: table.updatedAt?.toISOString(),
				columns: table.columns?.map((column) => ({
					...column,
					createdAt: column.createdAt?.toISOString(),
					updatedAt: column.updatedAt?.toISOString(),
				})),
				database: table.database
					? {
							...table.database,
							createdAt: table.database.createdAt?.toISOString(),
							updatedAt: table.database.updatedAt?.toISOString(),
					  }
					: null,
			}));

			return NextResponse.json(serializedTables, { status: 200 });
		}

		// Pentru utilizatorii non-admin, returnăm doar tabelele la care au acces, dar excludem tabelele protejate
		const tablePermissions = await prisma.tablePermission.findMany({
			where: {
				userId: userId,
				table: {
					database: {
						tenantId: Number(tenantId),
					},
					isProtected: false, // Excludem tabelele protejate
				},
			},
			include: {
				table: {
					include: {
						database: true,
						columns: {
							orderBy: {
								order: "asc",
							},
						},
					},
				},
			},
		});

		const accessibleTables = tablePermissions
			.filter((permission: { canRead: boolean }) => permission.canRead)
			.map((permission: { table: unknown }) => permission.table);

		// Serializăm datele pentru a evita probleme cu tipurile Prisma
		const serializedAccessibleTables = accessibleTables.map((table: any) => ({
			...table,
			createdAt: table.createdAt?.toISOString(),
			updatedAt: table.updatedAt?.toISOString(),
			columns: table.columns?.map((column: any) => ({
				...column,
				createdAt: column.createdAt?.toISOString(),
				updatedAt: column.updatedAt?.toISOString(),
			})),
			database: table.database
				? {
						...table.database,
						createdAt: table.database.createdAt?.toISOString(),
						updatedAt: table.database.updatedAt?.toISOString(),
				  }
				: null,
		}));

		return NextResponse.json(serializedAccessibleTables, { status: 200 });
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
