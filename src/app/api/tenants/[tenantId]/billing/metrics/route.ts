/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-07-30.basil",
});

export async function GET(
	request: NextRequest,
	{ params }: { params: { tenantId: string } }
) {
	try {
		const sessionResult = await requireAuthResponse();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const userId = getUserId(sessionResult);

		const tenantId = parseInt(params.tenantId);
		if (isNaN(tenantId)) {
			return NextResponse.json(
				{ error: "Invalid tenant ID" },
				{ status: 400 }
			);
		}

		// Check user access to tenant
		const hasAccess = requireTenantAccess(sessionResult, tenantId.toString());
		if (!hasAccess) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		// Get tenant admin user to access Stripe data
		const adminUser = await prisma.user.findFirst({
			where: { 
				tenantId,
				role: "ADMIN"
			},
			select: {
				stripeCustomerId: true,
				subscriptionStatus: true,
				subscriptionPlan: true,
			}
		});

		if (!adminUser) {
			return NextResponse.json(
				{ error: "Tenant admin not found" },
				{ status: 404 }
			);
		}

		// Initialize default metrics
		let billingMetrics = {
			totalSpent: 0,
			monthlyRecurringRevenue: 0,
			averageInvoiceValue: 0,
			paymentSuccessRate: 100,
			churnRate: 0,
		};

		// If user has Stripe customer ID, fetch real billing data
		if (adminUser.stripeCustomerId) {
			try {
				// Get invoices from Stripe
				const invoices = await stripe.invoices.list({
					customer: adminUser.stripeCustomerId,
					limit: 100,
					status: "paid",
				});

				// Calculate metrics
				const totalSpent = invoices.data.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0);
				const averageInvoiceValue = invoices.data.length > 0 ? totalSpent / invoices.data.length : 0;
				
				// Calculate monthly recurring revenue based on current plan
				const monthlyRecurringRevenue = getMonthlyRecurringRevenue(adminUser.subscriptionPlan);
				
				// Calculate payment success rate (simplified)
				const allInvoices = await stripe.invoices.list({
					customer: adminUser.stripeCustomerId,
					limit: 100,
				});
				const paidInvoices = allInvoices.data.filter(invoice => invoice.status === "paid");
				const paymentSuccessRate = allInvoices.data.length > 0 ? 
					(paidInvoices.length / allInvoices.data.length) * 100 : 100;

				billingMetrics = {
					totalSpent: totalSpent / 100, // Convert from cents
					monthlyRecurringRevenue: monthlyRecurringRevenue,
					averageInvoiceValue: averageInvoiceValue / 100, // Convert from cents
					paymentSuccessRate: Math.round(paymentSuccessRate * 10) / 10,
					churnRate: 0, // Would need historical data to calculate
				};
			} catch (stripeError) {
				console.error("Error fetching Stripe data:", stripeError);
				// Return default metrics if Stripe fails
			}
		}

		return NextResponse.json(billingMetrics);
	} catch (error) {
		console.error("Error fetching billing metrics:", error);
		return NextResponse.json(
			{ error: "Failed to fetch billing metrics" },
			{ status: 500 }
		);
	}
}

function getMonthlyRecurringRevenue(plan: string | null): number {
	const planPrices: Record<string, number> = {
		Free: 0,
		Starter: 9,
		Pro: 29,
		Enterprise: 99,
	};
	
	return planPrices[plan || "Free"] || 0;
}
