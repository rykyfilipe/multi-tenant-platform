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

		const { customerId } = await request.json();

		if (!customerId) {
			return NextResponse.json(
				{ error: "Customer ID is required" },
				{ status: 400 },
			);
		}

		// Create customer portal session
		const portalSession = await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: `${process.env.NEXTAUTH_URL}/home/settings`,
		});

		return NextResponse.json({ url: portalSession.url });
	} catch (error) {
		console.error("Error creating portal session:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
