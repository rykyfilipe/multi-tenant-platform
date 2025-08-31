/** @format */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useApp } from "@/contexts/AppContext";
import { PLAN_LIMITS } from "@/lib/planConstants";
import type { PlanLimits } from "@/lib/planConstants";

interface CurrentCounts {
	databases: number;
	tables: number;
	users: number;
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
	const { token } = useApp();
	const [currentCounts, setCurrentCounts] = useState<CurrentCounts | null>(
		null,
	);
	const [loading, setLoading] = useState(true);

	const currentPlan = session?.subscription?.plan || "Free";

	const planLimits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.Free;

	const fetchCounts = useCallback(async () => {
		if (!session?.user?.id || !token) {
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/user/limits", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setCurrentCounts(data);
			} else {
				console.error("Failed to fetch limits:", response.status);
				// Set default counts on error
				setCurrentCounts({
					databases: 0,
					tables: 0,
					users: 0,
					storage: 0,
					rows: 0,
				});
			}
		} catch (error) {
			console.error("Error fetching limits:", error);
			// Set default counts on error
			setCurrentCounts({
				databases: 0,
				tables: 0,
				users: 0,
				storage: 0,
				rows: 0,
			});
		} finally {
			setLoading(false);
		}
	}, [session?.user?.id, token]);

	useEffect(() => {
		if (session?.user?.id && token && !currentCounts) {
			fetchCounts();
		} else if (!session?.user?.id || !token) {
			setLoading(false);
		}
	}, [session?.user?.id, token, fetchCounts, currentCounts]);

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
