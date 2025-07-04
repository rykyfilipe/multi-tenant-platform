/** @format */

import prisma from "@/lib/prisma";
import { verifyLogin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const tenantSchema = z.object({
	id: z.string().regex(/^\d+$/, "ID must be a numeric string"),
});

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

		// Validate the params with Zod
		const validation = tenantSchema.safeParse({ id });
		if (!validation.success) {
			return NextResponse.json(
				{ error: validation.error.errors[0].message },
				{ status: 400 },
			);
		}

		const tenantId = parseInt(id, 10);
		const tenant = await prisma.tenant.findUnique({
			where: { id: tenantId },
			include: {
				users: true,
			},
		});

		if (!tenant) {
			return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
		}

		return NextResponse.json(tenant);
	} catch (error) {
		console.error("Error fetching tenant:", error);
		return NextResponse.json(
			{ error: "Failed to fetch tenant" },
			{ status: 500 },
		);
	}
}
