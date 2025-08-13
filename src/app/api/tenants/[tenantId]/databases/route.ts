/** @format */

import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkPlanLimit, getCurrentCounts } from "@/lib/planLimits";
import { checkPlanPermission } from "@/lib/planConstants";
import { z } from "zod";
import {
	withApiCache,
	createCacheKey,
	createRoleBasedCacheKey,
	CACHE_DURATIONS,
} from "@/lib/api-cache-middleware";
import { Database } from "@/generated/prisma";

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
		const cacheKey = createRoleBasedCacheKey(
			"databases",
			Number(tenantId),
			userId,
			role,
		);

		if (role === "ADMIN") {
			return await withApiCache(
				request,
				{ key: cacheKey, duration: CACHE_DURATIONS.DATABASE_LIST },
				async () => {
					// Optimized: Single query with proper joins to avoid N+1
					const databases = await prisma.database.findMany({
						where: {
							tenantId: Number(tenantId),
						},
						select: {
							id: true,
							name: true,
							tenantId: true,
							// Optimized: Only get essential table metadata, not full data
							tables: {
								select: {
									id: true,
									name: true,
									description: true,
									_count: {
										select: {
											columns: true,
											rows: true,
										},
									},
								},
							},
						},
						orderBy: {
							createdAt: "asc",
						},
					});

					// Optimize table data format for frontend compatibility
					const optimizedDatabases = databases.map((db: any) => ({
						...db,
						tables: db.tables.map((table: any) => ({
							...table,
							columnsCount: table._count.columns,
							rowsCount: table._count.rows,
							// Remove _count from the response
							_count: undefined,
						})),
					}));

					return optimizedDatabases;
				},
			);
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
											select: {
							id: true,
							name: true,
							description: true,
							databaseId: true,
							database: {
								select: {
									id: true,
									name: true,
									tenantId: true,
									createdAt: true,
								},
							},
							_count: {
								select: {
									columns: true,
									rows: true,
								},
							},
						},
				},
			},
		});

		// Grupăm tabelele pe baze de date
		const databasesMap = new Map();

		tablePermissions.forEach((permission: any) => {
			if (permission?.canRead && permission?.table?.database) {
				const database = permission.table.database;
				if (!databasesMap.has(database.id)) {
					databasesMap.set(database.id, {
						...database,
						tables: [],
					});
				}
				// Transform table data for backwards compatibility
				const transformedTable = {
					...permission.table,
					columns: Array(permission.table._count?.columns || 0).fill(null),
					rows: Array(permission.table._count?.rows || 0).fill(null),
				};
				delete (transformedTable as any)._count; // Remove the count object
				databasesMap.get(database.id).tables.push(transformedTable);
			}
		});

		const databases = Array.from(databasesMap.values());
		return NextResponse.json(databases, { status: 200 });
	} catch (error) {
		// Database fetch error
		console.error("Error fetching databases:", error);
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

		// Verificăm permisiunea de plan pentru crearea bazelor de date
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { subscriptionPlan: true },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Verifică dacă planul permite crearea bazelor de date
		if (!checkPlanPermission(user.subscriptionPlan, "canCreateDatabases")) {
			return NextResponse.json(
				{
					error:
						"Database creation is not available in your current plan. Upgrade to Pro or Business to create multiple databases.",
					plan: "databases",
				},
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
		// Database creation error
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
		// Check if any databases exist for this tenant
		const existingDatabase = await prisma.database.findFirst({
			where: {
				tenantId: Number(tenantId),
			},
		});

		if (!existingDatabase) {
			return NextResponse.json(
				{ error: "No database found for this tenant" },
				{ status: 404 },
			);
		}

		// Delete all databases for this tenant
		await prisma.database.deleteMany({
			where: {
				tenantId: Number(tenantId),
			},
		});

		return NextResponse.json({ message: "Database deleted!" }, { status: 200 });
	} catch (error) {
		// Database deletion error
		return NextResponse.json(
			{ error: "Failed to delete database" },
			{ status: 500 },
		);
	}
}
