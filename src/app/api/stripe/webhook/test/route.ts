/** @format */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Test basic connectivity
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
		const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

		const status = {
			webhookSecretConfigured: !!webhookSecret,
			stripeSecretKeyConfigured: !!stripeSecretKey,
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV,
		};

		console.log("🔍 DEBUG: Webhook test endpoint called");
		console.log("🔍 DEBUG: Status:", status);

		return NextResponse.json({
			message: "Stripe webhook endpoint is accessible",
			status,
		});
	} catch (error) {
		console.error("❌ Webhook test error:", error);
		return NextResponse.json(
			{ error: "Webhook test failed", details: error },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.text();
		console.log("🔍 DEBUG: Test webhook POST received");
		console.log("🔍 DEBUG: Body length:", body.length);
		console.log("🔍 DEBUG: Body preview:", body.substring(0, 200));

		const headers = Object.fromEntries(request.headers.entries());
		console.log("🔍 DEBUG: Headers:", headers);

		return NextResponse.json({
			message: "Test webhook received successfully",
			bodyLength: body.length,
			headers: Object.keys(headers),
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("❌ Test webhook POST error:", error);
		return NextResponse.json(
			{ error: "Test webhook POST failed", details: error },
			{ status: 500 },
		);
	}
}
