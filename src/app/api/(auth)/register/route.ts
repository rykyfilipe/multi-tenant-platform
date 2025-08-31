/** @format */

import prisma, { DEFAULT_CACHE_STRATEGIES } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateToken, hashPassword } from "@/lib/auth";
import createPredefinedTables from "@/lib/predefinedTables";

const RegisterSchema = z.object({
	email: z.string().email("Invalid email format"),
	password: z
		.string()
		.min(12, "Password must be at least 12 characters")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
			"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
		)
		.max(128, "Password too long")
		.refine(
			(password) => !/(.)\1{2,}/.test(password),
			"Password cannot contain repeated characters (e.g., 'aaa', '111')",
		)
		.refine(
			(password) => !/(.)(.)\1\2/.test(password),
			"Password cannot contain repeated patterns (e.g., 'abab')",
		),
	firstName: z
		.string()
		.min(2, "First name must be at least 2 characters")
		.max(50, "First name too long"),
	lastName: z
		.string()
		.min(2, "Last name must be at least 2 characters")
		.max(50, "Last name too long"),
	role: z.enum(["VIEWER", "ADMIN"]).default("VIEWER"),
});

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsedData = RegisterSchema.parse(body);

		const existingUser = await prisma.findUniqueWithCache(
			prisma.user,
			{
				where: {
					email: parsedData.email,
				},
			},
			DEFAULT_CACHE_STRATEGIES.user,
		);
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
				subscriptionStatus: "active",
				subscriptionPlan: "Free",
				subscriptionCurrentPeriodEnd: new Date(
					Date.now() + 365 * 24 * 60 * 60 * 1000,
				), // 1 year from now
			},
		});

		const hasTenant = await prisma.findUniqueWithCache(
			prisma.tenant,
			{
				where: {
					adminId: user.id,
				},
			},
			DEFAULT_CACHE_STRATEGIES.tenant,
		);

		if (hasTenant)
			return NextResponse.json(
				{ message: "Admin already has a tenant" },
				{ status: 409 },
			);

		const newTenant = await prisma.tenant.create({
			data: {
				name: user.firstName + "'s tenant",
				adminId: user.id,
				users: { connect: { id: user.id } },
			},
		});

		const newDatabase = await prisma.database.create({
			data: {
				tenantId: newTenant.id,
			},
		});

		// Modules are now optional and can be enabled later
		// No automatic table creation during registration

		const payload = {
			userId: user.id,
			role: user.role,
		};

		const token = generateToken(payload, "7d");

		const response = NextResponse.json(
			{
				message: "User registered successfully",
				user: {
					id: user.id,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
				},
				tenant: newTenant,
				database: newDatabase,
			},
			{ status: 201 },
		);

		response.cookies.set("token", token, {
			httpOnly: true,
			path: "/",
			maxAge: 7 * 24 * 60 * 60, // 7 zile
		});
		return response;
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Registration failed";
		return NextResponse.json({ error: errorMessage }, { status: 400 });
	}
}
