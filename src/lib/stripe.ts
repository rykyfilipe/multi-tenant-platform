/** @format */

import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe on the client side
export const getStripe = () => {
	const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
	if (!publishableKey) {
		return null;
	}
	return loadStripe(publishableKey);
};

// Create checkout session
export const createCheckoutSession = async (
	priceId: string,
	planName: string,
) => {
	try {
		const response = await fetch("/api/stripe/create-checkout-session", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				priceId,
				planName,
			}),
		});

		if (!response.ok) {
			throw new Error("Failed to create checkout session");
		}

		const { sessionId } = await response.json();
		return sessionId;
	} catch (error) {
		throw error;
	}
};

// Redirect to Stripe checkout
export const redirectToCheckout = async (priceId: string, planName: string) => {
	try {
		const sessionId = await createCheckoutSession(priceId, planName);
		const stripe = await getStripe();

		if (!stripe) {
			throw new Error(
				"Stripe failed to load - check your environment variables",
			);
		}

		const { error } = await stripe.redirectToCheckout({
			sessionId,
		});

		if (error) {
			throw error;
		}
	} catch (error) {
		throw error;
	}
};
