/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword, JWT_SECRET, generateToken } from "@/lib/auth";
import jwt from "jsonwebtoken";

const RegisterSchema = z.object({
	// Define the schema for registration
	email: z.string().email(),
	password: z.string().min(8),
});

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsedData = RegisterSchema.parse(body);

		const user = await prisma.user.findUnique({
			where: {
				email: parsedData.email,
			},
		});

		if (!user) {
			return NextResponse.json(
				{ error: "User with this email does not exist" },
				{ status: 404 },
			);
		}

		// Verify the password
		const isPasswordValid = await verifyPassword(
			parsedData.password,
			user.password,
		);
		if (!isPasswordValid) {
			return NextResponse.json({ error: "Invalid password" }, { status: 401 });
		}

		const payload = {
			userId: user.id,
			role: user.role,
		};

		const token = generateToken(payload, "7d");

		const response = NextResponse.json(
			{ message: "User log successfully", user, token },
			{ status: 200 },
		);

		response.cookies.set("token", token, {
			httpOnly: true,
			path: "/",
			maxAge: 7 * 24 * 60 * 60, // 7 zile
		});
		return response;
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
}
