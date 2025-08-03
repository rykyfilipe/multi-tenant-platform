/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { id: parseInt(session.user.id) },
			select: {
				stripeCustomerId: true,
				stripeSubscriptionId: true,
				subscriptionStatus: true,
				subscriptionPlan: true,
				subscriptionCurrentPeriodEnd: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}
		console.log("User subscription data:", user);

		return NextResponse.json({
			stripeCustomerId: user.stripeCustomerId,
			stripeSubscriptionId: user.stripeSubscriptionId,
			subscriptionStatus: user.subscriptionStatus,
			subscriptionPlan: user.subscriptionPlan,
			subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
		});
	} catch (error) {
		console.error("Error fetching subscription:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
