/** @format */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SubscriptionData {
	stripeCustomerId: string | null;
	stripeSubscriptionId: string | null;
	subscriptionStatus: string | null;
	subscriptionPlan: string | null;
	subscriptionCurrentPeriodEnd: Date | null;
}

export const useSubscription = () => {
	const { data: session, status } = useSession();
	const [subscription, setSubscription] = useState<SubscriptionData | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSubscription = async () => {
		if (!session?.user?.id) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const response = await fetch("/api/user/subscription");

			if (!response.ok) {
				throw new Error("Failed to fetch subscription");
			}

			const data = await response.json();
			setSubscription(data);
		} catch (err) {
			console.error("Error fetching subscription:", err);
			setError(
				err instanceof Error ? err.message : "Failed to fetch subscription",
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (status === "loading") return;

		if (status === "authenticated") {
			fetchSubscription();
		} else {
			setLoading(false);
			setSubscription(null);
		}
	}, [session, status]);

	const refetch = () => {
		fetchSubscription();
	};

	return {
		subscription,
		loading,
		error,
		refetch,
	};
};
