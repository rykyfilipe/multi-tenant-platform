/** @format */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-07-30.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
	try {
		const body = await request.text();

		const headersList = await headers();
		const signature = headersList.get("stripe-signature");

		if (!signature) {
			console.error("No stripe signature found");
			return NextResponse.json({ error: "No signature" }, { status: 400 });
		}

		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
		} catch (err) {
			console.error("Webhook signature verification failed:", err);
			return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
		}

		switch (event.type) {
			case "checkout.session.completed":
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutSessionCompleted(session);
				break;

			case "customer.subscription.created":
			case "customer.subscription.updated":
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionUpdate(subscription);
				break;

			case "customer.subscription.deleted":
				const deletedSubscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionDeleted(deletedSubscription);
				break;

			case "invoice.payment_succeeded":
				await handlePaymentSucceeded();
				break;

			case "invoice.payment_failed":
				await handlePaymentFailed();
				break;

			default:
				console.log(`Unhandled event type: ${event.type}`);
				break;
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("Webhook error:", error);
		return NextResponse.json(
			{ error: "Webhook handler failed" },
			{ status: 500 },
		);
	}
}

async function handleCheckoutSessionCompleted(
	session: Stripe.Checkout.Session,
) {
	if (session.mode === "subscription" && session.subscription) {
		const subscription = await stripe.subscriptions.retrieve(
			session.subscription as string,
		);

		await handleSubscriptionUpdate(subscription);
	}
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
	const userId = subscription.metadata?.userId;
	const planName = subscription.metadata?.planName;

	if (!userId) {
		console.log("No userId in subscription metadata");
		return;
	}

	// Get the admin user to find their tenant
	const userIdNum = parseInt(userId);
	if (isNaN(userIdNum)) {
		console.log("Invalid userId in subscription metadata:", userId);
		return;
	}

	const adminUser = await prisma.user.findUnique({
		where: { id: userIdNum },
		include: { tenant: true },
	});

	if (!adminUser || !adminUser.tenantId) {
		console.log("Admin user or tenant not found for userId:", userId);
		return;
	}

	// Calculate current period end (30 days from now as fallback)
	const subscriptionWithPeriod = subscription as Stripe.Subscription & {
		current_period_end?: number;
	};

	const currentPeriodEnd = subscriptionWithPeriod.current_period_end
		? new Date(subscriptionWithPeriod.current_period_end * 1000)
		: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

	// Update all users in the tenant with the new subscription status
	await prisma.user.updateMany({
		where: { tenantId: adminUser.tenantId },
		data: {
			subscriptionStatus: subscription.status,
			subscriptionPlan: planName || "Unknown",
			subscriptionCurrentPeriodEnd: currentPeriodEnd,
		},
	});

	// Update the admin user's Stripe-specific fields
	await prisma.user.update({
		where: { id: userIdNum },
		data: {
			stripeCustomerId: subscription.customer as string,
			stripeSubscriptionId: subscription.id,
		},
	});
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	const userId = subscription.metadata?.userId;

	if (!userId) {
		console.log("No userId in subscription metadata for deleted subscription");
		return;
	}

	// Get the admin user to find their tenant
	const userIdNum = parseInt(userId);
	if (isNaN(userIdNum)) {
		console.log(
			"Invalid userId in subscription metadata for deleted subscription:",
			userId,
		);
		return;
	}

	const adminUser = await prisma.user.findUnique({
		where: { id: userIdNum },
		include: { tenant: true },
	});

	if (!adminUser || !adminUser.tenantId) {
		console.log("Admin user or tenant not found for userId:", userId);
		return;
	}

	// Calculate current period end (30 days from now as fallback)
	const subscriptionWithPeriod = subscription as Stripe.Subscription & {
		current_period_end?: number;
	};

	const currentPeriodEnd = subscriptionWithPeriod.current_period_end
		? new Date(subscriptionWithPeriod.current_period_end * 1000)
		: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

	// Update all users in the tenant to Free plan when subscription is deleted
	await prisma.user.updateMany({
		where: { tenantId: adminUser.tenantId },
		data: {
			subscriptionStatus: null, // No active subscription
			subscriptionPlan: "Free", // Default to Free plan
			subscriptionCurrentPeriodEnd: null, // No billing period for Free
		},
	});

	// Update the admin user's Stripe-specific fields
	await prisma.user.update({
		where: { id: userIdNum },
		data: {
			stripeSubscriptionId: null, // Remove subscription ID
		},
	});
}

async function handlePaymentSucceeded() {
	// Handle successful payment - this is already handled by handleSubscriptionUpdate
	// when the subscription status changes to active
	console.log("Payment succeeded - subscription status updated");
}

async function handlePaymentFailed() {
	// Handle failed payment - this is already handled by handleSubscriptionUpdate
	// when the subscription status changes to past_due or unpaid
	console.log("Payment failed - subscription status updated");
}
