/** @format */

import { getUserId, isAdmin, verifyLogin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const tenantSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

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
		where: {
			id: Number(userId),
		},
	});

	try {
		const tenants = await prisma.tenant.findMany({
			where: {
				adminId: user?.id,
			},
			include: {
				database: true,
			},
		});
		return NextResponse.json(tenants);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch tenants" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	const logged = verifyLogin(request);
	const admin = isAdmin(request);
	if (!logged || !admin) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = getUserId(request);

	const user = await prisma.user.findUnique({
		where: {
			id: Number(userId),
		},
	});

	if (!user || user.role !== "ADMIN") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	try {
		const body = await request.json();
		const parsedBody = tenantSchema.parse(body);

		const existingTenant = await prisma.tenant.findUnique({
			where: {
				name: parsedBody.name,
			},
		});

		if (existingTenant) {
			return NextResponse.json(
				{ error: "Tenant with this slug already exists" },
				{ status: 400 },
			);
		}

		const newTenant = await prisma.tenant.create({
			data: {
				name: parsedBody.name,
				adminId: user.id,
			},
		});

		return NextResponse.json(newTenant, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		return NextResponse.json(
			{ error: "Failed to create tenant" },
			{ status: 500 },
		);
	}
}
