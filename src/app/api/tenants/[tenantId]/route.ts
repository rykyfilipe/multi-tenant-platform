/** @format */

import prisma from "@/lib/prisma";
import {
	getUserFromRequest,
	checkUserTenantAccess,
	verifyLogin,
} from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const tenantSchema = z.object({
	tenantId: z.string().regex(/^\d+$/, "tenantId must be a numeric string"),
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string }> },
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

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const validation = tenantSchema.safeParse({ tenantId });
		if (!validation.success) {
			return NextResponse.json(
				{ error: validation.error.errors[0].message },
				{ status: 400 },
			);
		}

		const tenant_id = parseInt(tenantId, 10);
		const tenant = await prisma.tenant.findUnique({
			where: { id: tenant_id },
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
