/** @format */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2024-06-20",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
	console.log("🔍 DEBUG: Stripe webhook received");
	
	// Set timeout for webhook processing
	const timeoutPromise = new Promise((_, reject) => {
		setTimeout(() => reject(new Error("Webhook processing timeout")), 25000); // 25 seconds
	});

	const webhookProcessingPromise = (async () => {
		const body = await request.text();
		console.log("🔍 DEBUG: Webhook body length:", body.length);

		const headersList = await headers();
		const signature = headersList.get("stripe-signature");
		console.log("🔍 DEBUG: Signature present:", !!signature);

		if (!signature) {
			console.error("❌ No stripe signature found");
			return NextResponse.json({ error: "No signature" }, { status: 400 });
		}

		if (!webhookSecret) {
			console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
			return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
		}

		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
			console.log("✅ Webhook signature verified successfully");
			console.log("🔍 DEBUG: Event type:", event.type);
			console.log("🔍 DEBUG: Event ID:", event.id);
		} catch (err) {
			console.error("❌ Webhook signature verification failed:", err);
			return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
		}

		console.log("🔍 DEBUG: Processing event type:", event.type);
		
		switch (event.type) {
			case "checkout.session.completed":
				console.log("🔍 DEBUG: Handling checkout.session.completed");
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutSessionCompleted(session);
				break;

			case "customer.subscription.created":
			case "customer.subscription.updated":
				console.log("🔍 DEBUG: Handling subscription created/updated");
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionUpdate(subscription);
				break;

			case "customer.subscription.deleted":
				console.log("🔍 DEBUG: Handling subscription deleted");
				const deletedSubscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionDeleted(deletedSubscription);
				break;

			case "invoice.payment_succeeded":
				console.log("🔍 DEBUG: Handling payment succeeded");
				await handlePaymentSucceeded();
				break;

			case "invoice.payment_failed":
				console.log("🔍 DEBUG: Handling payment failed");
				await handlePaymentFailed();
				break;

			default:
				console.log(`🔍 DEBUG: Unhandled event type: ${event.type}`);
				break;
		}

		console.log("✅ Webhook processed successfully");
		return NextResponse.json({ received: true }, { status: 200 });
	})();

	try {
		return await Promise.race([webhookProcessingPromise, timeoutPromise]);
	} catch (error) {
		console.error("❌ Webhook error:", error);
		return NextResponse.json(
			{ error: "Webhook handler failed" },
			{ status: 500 },
		);
	}
}

async function handleCheckoutSessionCompleted(
	session: Stripe.Checkout.Session,
) {
	console.log("🔍 DEBUG: handleCheckoutSessionCompleted - session mode:", session.mode);
	console.log("🔍 DEBUG: session subscription:", session.subscription);
	
	if (session.mode === "subscription" && session.subscription) {
		try {
			const subscription = await stripe.subscriptions.retrieve(
				session.subscription as string,
			);
			console.log("🔍 DEBUG: Retrieved subscription:", subscription.id);
			await handleSubscriptionUpdate(subscription);
		} catch (error) {
			console.error("❌ Error retrieving subscription:", error);
			throw error;
		}
	} else {
		console.log("🔍 DEBUG: Session is not a subscription or no subscription ID");
	}
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
	console.log("🔍 DEBUG: handleSubscriptionUpdate - subscription ID:", subscription.id);
	console.log("🔍 DEBUG: subscription status:", subscription.status);
	console.log("🔍 DEBUG: subscription metadata:", subscription.metadata);
	
	const userId = subscription.metadata?.userId;
	const planName = subscription.metadata?.planName;

	if (!userId) {
		console.log("❌ No userId in subscription metadata");
		return;
	}

	// Get the admin user to find their tenant
	const userIdNum = parseInt(userId);
	if (isNaN(userIdNum)) {
		console.log("❌ Invalid userId in subscription metadata:", userId);
		return;
	}

	let adminUser;
	try {
		adminUser = await prisma.user.findUnique({
			where: { id: userIdNum },
			include: { tenant: true },
		});

		if (!adminUser || !adminUser.tenantId) {
			console.log("❌ Admin user or tenant not found for userId:", userId);
			return;
		}

		console.log("🔍 DEBUG: Found admin user:", adminUser.email);
		console.log("🔍 DEBUG: Tenant ID:", adminUser.tenantId);
	} catch (error) {
		console.error("❌ Database error finding admin user:", error);
		throw error;
	}

	// Calculate current period end (30 days from now as fallback)
	const subscriptionWithPeriod = subscription as Stripe.Subscription & {
		current_period_end?: number;
	};

	const currentPeriodEnd = subscriptionWithPeriod.current_period_end
		? new Date(subscriptionWithPeriod.current_period_end * 1000)
		: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

	// Update all users in the tenant with the new subscription status
	try {
		console.log("🔍 DEBUG: Updating all users in tenant:", adminUser.tenantId);
		const updateResult = await prisma.user.updateMany({
			where: { tenantId: adminUser.tenantId },
			data: {
				subscriptionStatus: subscription.status,
				subscriptionPlan: planName || "Unknown",
				subscriptionCurrentPeriodEnd: currentPeriodEnd,
			},
		});
		console.log("🔍 DEBUG: Updated users count:", updateResult.count);

		// Update the admin user's Stripe-specific fields
		console.log("🔍 DEBUG: Updating admin user Stripe fields");
		await prisma.user.update({
			where: { id: userIdNum },
			data: {
				stripeCustomerId: subscription.customer as string,
				stripeSubscriptionId: subscription.id,
			},
		});
		console.log("✅ Successfully updated subscription data");
	} catch (error) {
		console.error("❌ Database error updating subscription:", error);
		throw error;
	}
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
