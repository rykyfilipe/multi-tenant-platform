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

		const { priceId, planName } = await request.json();

		console.log(
			`Creating checkout session for user ${session.user.id} - ${planName} plan`,
		);

		if (!priceId) {
			return NextResponse.json(
				{ error: "Price ID is required" },
				{ status: 400 },
			);
		}

		// Create Stripe checkout session
		const checkoutSession = await stripe.checkout.sessions.create({
			mode: "subscription",
			payment_method_types: ["card"],
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			success_url: `${process.env.NEXTAUTH_URL}/home?success=true&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.NEXTAUTH_URL}/?canceled=true`,
			customer_email: session.user.email,
			metadata: {
				planName,
				userId: session.user.id,
			},
			subscription_data: {
				metadata: {
					planName,
					userId: session.user.id,
				},
			},
		});

		console.log(`Checkout session created: ${checkoutSession.id}`);

		return NextResponse.json({ sessionId: checkoutSession.id });
	} catch (error) {
		console.error("Error creating checkout session:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
