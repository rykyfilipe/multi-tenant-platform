/** @format */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PLAN_LIMITS } from "@/lib/planConstants";
import type { PlanLimits } from "@/lib/planConstants";

interface CurrentCounts {
	databases: number;
	tables: number;
	users: number;
	apiTokens: number;
	publicTables: number;
	storage: number;
	rows: number;
}

interface LimitCheck {
	allowed: boolean;
	limit: number;
	current: number;
}

export function usePlanLimits() {
	const { data: session } = useSession();
	const [currentCounts, setCurrentCounts] = useState<CurrentCounts | null>(
		null,
	);
	const [loading, setLoading] = useState(true);

	const currentPlan = session?.subscription?.plan || "Starter";

	const planLimits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.Starter;

	useEffect(() => {
		async function fetchCounts() {
			try {
				const response = await fetch("/api/user/limits");
				if (response.ok) {
					const data = await response.json();
					setCurrentCounts(data);
				}
			} catch (error) {
				console.error("Error fetching limits:", error);
			} finally {
				setLoading(false);
			}
		}

		if (session?.user?.id) {
			fetchCounts();
		}
	}, [session?.user?.id]);

	const checkLimit = (limitType: keyof PlanLimits): LimitCheck => {
		const current = currentCounts?.[limitType] || 0;
		const limit = planLimits[limitType];

		return {
			allowed: current < limit,
			limit,
			current,
		};
	};

	const isAtLimit = (limitType: keyof PlanLimits): boolean => {
		const current = currentCounts?.[limitType] || 0;
		const limit = planLimits[limitType];
		return current >= limit;
	};

	const getUsagePercentage = (limitType: keyof PlanLimits): number => {
		const current = currentCounts?.[limitType] || 0;
		const limit = planLimits[limitType];
		return limit > 0 ? (current / limit) * 100 : 0;
	};

	return {
		currentPlan,
		planLimits,
		currentCounts,
		loading,
		checkLimit,
		isAtLimit,
		getUsagePercentage,
	};
}
