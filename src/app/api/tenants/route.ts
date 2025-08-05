/** @format */

import {
	checkUserTenantAccess,
	getUserFromRequest,
	getUserId,
	isAdmin,
	verifyLogin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { error } from "console";
import { NextResponse } from "next/server";
import { z } from "zod";

const tenantSchema = z.object({
	name: z.string().min(1, "Name is required"),
	companyEmail: z.string().email().optional().or(z.literal("")),
	phone: z.string().optional(),
	website: z.string().url().optional().or(z.literal("")),
	address: z.string().optional(),
	description: z.string().optional(),
});

export async function GET(request: Request) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;
	try {
		const tenant = await prisma.tenant.findFirst({
			where: {
				users: {
					some: {
						id: userId,
					},
				},
			},
		});


		if (!tenant)
			return NextResponse.json({ error: "No tenant found" }, { status: 404 });

		return NextResponse.json(tenant);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch tenants" },
			{ status: 500 },
		);
	}
}

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

		const parsedBody = tenantSchema.parse(body);

		const hasTenant = await prisma.tenant.findUnique({
			where: {
				adminId: userId,
			},
		});

		if (hasTenant)
			return NextResponse.json(
				{ message: "Admin already has a tenant" },
				{ status: 409 },
			);

		// Clean up empty strings and convert to null
		const cleanData = Object.fromEntries(
			Object.entries(parsedBody).map(([key, value]) => [
				key,
				value === "" ? null : value,
			]),
		);

		const newTenant = await prisma.tenant.create({
			data: {
				name: cleanData.name || "",
				adminId: userId,
				companyEmail: cleanData.companyEmail,
				phone: cleanData.phone,
				website: cleanData.website,
				address: cleanData.address,
				users: { connect: { id: userId } },
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
