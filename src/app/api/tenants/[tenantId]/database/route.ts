/** @format */

import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkPlanLimit, getCurrentCounts } from "@/lib/planLimits";
import { z } from "zod";

const createDatabaseSchema = z.object({
	name: z
		.string()
		.min(1, "Database name is required")
		.max(100, "Database name too long"),
});

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
			const databases = await prisma.database.findMany({
				where: {
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
				orderBy: {
					createdAt: "asc",
				},
			});

			return NextResponse.json(databases, { status: 200 });
		}

		// Pentru utilizatorii non-admin, returnăm doar bazele de date cu tabelele la care au acces
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
						rows: true,
					},
				},
			},
		});

		// Grupăm tabelele pe baze de date
		const databasesMap = new Map();

		tablePermissions.forEach((permission) => {
			if (permission.canRead) {
				const database = permission.table.database;
				if (!databasesMap.has(database.id)) {
					databasesMap.set(database.id, {
						...database,
						tables: [],
					});
				}
				databasesMap.get(database.id).tables.push(permission.table);
			}
		});

		const databases = Array.from(databasesMap.values());
		return NextResponse.json(databases, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch databases" },
			{ status: 500 },
		);
	}
}

export async function POST(
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

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const validation = createDatabaseSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: validation.error.errors[0].message },
				{ status: 400 },
			);
		}

		const { name } = validation.data;

		const tenant = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
		});

		if (!tenant || tenant.adminId !== userId) {
			return NextResponse.json(
				{ error: "Tenant not found or you are not the admin of this tenant" },
				{ status: 403 },
			);
		}

		// Verificăm limitele planului
		const currentCounts = await getCurrentCounts(userId);
		const databaseLimit = await checkPlanLimit(
			userId,
			"databases",
			currentCounts.databases,
		);

		if (!databaseLimit.allowed) {
			return NextResponse.json(
				{
					error: `Plan limit exceeded. You can only have ${databaseLimit.limit} database(s). Upgrade your plan to create more databases.`,
					limit: databaseLimit.limit,
					current: databaseLimit.current,
					plan: "databases",
				},
				{ status: 403 },
			);
		}

		// Verificăm dacă numele bazei de date deja există pentru acest tenant
		const existingDatabase = await prisma.database.findFirst({
			where: {
				tenantId: tenant.id,
				name: name,
			},
		});

		if (existingDatabase) {
			return NextResponse.json(
				{ error: "A database with this name already exists" },
				{ status: 400 },
			);
		}

		// Creăm Database-ul
		const newDatabase = await prisma.database.create({
			data: {
				name: name,
				tenantId: tenant.id,
			},
			include: {
				tables: true,
			},
		});

		return NextResponse.json(newDatabase, { status: 201 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to create database" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
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

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const existingDatabase = await prisma.database.findUnique({
			where: { tenantId: Number(tenantId) },
		});

		if (existingDatabase) {
			return NextResponse.json(
				{ error: "Tenant already has a database" },
				{ status: 400 },
			);
		}

		await prisma.database.deleteMany({
			where: {
				tenant: {
					adminId: userId,
				},
			},
		});

		return NextResponse.json({ message: "Database deleted!" }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch databases" },
			{ status: 500 },
		);
	}
}
