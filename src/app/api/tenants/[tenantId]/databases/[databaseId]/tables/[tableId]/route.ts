/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";

export async function GET(
	request: Request,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
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
			// Get URL parameters to check if full data is needed
			const url = new URL(request.url);
			const includeRows = url.searchParams.get("includeRows") === "true";
			const includeCells = url.searchParams.get("includeCells") === "true";

			const table = await prisma.table.findFirst({
				where: {
					id: Number(tableId),
					databaseId: Number(databaseId),
				},
				include: {
					columns: {
						orderBy: {
							order: "asc",
						},
					},
					rows: includeRows
						? {
								include: {
									cells: includeCells,
								},
								orderBy: {
									createdAt: "asc",
								},
						  }
						: false,
					_count: {
						select: {
							rows: true,
						},
					},
				},
			});

			if (!table) {
				return NextResponse.json({ error: "Table not found" }, { status: 404 });
			}

			return NextResponse.json(table);
		}

		// Pentru utilizatorii non-admin, verificăm permisiunile
		const url = new URL(request.url);
		const includeRows = url.searchParams.get("includeRows") === "true";
		const includeCells = url.searchParams.get("includeCells") === "true";
		const page = url.searchParams.get("page") || "1";
		const pageSize = url.searchParams.get("pageSize") || "10";

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
						columns: {
							orderBy: {
								order: "asc",
							},
						},
						rows:
							includeRows && page && pageSize
								? {
										skip: (Number(page) - 1) * Number(pageSize),
										take: Number(pageSize),
										include: {
											cells: includeCells,
										},
										orderBy: {
											createdAt: "asc",
										},
								  }
								: false,
						_count: {
							select: {
								rows: true,
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
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
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

		// Protejăm tabelele predefinite de ștergere
		if (table.isPredefined) {
			return NextResponse.json(
				{
					error:
						"Cannot delete predefined tables. These tables are protected and required for system functionality.",
				},
				{ status: 403 },
			);
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

export async function PATCH(
	request: Request,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const sessionResult = await requireAuthAPI();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
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

		const body = await request.json();
		const { name, description } = body;

		// Validăm datele
		if (
			name !== undefined &&
			(typeof name !== "string" || name.trim().length === 0)
		) {
			return NextResponse.json(
				{ error: "Name must be a non-empty string" },
				{ status: 400 },
			);
		}

		if (description !== undefined && typeof description !== "string") {
			return NextResponse.json(
				{ error: "Description must be a string" },
				{ status: 400 },
			);
		}

		// Actualizăm tabela
		const updatedTable = await prisma.table.update({
			where: {
				id: Number(tableId),
			},
			data: {
				...(name !== undefined && { name: name.trim() }),
				...(description !== undefined && { description }),
			},
		});

		return NextResponse.json(updatedTable);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to update table" },
			{ status: 500 },
		);
	}
}
