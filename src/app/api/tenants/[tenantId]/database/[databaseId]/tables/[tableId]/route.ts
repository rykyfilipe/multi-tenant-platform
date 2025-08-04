/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string; tableId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { tenantId, databaseId, tableId } = await params;
	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
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

		if (role === "ADMIN") {
			const table = await prisma.table.findFirst({
				where: {
					id: Number(tableId),
					databaseId: Number(databaseId),
				},
				include: {
					columns: true,
					rows: {
						include: {
							cells: true,
						},
						orderBy: {
							createdAt: "asc",
						},
					},
				},
			});

			if (!table) {
				return NextResponse.json(
					{ error: "Table not found" },
					{ status: 404 },
				);
			}

			return NextResponse.json(table);
		}

		// Pentru utilizatorii non-admin, verificăm permisiunile
		const permission = await prisma.tablePermission.findFirst({
			where: {
				userId: userId,
				tableId: Number(tableId),
				table: {
					databaseId: Number(databaseId),
				},
				canRead: true,
			},
			include: {
				table: {
					include: {
						columns: true,
						rows: {
							include: {
								cells: true,
							},
							orderBy: {
								createdAt: "asc",
							},
						},
					},
				},
			},
		});

		if (!permission) {
			return NextResponse.json(
				{ error: "Table not found or access denied" },
				{ status: 404 },
			);
		}

		return NextResponse.json(permission.table);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch table" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { tenantId, databaseId, tableId } = await params;
	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		// Verificăm că tabela există și aparține bazei de date și tenant-ului
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
				database: {
					tenantId: Number(tenantId),
				},
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Ștergem tabela (cascade va șterge și coloanele și rândurile)
		await prisma.table.delete({
			where: {
				id: Number(tableId),
			},
		});

		return NextResponse.json(
			{ message: "Table deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to delete table" },
			{ status: 500 },
		);
	}
}
