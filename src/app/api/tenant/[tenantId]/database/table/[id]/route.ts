/** @format */

import prisma from "@/lib/prisma";
import z from "zod";
import { NextResponse } from "next/server";
import { getUserFromRequest, isAdmin, verifyLogin } from "@/lib/auth";

const columnSchema = z.object({
	name: z.string().min(1, { message: "Numele coloanei este obligatoriu" }),
	type: z.enum(["integer", "string", "number", "date", "boolean"]),
	primary: z.boolean().optional(),
	autoIncrement: z.boolean().optional(),
	required: z.boolean().optional(),
	unique: z.boolean().optional(),

	default: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const tableSchema = z.object({
	name: z.string().min(1, { message: "Numele tabelului este obligatoriu" }),
	columns: z
		.array(columnSchema)
		.min(1, { message: "Trebuie să ai cel puțin o coloană" }),
});

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const { id } = await params;

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

		if (!tableExists) {
			return NextResponse.json({ error: "Table nu exista" }, { status: 408 });
		}

		const { columns } = parsedData;
		const table = await prisma.table.update({
			where: {
				id: Number(id),
			},
			data: {
				name: body.name,
				columns: columns.map((column) => ({
					name: column.name,
					type: column.type,
					primary: column.primary || false,
					autoIncrement: column.autoIncrement || false,
					required: column.required || false,
					default: column.default,
					unique: column.unique,
				})),
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

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;

		const table = await prisma.table.findUnique({
			where: {
				id: Number(id),
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
	{ params }: { params: Promise<{ id: string }> },
) {
	const logged = verifyLogin(request);
	const admin = isAdmin(request);

	if (!logged || !admin) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;

		const table = await prisma.table.findUnique({
			where: { id: Number(id) },
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		await prisma.table.delete({
			where: { id: Number(id) },
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
