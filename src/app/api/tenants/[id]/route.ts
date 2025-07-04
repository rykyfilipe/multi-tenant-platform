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
	{ params }: { params: { id: string } },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Validate the params with Zod
	const validation = tenantSchema.safeParse({ id: params.id });
	if (!validation.success) {
		return NextResponse.json(
			{ error: validation.error.errors[0].message },
			{ status: 400 },
		);
	}

	try {
		const tenantId = parseInt(params.id, 10);
		const tenant = await prisma.tenant.findUnique({
			where: { id: tenantId },
		});

		if (!tenant) {
			return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
		}

		return NextResponse.json(tenant);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch tenant" },
			{ status: 500 },
		);
	}
}
