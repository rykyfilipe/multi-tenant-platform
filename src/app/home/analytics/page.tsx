/** @format */

"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";

import { useLanguage } from "@/contexts/LanguageContext";
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { tourUtils } from "@/lib/tour-config";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { FreeAnalyticsDashboard } from "@/components/analytics/FreeAnalyticsDashboard";
import { useApp } from "@/contexts/AppContext";

// Main Analytics Page Component

function AnalyticsPage() {
	const { data: session } = useSession();
	const { t } = useLanguage();
	const { tenant } = useApp();
	const { setIsOpen, setCurrentStep } = useTour();

	const startTour = () => {
		setCurrentStep(0);
		setIsOpen(true);
	};

	useEffect(() => {
		const hasSeenTour = tourUtils.isTourSeen("analytics");
		if (!hasSeenTour) {
			const timer = setTimeout(() => {
				startTour();
			}, 2000);

			return () => clearTimeout(timer);
		}
	}, []);

	if (!session) return null;

	// Show appropriate dashboard based on subscription plan
	const isFreePlan = !session?.subscription?.status || session?.subscription?.status === "canceled";
	const DashboardComponent = isFreePlan ? FreeAnalyticsDashboard : AnalyticsDashboard;

	return (
		<PerformanceOptimizer preloadFonts={true} preloadCriticalCSS={true}>
			<TourProv
				steps={tourUtils.getDashboardTourSteps(true)}
				onTourComplete={() => {
					tourUtils.markTourSeen("analytics");
				}}
				onTourSkip={() => {
					tourUtils.markTourSeen("analytics");
				}}>
				<DashboardComponent />
			</TourProv>
		</PerformanceOptimizer>
	);
}

export default AnalyticsPage;
