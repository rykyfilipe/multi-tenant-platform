/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateJwtToken } from "@/lib/api-security";

export async function GET(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return NextResponse.json(
				{ error: "Missing or invalid authorization header" },
				{ status: 401 },
			);
		}

		const token = authHeader.substring(7);
		const tokenData = await validateJwtToken(token);

		if (!tokenData.isValid) {
			return NextResponse.json(
				{ error: "Invalid or expired JWT token" },
				{ status: 401 },
			);
		}

		if (!tokenData.userId) {
			return NextResponse.json(
				{ error: "Invalid token data" },
				{ status: 401 },
			);
		}

		// Get user to extract tenant ID
		const user = await prisma.user.findUnique({
			where: { id: tokenData.userId },
			select: { tenantId: true },
		});

		if (!user || !user.tenantId) {
			return NextResponse.json(
				{ error: "User not associated with any tenant" },
				{ status: 403 },
			);
		}

		// Get all tables for the user's tenant (all tables are public by default)
		const tables = await prisma.table.findMany({
			where: {
				database: {
					tenantId: user.tenantId,
				},
			},
			select: {
				id: true,
				name: true,
				description: true,
				database: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		return NextResponse.json({
			success: true,
			data: tables,
			count: tables.length,
		});
	} catch (error) {
		console.error("Error fetching public tables:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
