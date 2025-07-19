/** @format */

"use client";

import React, { useEffect, useState } from "react";
import Joyride, { Step } from "react-joyride";

interface OnboardingTourProps {
	steps: Step[];
	tourKey: string;
}

export const OnboardingTour = ({ steps, tourKey }: OnboardingTourProps) => {
	const [run, setRun] = useState(false);
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		setHasMounted(true);
		const seen = localStorage.getItem(`seen_tour_${tourKey}`) || false;
		if (!seen) {
			setTimeout(() => {
				setRun(true);
				localStorage.setItem(`seen_tour_${tourKey}`, "true");
			}, 300);
		}
	}, [tourKey]);

	if (!hasMounted) return null;

	return (
		<Joyride
			steps={steps}
			run={run}
			continuous
			showProgress
			showSkipButton
			styles={{
				options: {
					zIndex: 10000,
					primaryColor: "#6366f1",
				},
			}}
		/>
	);
};
