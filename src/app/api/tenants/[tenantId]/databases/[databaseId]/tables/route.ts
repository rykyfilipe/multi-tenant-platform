/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
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
	const sessionResult = await requireAuthResponse("ADMIN");
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId, databaseId } = await params;
	const userId = getUserId(sessionResult);
	const role = sessionResult.user.role;

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

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

		// Get the tenant's subscription plan to determine permissions
		const tenant = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
			include: { adminOf: true },
		});

		const subscriptionPlan = tenant?.adminOf?.subscriptionPlan || "Free";

		// Create table permissions for all users
		await Promise.all(
			users.map((user: { id: number; role: string }) =>
				prisma.tablePermission.create({
					data: {
						userId: user.id,
						tableId: table.id,
						tenantId: Number(tenantId),
						canDelete: subscriptionPlan === "Free" ? (user.role === "EDITOR" || user.role === "ADMIN" || user.role === "VIEWER") : (user.role === "ADMIN"),
						canRead: true,
						canEdit: subscriptionPlan === "Free" ? (user.role === "EDITOR" || user.role === "ADMIN" || user.role === "VIEWER") : (user.role === "ADMIN"),
					},
				}),
			),
		);

		// Get columns for the table to create column permissions
		const columns = await prisma.column.findMany({
			where: { tableId: table.id },
		});

		// Create column permissions for all users
		await Promise.all(
			users.flatMap((user: { id: number; role: string }) =>
				columns.map((column: { id: number }) =>
					prisma.columnPermission.create({
						data: {
							userId: user.id,
							columnId: column.id,
							tableId: table.id,
							tenantId: Number(tenantId),
							canRead: true,
							canEdit: subscriptionPlan === "Free" ? (user.role === "EDITOR" || user.role === "ADMIN" || user.role === "VIEWER") : (user.role === "ADMIN"),
						},
					}),
				),
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
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId, databaseId } = await params;
	const userId = getUserId(sessionResult);
	const role = sessionResult.user.role;

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

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

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string }> },
) {
	const sessionResult = await requireAuthResponse("ADMIN");
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}

	const { tenantId, databaseId } = await params;
	const userId = getUserId(sessionResult);
	const role = sessionResult.user.role;

	// Check tenant access
	const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		const { searchParams } = new URL(request.url);
		const tableId = searchParams.get("tableId");

		if (!tableId) {
			return NextResponse.json(
				{ error: "Table ID is required" },
				{ status: 400 },
			);
		}

		// Check if table is protected
		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
				database: { tenantId: Number(tenantId) },
			},
		});

		if (!table) {
			return NextResponse.json(
				{ error: "Table not found" },
				{ status: 404 },
			);
		}

		// Prevent deletion of protected tables
		if (table.isProtected) {
			return NextResponse.json(
				{ error: "Cannot delete protected table. This table is required for system functionality." },
				{ status: 403 },
			);
		}

		// Delete the table (this will cascade to columns, rows, and cells)
		await prisma.table.delete({
			where: { id: Number(tableId) },
		});

		return NextResponse.json({ message: "Table deleted successfully" });
	} catch (error) {
		console.error("Error deleting table:", error);
		return NextResponse.json(
			{ error: "Failed to delete table" },
			{ status: 500 },
		);
	}
}
