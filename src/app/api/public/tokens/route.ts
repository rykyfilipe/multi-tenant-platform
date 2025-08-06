/** @format */

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
	PUBLIC_JWT_SECRET,
	generateToken,
	verifyLogin,
	getUserFromRequest,
} from "@/lib/auth";
import { checkPlanLimit, getCurrentCounts } from "@/lib/planLimits";
import { checkPlanPermission } from "@/lib/planConstants";

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

		// Verificăm permisiunea de plan pentru crearea API tokens
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { subscriptionPlan: true },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Verifică dacă planul permite crearea API tokens
		if (!checkPlanPermission(user.subscriptionPlan, "canCreateApiTokens")) {
			return NextResponse.json(
				{
					error: "API token creation is not available in your current plan. Upgrade to Pro or Business to create API tokens.",
					plan: "apiTokens",
				},
				{ status: 403 },
			);
		}

		// Verificăm limitele planului pentru API tokens
		const currentCounts = await getCurrentCounts(userId);
		const tokenLimit = await checkPlanLimit(
			userId,
			"apiTokens",
			currentCounts.apiTokens,
		);

		if (!tokenLimit.allowed) {
			return NextResponse.json(
				{
					error: `Plan limit exceeded. You can only have ${tokenLimit.limit} API token(s). Upgrade your plan to create more tokens.`,
					limit: tokenLimit.limit,
					current: tokenLimit.current,
					plan: "apiTokens",
				},
				{ status: 403 },
			);
		}

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
