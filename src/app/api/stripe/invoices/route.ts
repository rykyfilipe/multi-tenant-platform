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

		// Verify the customer belongs to the current user
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user || user.stripeCustomerId !== customerId) {
			return NextResponse.json(
				{ error: "Customer not found or access denied" },
				{ status: 403 },
			);
		}

		// Fetch invoices from Stripe
		const invoices = await stripe.invoices.list({
			customer: customerId,
			limit: 50,
			expand: ["data.payment_intent"],
		});

		// Format the invoices for the frontend
		const formattedInvoices = invoices.data.map((invoice) => ({
			id: invoice.id,
			number: invoice.number,
			amount: invoice.amount_paid,
			currency: invoice.currency,
			status: invoice.status,
			created: invoice.created,
			due_date: invoice.due_date,
			pdf_url: invoice.invoice_pdf,
			hosted_invoice_url: invoice.hosted_invoice_url,
		}));

		return NextResponse.json({
			invoices: formattedInvoices,
		});
	} catch (error) {
		console.error("Error fetching invoices:", error);
		return NextResponse.json(
			{ error: "Failed to fetch invoices" },
			{ status: 500 },
		);
	}
}
