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

		const { invoiceId } = await request.json();

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

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		if (!user.stripeCustomerId) {
			return NextResponse.json(
				{ error: "User has no associated customer" },
				{ status: 400 },
			);
		}

		// Fetch the invoice to verify it belongs to the user
		const invoice = await stripe.invoices.retrieve(invoiceId);

		if (invoice.customer !== user.stripeCustomerId) {
			return NextResponse.json(
				{ error: "Invoice not found or access denied" },
				{ status: 403 },
			);
		}

		if (!invoice.invoice_pdf) {
			return NextResponse.json(
				{ error: "PDF not available for this invoice" },
				{ status: 404 },
			);
		}

		// Validate PDF URL
		try {
			new URL(invoice.invoice_pdf);
		} catch (urlError) {
			return NextResponse.json({ error: "Invalid PDF URL" }, { status: 400 });
		}

		// Fetch the PDF from Stripe
		const response = await fetch(invoice.invoice_pdf);

		if (!response.ok) {
			throw new Error("Failed to fetch PDF from Stripe");
		}

		const pdfBuffer = await response.arrayBuffer();

		// Return the PDF with appropriate headers
		return new NextResponse(pdfBuffer, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
			},
		});
	} catch (error) {
		console.error("Error downloading invoice:", error);
		return NextResponse.json(
			{ error: "Failed to download invoice" },
			{ status: 500 },
		);
	}
}
