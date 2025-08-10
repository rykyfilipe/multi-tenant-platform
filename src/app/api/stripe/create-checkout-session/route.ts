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

		const { priceId, planName } = await request.json();

		// Creating checkout session

		if (!priceId) {
			return NextResponse.json(
				{ error: "Price ID is required" },
				{ status: 400 },
			);
		}

		// Verify the user is an admin
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
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
			success_url: `${process.env.NEXTAUTH_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
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

		return NextResponse.json({ sessionId: checkoutSession.id });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
