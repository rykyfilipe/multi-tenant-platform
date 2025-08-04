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
	type: z.enum(["string", "boolean", "number", "date", "reference"]).optional(),
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
		const updatedColumn = await prisma.column.update({
			where: {
				id: Number(columnId),
			},
			data: {
				...(parsedData.name && { name: parsedData.name }),
				...(parsedData.type && { type: parsedData.type }),
				...(parsedData.required !== undefined && {
					required: parsedData.required,
				}),
				...(parsedData.primary !== undefined && {
					primary: parsedData.primary,
				}),
				...(parsedData.autoIncrement !== undefined && {
					autoIncrement: parsedData.autoIncrement,
				}),
				...(parsedData.referenceTableId !== undefined && {
					referenceTableId: parsedData.referenceTableId,
				}),
			},
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
