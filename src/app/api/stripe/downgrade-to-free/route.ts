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

		// Verify the user is an admin
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			include: { tenant: true },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		if (user.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Only administrators can modify subscription plans" },
				{ status: 403 },
			);
		}

		if (!user.tenantId) {
			return NextResponse.json(
				{ error: "User is not associated with a tenant" },
				{ status: 400 },
			);
		}

		// If user has an active Stripe subscription, cancel it immediately
		if (user.stripeSubscriptionId) {
			try {
				// Cancel the Stripe subscription immediately
				await stripe.subscriptions.cancel(user.stripeSubscriptionId);
			} catch (stripeError) {
				// Continue with downgrade even if Stripe cancellation fails
			}
		}

		// Update all users in the tenant to Free plan
		await prisma.user.updateMany({
			where: { tenantId: user.tenantId },
			data: {
				subscriptionStatus: null, // No active subscription
				subscriptionPlan: "Free", // Set to Free plan
				subscriptionCurrentPeriodEnd: null, // No billing period for Free
			},
		});

		// Update the admin user's Stripe-specific fields
		await prisma.user.update({
			where: { id: user.id },
			data: {
				stripeCustomerId: user.stripeCustomerId, // Keep customer ID for future purchases
				stripeSubscriptionId: null, // Remove subscription ID
			},
		});

		return NextResponse.json({
			success: true,
			message: "Successfully downgraded to Free plan",
			plan: "Free",
		});
	} catch (error) {
		console.error("Error downgrading to Free plan:", error);
		return NextResponse.json(
			{ error: "Failed to downgrade subscription" },
			{ status: 500 },
		);
	}
}
