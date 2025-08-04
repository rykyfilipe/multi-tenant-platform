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
	{ params }: { params: Promise<{ tenantId: string; databaseId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId, databaseId } = await params;
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
			const database = await prisma.database.findFirst({
				where: {
					id: Number(databaseId),
					tenantId: Number(tenantId),
				},
				include: {
					tenant: true,
					tables: {
						include: {
							columns: true,
							rows: true,
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

		// Pentru utilizatorii non-admin, verificăm permisiunile
		const tablePermissions = await prisma.tablePermission.findMany({
			where: {
				userId: userId,
				table: {
					databaseId: Number(databaseId),
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
						rows: true,
					},
				},
			},
		});

		if (tablePermissions.length === 0) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		const database = {
			...tablePermissions[0].table.database,
			tables: tablePermissions
				.filter((permission) => permission.canRead)
				.map((permission) => permission.table),
		};

		return NextResponse.json(database, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch database" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId, databaseId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
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

		// Ștergem baza de date și toate tabelele asociate (cascade)
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
