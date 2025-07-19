/** @format */

import prisma from "@/lib/prisma";
import z from "zod";
import { NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";

const TableSchema = z.object({
	name: z.string().min(1, { message: "Numele tabelului este obligatoriu" }),
});

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ tableId: string; tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tableId, tenantId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const table = await prisma.table.findUnique({
			where: {
				id: Number(tableId),
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		const body = await request.json();
		const parsedData = TableSchema.parse(body);

		const updatedTable = await prisma.table.update({
			where: {
				id: Number(tableId),
			},
			data: {
				name: parsedData.name,
			},
		});

		return NextResponse.json(updatedTable, { status: 200 });
	} catch (error) {
		console.error("Error fetching table:", error);
		return NextResponse.json(
			{ error: "Failed to fetch table" },
			{ status: 500 },
		);
	}
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tableId: string; tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tableId, tenantId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const table = await prisma.table.findUnique({
			where: {
				id: Number(tableId),
			},
			include: {
				columns: true,
				rows: {
					include: {
						cells: true,
					},
				},
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		return NextResponse.json(table);
	} catch (error) {
		console.error("Error fetching table:", error);
		return NextResponse.json(
			{ error: "Failed to fetch table" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ tableId: string; tenantId: string }> },
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
		const { tableId } = await params;

		const table = await prisma.table.findUnique({
			where: { id: Number(tableId) },
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

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
