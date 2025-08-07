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

		const { customerId } = await request.json();

		if (!customerId) {
			return NextResponse.json(
				{ error: "Customer ID is required" },
				{ status: 400 },
			);
		}

		// Verify the user is an admin
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 },
			);
		}

		if (user.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Only administrators can access billing management" },
				{ status: 403 },
			);
		}

		// Create customer portal session
		try {
			const portalSession = await stripe.billingPortal.sessions.create({
				customer: customerId,
				return_url: `${process.env.NEXTAUTH_URL}/home/settings`,
			});

			return NextResponse.json({ url: portalSession.url });
		} catch (portalError: any) {
			// If portal is not configured, provide alternative
			if (portalError.message.includes("No configuration provided")) {
				return NextResponse.json(
					{
						error:
							"Customer portal not configured. Please contact support or configure it in Stripe Dashboard.",
						details:
							"Go to https://dashboard.stripe.com/settings/billing/portal to configure Customer Portal",
					},
					{ status: 400 },
				);
			}
			throw portalError;
		}
	} catch (error) {
		console.error("Error creating portal session:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
