/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma, { DEFAULT_CACHE_STRATEGIES } from "@/lib/prisma";
import { z } from "zod";

const createDashboardSchema = z.object({
	name: z.string().min(1).max(100),
});

export async function GET() {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.findUniqueWithCache(
			prisma.user,
			{
				where: { email: session.user.email },
				select: { id: true },
			},
			DEFAULT_CACHE_STRATEGIES.user,
		);

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const dashboards = await prisma.findManyWithCache(
			prisma.dashboard,
			{
				where: { userId: user.id },
				include: {
					widgets: {
						orderBy: { orderIndex: "asc" },
					},
				},
				orderBy: { updatedAt: "desc" },
			},
			DEFAULT_CACHE_STRATEGIES.dashboardList,
		);

		return NextResponse.json(dashboards);
	} catch (error) {
		console.error("Error fetching dashboards:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.findUniqueWithCache(
			prisma.user,
			{
				where: { email: session.user.email },
				select: { id: true },
			},
			DEFAULT_CACHE_STRATEGIES.user,
		);

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const body = await request.json();
		const { name } = createDashboardSchema.parse(body);

		const dashboard = await prisma.dashboard.create({
			data: {
				name,
				userId: user.id,
			},
			include: {
				widgets: true,
			},
		});

		return NextResponse.json(dashboard, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 },
			);
		}

		console.error("Error creating dashboard:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
