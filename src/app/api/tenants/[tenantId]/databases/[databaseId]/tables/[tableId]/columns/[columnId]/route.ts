/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";

const ColumnUpdateSchema = z.object({
	name: z.string().optional(),
	type: z.enum(["string", "text", "boolean", "number", "date", "reference", "customArray"]).transform((type) => type === "text" ? "string" : type).optional(),
	required: z.boolean().optional(),
	primary: z.boolean().optional(),
	autoIncrement: z.boolean().optional(),
	referenceTableId: z.number().optional(),
});

export async function PATCH(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{
			tenantId: string;
			databaseId: string;
			tableId: string;
			columnId: string;
		}>;
	},
) {
	const { tenantId, databaseId, tableId, columnId } = await params;
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (role === "VIEWER" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsedData = ColumnUpdateSchema.parse(body);

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

		// Verificăm că coloana există și aparține tabelului corect
		const column = await prisma.column.findFirst({
			where: {
				id: Number(columnId),
				tableId: Number(tableId),
				table: {
					databaseId: Number(databaseId),
				},
			},
		});

		if (!column) {
			return NextResponse.json({ error: "Column not found" }, { status: 404 });
		}

		// Verificăm permisiunile pentru utilizatorii non-admin
		if (role !== "ADMIN") {
			const permission = await prisma.tablePermission.findFirst({
				where: {
					userId: userId,
					tableId: Number(tableId),
					canEdit: true,
				},
			});

			if (!permission) {
				return NextResponse.json({ error: "Access denied" }, { status: 403 });
			}
		}

		// Actualizăm coloana
		const updateData: any = {};

		if (parsedData.name !== undefined) updateData.name = parsedData.name;
		if (parsedData.type !== undefined) updateData.type = parsedData.type;
		if (parsedData.required !== undefined)
			updateData.required = parsedData.required;
		if (parsedData.primary !== undefined)
			updateData.primary = parsedData.primary;
		if (parsedData.autoIncrement !== undefined)
			updateData.autoIncrement = parsedData.autoIncrement;
		if (parsedData.referenceTableId !== undefined)
			updateData.referenceTableId = parsedData.referenceTableId;

		const updatedColumn = await prisma.column.update({
			where: {
				id: Number(columnId),
			},
			data: updateData,
		});

		return NextResponse.json(updatedColumn);
	} catch (error) {
		console.error("Error updating column:", error);
		return NextResponse.json(
			{ error: "Failed to update column" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{
			tenantId: string;
			databaseId: string;
			tableId: string;
			columnId: string;
		}>;
	},
) {
	const { tenantId, databaseId, tableId, columnId } = await params;
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (role === "VIEWER" || !isMember)
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

		// Verificăm că coloana există și aparține tabelului corect
		const column = await prisma.column.findFirst({
			where: {
				id: Number(columnId),
				tableId: Number(tableId),
				table: {
					databaseId: Number(databaseId),
				},
			},
		});

		if (!column) {
			return NextResponse.json({ error: "Column not found" }, { status: 404 });
		}

		// Verificăm permisiunile pentru utilizatorii non-admin
		if (role !== "ADMIN") {
			const permission = await prisma.tablePermission.findFirst({
				where: {
					userId: userId,
					tableId: Number(tableId),
					canEdit: true,
				},
			});

			if (!permission) {
				return NextResponse.json({ error: "Access denied" }, { status: 403 });
			}
		}

		// Verificăm dacă coloana este primară (nu poate fi ștearsă)
		if (column.primary) {
			return NextResponse.json(
				{ error: "Cannot delete primary column" },
				{ status: 400 },
			);
		}

		// Ștergem coloana (celulele se vor șterge automat prin cascade)
		await prisma.column.delete({
			where: {
				id: Number(columnId),
			},
		});

		return NextResponse.json(
			{ message: "Column deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error deleting column:", error);
		return NextResponse.json(
			{ error: "Failed to delete column" },
			{ status: 500 },
		);
	}
}
