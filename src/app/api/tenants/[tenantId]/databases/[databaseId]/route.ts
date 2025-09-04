/** @format */

import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string }> },
) {
	const { tenantId, databaseId } = await params;
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
			const database = await prisma.database.findFirst({
				where: {
					tenantId: Number(tenantId),
					id: Number(databaseId),
				},
				include: {
					tenant: true,
					tables: {
						include: {
							columns: true,
							rows: {
								include: {
									cells: true,
								},
							},
						},
					},
				},
			});

			if (!database) {
				return NextResponse.json(
					{ error: "Database not found" },
					{ status: 404 },
				);
			}

			return NextResponse.json(database, { status: 200 });
		}

		// Pentru utilizatorii non-admin, returnăm doar baza de date specifică cu tabelele la care au acces
		const tablePermissions = await prisma.tablePermission.findMany({
			where: {
				userId: userId,
				table: {
					database: {
						tenantId: Number(tenantId),
						id: Number(databaseId),
					},
				},
			},
			include: {
				table: {
					include: {
						database: true,
						columns: true,
						rows: true,
					},
				},
			},
		});

		// Construim baza de date cu tabelele la care utilizatorul are acces
		const accessibleTables = tablePermissions
			.filter((permission: { canRead: boolean }) => permission.canRead)
			.map((permission: { table: unknown }) => permission.table);

		if (accessibleTables.length === 0) {
			return NextResponse.json(
				{ error: "Database not found or access denied" },
				{ status: 404 },
			);
		}

		// Luăm prima bază de date (toate tabelele ar trebui să aparțină aceleiași baze de date)
		const database = accessibleTables[0].database;
		const databaseWithTables = {
			...database,
			tables: accessibleTables,
		};

		return NextResponse.json(databaseWithTables, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch databases" },
			{ status: 500 },
		);
	}
}
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string }> },
) {
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId, databaseId } = await params;
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const { user } = sessionResult;
	const userId = user.id;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const database = await prisma.database.findFirst({
			where: {
				id: Number(databaseId),
				tenantId: Number(tenantId),
			},
			include: {
				tables: {
					where: {
						isPredefined: true,
					},
				},
			},
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		// Check if database contains predefined tables
		if (database.tables.length > 0) {
			return NextResponse.json(
				{
					error:
						"Cannot delete database that contains predefined tables. These tables are protected and required for system functionality.",
				},
				{ status: 403 },
			);
		}

		// Delete the database and all associated tables (cascade)
		await prisma.database.delete({
			where: {
				id: Number(databaseId),
			},
		});

		return NextResponse.json(
			{ message: "Database deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to delete database" },
			{ status: 500 },
		);
	}
}
