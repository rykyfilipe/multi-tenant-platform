/** @format */

// components/OnboardingTour.tsx
"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { TourProvider } from "@reactour/tour";

interface OnboardingTourProps {
	steps: { selector: string; content: string }[];
	tourKey: string;
	children: ReactNode;
}

export const OnboardingTour = ({
	steps,
	tourKey,
	children,
}: OnboardingTourProps) => {
	const [shouldRun, setShouldRun] = useState(false);

	useEffect(() => {
		const seen = localStorage.getItem(`seen_tour_${tourKey}`);
		if (!seen) {
			setShouldRun(true);
			localStorage.setItem(`seen_tour_${tourKey}`, "true");
		}
	}, [tourKey]);

	return (
		<TourProvider
			steps={steps}
			startAt={0}
			showNavigation
			showDots
			defaultOpen={shouldRun}
			styles={{
				popover: (base) => ({ ...base, zIndex: 9999 }),
			}}>
			{children}
		</TourProvider>
	);
};
