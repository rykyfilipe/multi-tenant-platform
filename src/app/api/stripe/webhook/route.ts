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
	console.log("=== WEBHOOK RECEIVED ===");
	console.log("Request method:", request.method);
	console.log("Request URL:", request.url);

	try {
		const body = await request.text();
		console.log("Request body length:", body.length);

		const headersList = await headers();
		const signature = headersList.get("stripe-signature");
		console.log("Stripe signature present:", !!signature);

		if (!signature) {
			console.error("No stripe signature found");
			return NextResponse.json({ error: "No signature" }, { status: 400 });
		}

		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
			console.log("Event constructed successfully");
		} catch (err) {
			console.error("Webhook signature verification failed:", err);
			return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
		}

		console.log(`Processing webhook event: ${event.type}`);

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
				const invoice = event.data.object as Stripe.Invoice;
				await handlePaymentSucceeded(invoice);
				break;

			case "invoice.payment_failed":
				const failedInvoice = event.data.object as Stripe.Invoice;
				await handlePaymentFailed(failedInvoice);
				break;

			default:
				console.log(`Unhandled event type: ${event.type}`);
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
		console.error("No userId found in subscription metadata");
		return;
	}

	// Calculate current period end (30 days from now as fallback)
	const subscriptionWithPeriod = subscription as Stripe.Subscription & {
		current_period_end?: number;
	};

	const currentPeriodEnd = subscriptionWithPeriod.current_period_end
		? new Date(subscriptionWithPeriod.current_period_end * 1000)
		: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

	console.log(`Current period end: ${currentPeriodEnd.toISOString()}`);

	// Update user's subscription status in database
	const updatedUser = await prisma.user.update({
		where: { id: parseInt(userId) },
		data: {
			stripeCustomerId: subscription.customer as string,
			stripeSubscriptionId: subscription.id,
			subscriptionStatus: subscription.status,
			subscriptionPlan: planName,
			subscriptionCurrentPeriodEnd: currentPeriodEnd,
		},
	});

	console.log(`Updated user ${userId} subscription to ${planName} plan`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	const userId = subscription.metadata?.userId;

	if (!userId) return;

	// Calculate current period end (30 days from now as fallback)
	const subscriptionWithPeriod = subscription as Stripe.Subscription & {
		current_period_end?: number;
	};

	const currentPeriodEnd = subscriptionWithPeriod.current_period_end
		? new Date(subscriptionWithPeriod.current_period_end * 1000)
		: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

	// Update user's subscription status to canceled
	await prisma.user.update({
		where: { id: parseInt(userId) },
		data: {
			subscriptionStatus: "canceled",
			subscriptionCurrentPeriodEnd: currentPeriodEnd,
		},
	});
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
	// Handle successful payment
	console.log("Payment succeeded for invoice:", invoice.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
	// Handle failed payment
	console.log("Payment failed for invoice:", invoice.id);
}
