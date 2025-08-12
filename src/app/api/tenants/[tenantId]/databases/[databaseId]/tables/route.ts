/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";
import { checkPlanLimit, getCurrentCounts } from "@/lib/planLimits";

const TableSchema = z.object({
	name: z.string().min(1, { message: "Numele tabelei este obligatoriu" }),
	description: z.string().min(1, { message: "Descrierea  este obligatorie" }),
});

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { tenantId, databaseId } = await params;
	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsedData = TableSchema.parse(body);

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

		// Verificăm limitele planului pentru tabele
		const currentCounts = await getCurrentCounts(userId);
		const tableLimit = await checkPlanLimit(
			userId,
			"tables",
			currentCounts.tables,
		);

		if (!tableLimit.allowed) {
			return NextResponse.json(
				{
					error: `Plan limit exceeded. You can only have ${tableLimit.limit} table(s). Upgrade your plan to create more tables.`,
					limit: tableLimit.limit,
					current: tableLimit.current,
					plan: "tables",
				},
				{ status: 403 },
			);
		}

		const tableExists = await prisma.table.findFirst({
			where: {
				name: parsedData.name,
				databaseId: Number(databaseId),
			},
		});

		if (tableExists) {
			return NextResponse.json(
				{ error: "Table already exists in this database" },
				{ status: 409 },
			);
		}

		const table = await prisma.table.create({
			data: {
				name: parsedData.name,
				description: parsedData.description,
				databaseId: Number(databaseId),
			},
		});

		const users = await prisma.user.findMany({
			where: {
				tenantId: Number(tenantId),
			},
		});

		Promise.all(
			users.map((user: { id: number }) =>
				prisma.tablePermission.create({
					data: {
						userId: user.id,
						tableId: table.id,
						tenantId: Number(tenantId),
						canDelete: role === "ADMIN",
						canRead: true,
						canEdit: role === "ADMIN",
					},
				}),
			),
		);

		return NextResponse.json(table, { status: 201 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to create table" },
			{ status: 500 },
		);
	}
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { tenantId, databaseId } = await params;
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
			const tables = await prisma.table.findMany({
				where: {
					databaseId: Number(databaseId),
				},
				include: {
					columns: true,
					_count: {
						select: {
							rows: true,
						},
					},
				},
			});

			// Transform response to include rows count as empty array for backwards compatibility
			const transformedTables = tables.map((table: any) => ({
				...table,
				rows: Array(table._count.rows).fill(null), // Create array of correct length for counting
			}));

			return NextResponse.json(transformedTables);
		}

		const permTables = await prisma.tablePermission.findMany({
			where: {
				userId: userId,
				table: {
					databaseId: Number(databaseId),
				},
			},
			include: {
				table: {
					include: {
						columns: true,
						_count: {
							select: {
								rows: true,
							},
						},
					},
				},
			},
		});

		const tables = permTables
			.filter((item: any) => item.canRead)
			.map((item: any) => ({
				...item.table,
				rows: Array(item.table._count.rows).fill(null), // Create array of correct length for counting
			}));

		return NextResponse.json(tables);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch tables" },
			{ status: 500 },
		);
	}
}
