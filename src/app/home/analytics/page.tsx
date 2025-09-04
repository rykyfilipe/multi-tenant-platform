/** @format */

"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";

import { useLanguage } from "@/contexts/LanguageContext";
import TourProv from "@/contexts/TourProvider";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { FreeAnalyticsDashboard } from "@/components/analytics/FreeAnalyticsDashboard";
import { useApp } from "@/contexts/AppContext";
import { TourManager } from "@/components/tours/TourManager";
import { allTours } from "@/tours";

// Main Analytics Page Component

function AnalyticsPage() {
	const { data: session } = useSession();
	const { t } = useLanguage();
	const { tenant, user } = useApp();

	if (!session) return null;

	// Show appropriate dashboard based on subscription plan
	const isFreePlan = !session?.subscription?.status || session?.subscription?.status === "canceled";
	const DashboardComponent = isFreePlan ? FreeAnalyticsDashboard : AnalyticsDashboard;

	return (
		<PerformanceOptimizer preloadFonts={true} preloadCriticalCSS={true}>
			<DashboardComponent />
			<TourManager
				tours={allTours}
				currentPage="analytics"
				userRole={user?.role}
				enabledFeatures={tenant?.enabledModules || []}
				onTourComplete={(tourId) => {
					console.log(`Tour ${tourId} completed`);
				}}
				onTourSkip={(tourId) => {
					console.log(`Tour ${tourId} skipped`);
				}}
			/>
		</PerformanceOptimizer>
	);
}

export default AnalyticsPage;
