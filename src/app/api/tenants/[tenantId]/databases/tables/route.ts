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
					columns: {
						orderBy: {
							order: 'asc'
						}
					},
				},
			});

			// Serializăm datele pentru a evita probleme cu tipurile Prisma
			const serializedTables = tables.map(table => ({
				...table,
				createdAt: table.createdAt?.toISOString(),
				updatedAt: table.updatedAt?.toISOString(),
				columns: table.columns?.map(column => ({
					...column,
					createdAt: column.createdAt?.toISOString(),
					updatedAt: column.updatedAt?.toISOString(),
				})),
				database: table.database ? {
					...table.database,
					createdAt: table.database.createdAt?.toISOString(),
					updatedAt: table.database.updatedAt?.toISOString(),
				} : null,
			}));

			// Debug logging
			console.log("API - Admin tables fetched:", {
				count: serializedTables.length,
				tables: serializedTables.map(t => ({
					id: t.id,
					name: t.name,
					columnsCount: t.columns?.length || 0,
					columns: t.columns?.map(c => ({ id: c.id, name: c.name, type: c.type }))
				}))
			});

			return NextResponse.json(serializedTables, { status: 200 });
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
						columns: {
							orderBy: {
								order: 'asc'
							}
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
			database: table.database ? {
				...table.database,
				createdAt: table.database.createdAt?.toISOString(),
				updatedAt: table.database.updatedAt?.toISOString(),
			} : null,
		}));

		// Debug logging
		console.log("API - Non-admin accessible tables:", {
			count: serializedAccessibleTables.length,
			tables: serializedAccessibleTables.map((t: any) => ({
				id: t.id,
				name: t.name,
				columnsCount: t.columns?.length || 0,
				columns: t.columns?.map((c: any) => ({ id: c.id, name: c.name, type: c.type }))
			}))
		});

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
