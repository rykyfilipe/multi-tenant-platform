/** @format */

"use client";

import React from "react";
import { useSession } from "next-auth/react";

import { useLanguage } from "@/contexts/LanguageContext";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
import { SimplifiedAnalyticsDashboard } from "@/components/analytics/SimplifiedAnalyticsDashboard";
import { useApp } from "@/contexts/AppContext";
import { TourManager } from "@/components/tours/TourManager";
import { allTours } from "@/tours";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Main Analytics Page Component

function AnalyticsPage() {
	const { data: session } = useSession();
	const { t } = useLanguage();
	const { tenant, user } = useApp();

	if (!session) return null;

	return (
		<PerformanceOptimizer preloadFonts={true} preloadCriticalCSS={true}>
			<ErrorBoundary component="AnalyticsPage">
				<SimplifiedAnalyticsDashboard />
			</ErrorBoundary>
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
