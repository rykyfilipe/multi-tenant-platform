/** @format */

import {
	checkUserTenantAccess,
	generateToken,
	getUserFromRequest,
	hashPassword,
	verifyLogin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const userSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	firstName: z.string().min(4),
	lastName: z.string().min(4),
	role: z.enum(["VIEWER", "ADMIN"]).default("VIEWER"),
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
		const users = await prisma.user.findMany({
			where: {
				tenantId: Number(tenantId),
				id: { not: Number(userId) },
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
			},
		});

		if (!users || users.length <= 0)
			return NextResponse.json(
				{ error: "No users found for this tenant!" },
				{ status: 404 },
			);

		return NextResponse.json(users, { status: 200 });
	} catch (error) {
		console.error("Error fetching tenant:", error);
		return NextResponse.json(
			{ error: "Failed to fetch tenant" },
			{ status: 500 },
		);
	}
}
export async function POST(
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

	if (role !== "ADMIN")
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsedData = userSchema.parse(body);

		const existingUser = await prisma.user.findUnique({
			where: {
				email: parsedData.email,
			},
		});
		if (existingUser) {
			return NextResponse.json(
				{ error: "User with this email already exists" },
				{ status: 400 },
			);
		}

		// Hash the password
		const hashedPassword = await hashPassword(parsedData.password);

		// Create user in the database
		const user = await prisma.user.create({
			data: {
				email: parsedData.email,
				password: hashedPassword,
				firstName: parsedData.firstName,
				lastName: parsedData.lastName,
				role: parsedData.role,
				tenant: {
					connect: {
						id: Number(tenantId),
					},
				},
			},
		});

		const response = NextResponse.json(
			{ message: "User register successfully", user },
			{ status: 201 },
		);

		return response;
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
}
