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
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { tenantId } = await params;
	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsedData = TableSchema.parse(body);

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

		const database = await prisma.database.findFirst({
			where: {
				tenantId: Number(tenantId),
			},
		});

		const tableExists = await prisma.table.findFirst({
			where: {
				name: parsedData.name,
				databaseId: database?.id,
			},
		});

		if (tableExists) {
			return NextResponse.json(
				{ error: "Table already exists" },
				{ status: 409 },
			);
		}

		const table = await prisma.table.create({
			data: {
				name: parsedData.name,
				description: parsedData.description,
				database: {
					connect: {
						tenantId: Number(tenantId),
					},
				},
			},
		});

		const users = await prisma.user.findMany({
			where: {
				tenantId: Number(tenantId),
			},
		});

		Promise.all(
			users.map((user) =>
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
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { tenantId } = await params;
	const { userId, role } = userResult;
	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		if (role === "ADMIN") {
			const tables = await prisma.table.findMany({
				where: {
					database: {
						tenantId: Number(tenantId),
					},
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

			return NextResponse.json(tables);
		}

		const permTables = await prisma.tablePermission.findMany({
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

		const tables = permTables.map((item) => item.table);

		return NextResponse.json(tables);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch tables" },
			{ status: 500 },
		);
	}
}
