/** @format */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-07-30.basil",
});

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { subscriptionId } = await request.json();

		if (!subscriptionId) {
			return NextResponse.json(
				{ error: "Subscription ID is required" },
				{ status: 400 },
			);
		}

		// Verify the subscription belongs to the current user
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user || user.stripeSubscriptionId !== subscriptionId) {
			return NextResponse.json(
				{ error: "Subscription not found or access denied" },
				{ status: 403 },
			);
		}

		// Cancel the subscription at period end
		const canceledSubscription = (await stripe.subscriptions.update(
			subscriptionId,
			{
				cancel_at_period_end: true,
			},
		)) as Stripe.Subscription & { current_period_end?: number };

		// Update the user's subscription status in the database
		const currentPeriodEnd = canceledSubscription.current_period_end
			? new Date(canceledSubscription.current_period_end * 1000)
			: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now as fallback

		await prisma.user.update({
			where: { id: user.id },
			data: {
				subscriptionStatus: "canceled",
				subscriptionCurrentPeriodEnd: currentPeriodEnd,
			},
		});

		return NextResponse.json({
			success: true,
			message: "Subscription canceled successfully",
			subscription: {
				id: canceledSubscription.id,
				status: canceledSubscription.status,
				current_period_end: canceledSubscription.current_period_end,
			},
		});
	} catch (error) {
		console.error("Error canceling subscription:", error);
		return NextResponse.json(
			{ error: "Failed to cancel subscription" },
			{ status: 500 },
		);
	}
}
