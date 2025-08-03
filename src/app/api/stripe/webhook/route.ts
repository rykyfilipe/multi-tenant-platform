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
			return NextResponse.json({ error: "No signature" }, { status: 400 });
		}

		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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

	// Type assertion to access current_period_end
	const subscriptionWithPeriod = subscription as Stripe.Subscription & {
		current_period_end: number;
	};

	// Update user's subscription status in database
	const updatedUser = await prisma.user.update({
		where: { id: parseInt(userId) },
		data: {
			stripeCustomerId: subscription.customer as string,
			stripeSubscriptionId: subscription.id,
			subscriptionStatus: subscription.status,
			subscriptionPlan: planName,
			subscriptionCurrentPeriodEnd: new Date(
				subscriptionWithPeriod.current_period_end * 1000,
			),
		},
	});

	console.log(`Updated user ${userId} subscription to ${planName} plan`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	const userId = subscription.metadata?.userId;

	if (!userId) return;

	// Type assertion to access current_period_end
	const subscriptionWithPeriod = subscription as Stripe.Subscription & {
		current_period_end: number;
	};

	// Update user's subscription status to canceled
	await prisma.user.update({
		where: { id: parseInt(userId) },
		data: {
			subscriptionStatus: "canceled",
			subscriptionCurrentPeriodEnd: new Date(
				subscriptionWithPeriod.current_period_end * 1000,
			),
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
