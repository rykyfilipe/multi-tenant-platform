/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	getUserId,
	isAdmin,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";

const columnSchema = z.object({
	name: z.string().min(1, { message: "Numele coloanei este obligatoriu" }),
	type: z.enum(["number", "string", "float", "date"]),
	primary: z.boolean().optional(),
	autoIncrement: z.boolean().optional(),
	required: z.boolean().optional(),
	unique: z.boolean().optional(),
	default: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const tableSchema = z.object({
	columns: z
		.array(columnSchema)
		.min(1, { message: "Trebuie să ai cel puțin o coloană" }),
});

export async function POST(request: Request) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	if (role !== "ADMIN")
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsedData = tableSchema.parse(body);

		const database = await prisma.database.findMany({
			where: {
				tenant: {
					adminId: userId,
				},
			},
			select: {
				id: true,
			},
		});

		const tableExists = await prisma.table.findFirst({
			where: {
				name: body.name,
				database: {
					tenant: {
						adminId: userId,
					},
				},
			},
		});

		if (tableExists) {
			return NextResponse.json(
				{ error: "Table already exists" },
				{ status: 409 },
			);
		}

		const { columns } = parsedData;
		console.log("Creating table with columns:", columns);
		const table = await prisma.table.create({
			data: {
				name: body.name,
				columns: {
					create: columns.map((column) => ({
						name: column.name,
						type: column.type,
						primary: column.primary || false,
						autoIncrement: column.autoIncrement || false,
						required: column.required || false,
						default: column.default,
					})),
				},
				database: {
					connect: { id: database[0]?.id },
				},
				rows: {
					create: [],
				},
			},
		});

		return NextResponse.json(table, { status: 201 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to create table schema" },
			{ status: 500 },
		);
	}
}

export async function GET(request: Request) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = getUserId(request);
	if (!userId) {
		return NextResponse.json({ error: "User ID not found" }, { status: 400 });
	}

	const user = await prisma.user.findUnique({
		where: { id: Number(userId) },
	});

	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	try {
		const tables = await prisma.table.findMany({
			where: {
				database: {
					tenant: {
						adminId: user.id,
					},
				},
			},
		});
		const cleanTables = tables.map((table) => ({
			id: table.id,
			name: table.name,
			rows: Array.isArray(table.rows) ? table.rows : [],
			columns: Array.isArray(table.columns) ? table.columns : [],
		}));
		return NextResponse.json(cleanTables);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch tables" },
			{ status: 500 },
		);
	}
}

