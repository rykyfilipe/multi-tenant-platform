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

		const { invoiceId, reason } = await request.json();

		if (!invoiceId) {
			return NextResponse.json(
				{ error: "Invoice ID is required" },
				{ status: 400 },
			);
		}

		// Verify the user has access to this invoice
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user?.stripeCustomerId) {
			return NextResponse.json({ error: "No customer found" }, { status: 403 });
		}

		// Fetch the invoice to verify it belongs to the user
		const invoice = (await stripe.invoices.retrieve(
			invoiceId,
		)) as Stripe.Invoice & {
			payment_intent?: string;
			subscription?: string;
		};

		if (invoice.customer !== user.stripeCustomerId) {
			return NextResponse.json(
				{ error: "Invoice not found or access denied" },
				{ status: 403 },
			);
		}

		// Check if invoice has been paid
		if (invoice.status !== "paid") {
			return NextResponse.json(
				{ error: "Invoice has not been paid" },
				{ status: 400 },
			);
		}

		// Check if refund is within 14 days (EU law compliance)
		const invoiceDate = new Date(invoice.created * 1000);
		const daysSinceInvoice = Math.floor(
			(Date.now() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
		);

		if (daysSinceInvoice > 14) {
			return NextResponse.json(
				{
					error: "Refund request is outside the 14-day window",
					details: "EU law allows refunds within 14 days of purchase",
				},
				{ status: 400 },
			);
		}

		// Check if invoice has a payment intent
		if (!invoice.payment_intent) {
			return NextResponse.json(
				{ error: "Invoice does not have an associated payment intent" },
				{ status: 400 },
			);
		}

		// Check if refund already exists
		const existingRefunds = await stripe.refunds.list({
			payment_intent: invoice.payment_intent,
		});

		if (existingRefunds.data.length > 0) {
			return NextResponse.json(
				{ error: "Refund already processed for this invoice" },
				{ status: 400 },
			);
		}

		// Process the refund
		const refund = await stripe.refunds.create({
			payment_intent: invoice.payment_intent,
			reason: reason || "requested_by_customer",
			metadata: {
				user_email: session.user.email,
				user_id: user.id.toString(),
				refund_requested_at: new Date().toISOString(),
			},
		});

		// Update user subscription status if this was a subscription payment
		if (invoice.subscription) {
			await prisma.user.update({
				where: { id: user.id },
				data: {
					subscriptionStatus: "canceled",
					subscriptionCurrentPeriodEnd: new Date(),
				},
			});
		}

		// Log the refund request
		console.log(`Refund processed for user ${session.user.email}:`, {
			invoiceId,
			refundId: refund.id,
			amount: refund.amount,
			reason,
		});

		return NextResponse.json({
			success: true,
			message: "Refund processed successfully",
			refund: {
				id: refund.id,
				amount: refund.amount,
				currency: refund.currency,
				status: refund.status,
				created: refund.created,
			},
		});
	} catch (error) {
		console.error("Error processing refund:", error);
		return NextResponse.json(
			{ error: "Failed to process refund" },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user?.stripeCustomerId) {
			return NextResponse.json({ error: "No customer found" }, { status: 403 });
		}

		// Get recent invoices that might be eligible for refund
		const invoices = await stripe.invoices.list({
			customer: user.stripeCustomerId,
			limit: 10,
			status: "paid",
		});

		const refundEligibleInvoices = invoices.data
			.filter((invoice) => {
				const invoiceDate = new Date(invoice.created * 1000);
				const daysSinceInvoice = Math.floor(
					(Date.now() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
				);
				return daysSinceInvoice <= 14;
			})
			.map((invoice) => ({
				id: invoice.id,
				number: invoice.number,
				amount: invoice.amount_paid,
				currency: invoice.currency,
				created: invoice.created,
				daysSincePurchase: Math.floor(
					(Date.now() - invoice.created * 1000) / (1000 * 60 * 60 * 24),
				),
				refundEligible: true,
			}));

		return NextResponse.json({
			success: true,
			refundEligibleInvoices,
		});
	} catch (error) {
		console.error("Error fetching refund eligible invoices:", error);
		return NextResponse.json(
			{ error: "Failed to fetch refund eligible invoices" },
			{ status: 500 },
		);
	}
}
