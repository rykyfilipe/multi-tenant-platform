/** @format */

"use client";

import React from "react";
import { useSession } from "next-auth/react";

import { useLanguage } from "@/contexts/LanguageContext";
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { useEffect } from "react";
import { tourUtils } from "@/lib/tour-config";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

// Main Analytics Page Component

function AnalyticsPage() {
	const { data: session } = useSession();
	const { t } = useLanguage();
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
				<AnalyticsDashboard />
			</TourProv>
		</PerformanceOptimizer>
	);
}

export default AnalyticsPage;
