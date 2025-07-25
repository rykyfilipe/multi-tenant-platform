/** @format */

import { getPublicUserFromRequest, verifyPublicToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const isValid = await verifyPublicToken(request);
	if (!isValid) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getPublicUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	try {
		const token = await prisma.apiToken.findFirst({
			where: { userId: userId },
			select: { scopes: true },
		});

		if (!token || !token.scopes.includes("tables:read")) {
			return NextResponse.json(
				{ error: "Forbidden: Insufficient permissions" },
				{ status: 403 },
			);
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const tables = await prisma.table.findMany({
			where: {
				database: {
					tenantId: user?.tenantId ?? 0,
				},
			},
		});
		return NextResponse.json(tables);
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
