/** @format */

import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import prisma, { withRetry } from "@/lib/prisma";
import { handleDatabaseError } from "@/lib/database-error-handler";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const { tenantId } = await params;

	try {
		// Try multiple authentication methods
		let userId: number | null = null;
		let tenantIdFromAuth: number | null = null;
		let role: string | null = null;

		// Method 1: Try NextAuth session
		const session = await getServerSession(authOptions);
		console.log('🔐 Session check:', {
			hasSession: !!session,
			userId: session?.user?.id,
			tenantId: session?.user?.tenantId,
			email: session?.user?.email
		});

		if (session?.user?.id && session.user.tenantId) {
			userId = Number(session.user.id);
			tenantIdFromAuth = Number(session.user.tenantId);
			role = session.user.role;
			console.log('✅ Using NextAuth session:', { userId, tenantId: tenantIdFromAuth, role });
		} else {
			// Method 2: Try JWT token from cookies (NextAuth format)
			console.log('🔍 Trying cookie-based authentication...');
			try {
				const jwtToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
				if (jwtToken?.id && jwtToken?.tenantId) {
					userId = Number(jwtToken.id);
					tenantIdFromAuth = Number(jwtToken.tenantId);
					role = jwtToken.role as string;
					console.log('✅ Using cookie JWT token:', { userId, tenantId: tenantIdFromAuth, role });
				}
			} catch (error) {
				console.log('❌ Cookie JWT token validation failed:', error);
			}

			// Method 3: Try Authorization header as fallback
			if (!userId || !tenantIdFromAuth) {
				console.log('🔍 Trying Authorization header authentication...');
				const authHeader = request.headers.get('authorization');
				if (authHeader?.startsWith('Bearer ')) {
					const token = authHeader.substring(7);
					try {
						// For custom JWT tokens, we need to decode them manually
						const jwt = require('jsonwebtoken');
						const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET);
						if (decoded?.userId || decoded?.id) {
							userId = decoded.userId || decoded.id;
							console.log('✅ Using custom JWT token:', { userId });

							// Look up tenantId from user if not provided in token
							if (!tenantIdFromAuth && userId) {
								console.log('🔍 Looking up tenantId for user:', userId);
								const user = await prisma.user.findUnique({
									where: { id: userId },
									select: { tenantId: true, role: true }
								});
								if (user?.tenantId) {
									tenantIdFromAuth = user.tenantId;
									role = user.role;
									console.log('✅ Found tenantId:', tenantIdFromAuth, 'role:', role);
								}
							}
						}
					} catch (error) {
						console.log('❌ Custom JWT token validation failed:', error);
					}
				}
			}
		}

		if (!userId || !tenantIdFromAuth) {
			console.log('❌ No valid authentication found');
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check tenant access
		if (String(tenantIdFromAuth) !== tenantId) {
			console.log('❌ Tenant access denied:', { userTenantId: tenantIdFromAuth, requestedTenantId: tenantId });
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

	// Parse query parameters
	const url = new URL(request.url);
	const includePredefined = url.searchParams.get('includePredefined') !== 'false';

		try {
			if (role === "ADMIN") {
				// Pentru admin, returnăm toate tabelele din tenant
				// Excludem tabelele protejate doar dacă nu se solicită includerea tabelelor predefinite
				const whereCondition = {
					database: {
						tenantId: Number(tenantId),
					},
					...(includePredefined ? {} : {
						isProtected: false,
						isModuleTable: false,
					}),
				};

				const tables = await withRetry(() => prisma.table.findMany({
					where: whereCondition,
					include: {
						database: true,
						columns: {
							orderBy: {
								order: "asc",
							},
						},
					},
				}));

				// Serializăm datele pentru a evita probleme cu tipurile Prisma
				const serializedTables = (tables as any[]).map((table:any) => ({
					...table,
					createdAt: table.createdAt?.toISOString(),
					updatedAt: table.updatedAt?.toISOString(),
					columns: table.columns?.map((column:any) => ({
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

			// Pentru utilizatorii non-admin, returnăm doar tabelele la care au acces
			// Excludem tabelele protejate doar dacă nu se solicită includerea tabelelor predefinite
			const tablePermissionsWhereCondition = {
				userId: userId,
				table: {
					database: {
						tenantId: Number(tenantId),
					},
					...(includePredefined ? {} : {
						isProtected: false,
						isModuleTable: false,
					}),
				},
			};

			const tablePermissions = await withRetry(() => prisma.tablePermission.findMany({
				where: tablePermissionsWhereCondition,
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
			}));

			const accessibleTables = (tablePermissions as any[])
				.filter((permission: { canRead: boolean }) => permission.canRead)
				.map((permission: { table: any }) => permission.table);

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

			// Check if it's a database connection error
			const dbErrorResponse = handleDatabaseError(error, `tables-${tenantId}`);
			if (dbErrorResponse) {
				return dbErrorResponse;
			}

			return NextResponse.json(
				{
					error: "Failed to fetch tables",
					details: error instanceof Error ? error.message : "Unknown error",
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Authentication error:", error);
		return NextResponse.json(
			{
				error: "Authentication failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 401 },
		);
	}
}
