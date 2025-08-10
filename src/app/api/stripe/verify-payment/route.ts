/** @format */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-07-30.basil",
});

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { sessionId } = await request.json();

		if (!sessionId) {
			return NextResponse.json(
				{ error: "Session ID is required" },
				{ status: 400 },
			);
		}

		// Verify the checkout session with Stripe
		const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

		if (!checkoutSession) {
			return NextResponse.json(
				{ error: "Invalid session ID" },
				{ status: 400 },
			);
		}

		// Check if payment was successful
		if (checkoutSession.payment_status !== "paid") {
			return NextResponse.json(
				{ error: "Payment not completed" },
				{ status: 400 },
			);
		}

		// Verify the session belongs to the authenticated user
		if (checkoutSession.customer_email !== session.user.email) {
			return NextResponse.json(
				{ error: "Session does not belong to user" },
				{ status: 403 },
			);
		}

		// Check if session is not expired (Stripe sessions expire after 24 hours)
		const now = Math.floor(Date.now() / 1000);
		if (checkoutSession.expires_at && now > checkoutSession.expires_at) {
			return NextResponse.json({ error: "Session expired" }, { status: 400 });
		}

		// Return payment details
		return NextResponse.json({
			success: true,
			paymentStatus: checkoutSession.payment_status,
			customerEmail: checkoutSession.customer_email,
			amountTotal: checkoutSession.amount_total,
			currency: checkoutSession.currency,
			planName: checkoutSession.metadata?.planName,
			createdAt: checkoutSession.created,
		});
	} catch (error) {
		console.error("Error verifying payment:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
