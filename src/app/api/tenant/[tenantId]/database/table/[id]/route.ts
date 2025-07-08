/** @format */

import prisma from "@/lib/prisma";
import z from "zod";
import { NextResponse } from "next/server";
import { getUserId, isAdmin, verifyLogin } from "@/lib/auth";

const columnSchema = z.object({
	name: z.string().min(1, { message: "Numele coloanei este obligatoriu" }),
	type: z.enum(["integer", "string", "float", "datetime"]),
	primary: z.boolean().optional(),
	autoIncrement: z.boolean().optional(),
	required: z.boolean().optional(),
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
	const admin = isAdmin(request);

	if (!logged || !admin) {
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
		const body = await request.json();
		const parsedData = tableSchema.parse(body);
		const { id } = await params;

		const table = await prisma.table.findFirst({
			where: {
				id: Number(id),
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		const { columns } = parsedData;
		console.log("Creating table with columns:", columns);

		return NextResponse.json(table);
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
