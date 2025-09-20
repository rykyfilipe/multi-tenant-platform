/** @format */

import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import prisma, { withRetry } from "@/lib/prisma";
import { handleDatabaseError } from "@/lib/database-error-handler";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId } = await params;
	const userId = getUserId(sessionResult);
	const role = sessionResult.user.role;

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	// Parse query parameters
	const url = new URL(request.url);
	const includePredefined = url.searchParams.get('includePredefined') === 'true';

	try {
		if (role === "ADMIN") {
			// Pentru admin, returnăm toate tabelele din tenant
			// Excludem tabelele protejate doar dacă nu se solicită includerea tabelelor predefinite
			const whereCondition = {
				database: {
					tenantId: Number(tenantId),
				},
				...(includePredefined ? {} : { isProtected: false }), // Excludem tabelele protejate doar dacă nu se solicită includerea lor
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
				...(includePredefined ? {} : { isProtected: false }), // Excludem tabelele protejate doar dacă nu se solicită includerea lor
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
}
