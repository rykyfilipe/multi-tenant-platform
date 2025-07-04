/** @format */

import prisma from "@/lib/prisma";
import { verifyLogin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const tenantSchema = z.object({
	id: z.number().int().positive("ID must be a positive integer"),
});

export async function GET(
	request: Request,
	{ params }: { params: { id: string } },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const tenantId = parseInt(params.id, 10);
	if (isNaN(tenantId)) {
		return NextResponse.json({ error: "Invalid tenant ID" }, { status: 400 });
	}

	try {
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
