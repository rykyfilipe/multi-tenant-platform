/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
	PUBLIC_JWT_SECRET,
	generateToken,
	verifyLogin,
	getUserFromRequest,
} from "@/lib/auth";

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
		const tokens = await prisma.apiToken.findMany({
			where: { userId },
			select: {
				id: true,
				tokenHash: true,
				name: true,
				scopes: true,
				createdAt: true,
				expiresAt: true,
				revoked: true,
			},
		});

		return NextResponse.json(tokens);
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal Server Error" },
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

	try {
		const body = await request.json();
		const { name, scopes, expiresIn } = body;

		const payload = {
			userId: userId,
			role: role,
		};

		const tokenHash = generateToken(payload, undefined, PUBLIC_JWT_SECRET);

		const newToken = await prisma.apiToken.create({
			data: {
				name: name,
				userId,
				tokenHash,
				scopes,
				expiresAt: expiresIn
					? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
					: undefined,
				revoked: false,
			},
		});

		return NextResponse.json(newToken);
	} catch (error) {
		console.error("Error creating API token:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
