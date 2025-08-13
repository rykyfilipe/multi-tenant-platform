/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateJwtToken } from "@/lib/api-security";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tableId: string }> },
) {
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

		const tableId = parseInt((await params).tableId);
		if (isNaN(tableId)) {
			return NextResponse.json({ error: "Invalid table ID" }, { status: 400 });
		}

		// Get user to extract tenant ID for security
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

		// Get table details with columns (all tables are public by default)
		const table = await prisma.table.findUnique({
			where: {
				id: tableId,
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
						tenantId: true,
					},
				},
				columns: {
					select: {
						id: true,
						name: true,
						type: true,
						required: true,
						primary: true,
						order: true,
						customOptions: true,
					},
					orderBy: {
						order: "asc",
					},
				},
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			data: table,
		});
	} catch (error) {
		console.error("Error fetching table details:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
