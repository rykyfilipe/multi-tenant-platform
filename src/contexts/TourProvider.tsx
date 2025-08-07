/** @format */

import { StepType, TourProvider } from "@reactour/tour";
import { useState, useEffect } from "react";

interface TourProviderProps {
	children: React.ReactNode;
	steps: StepType[];
	onTourComplete?: () => void;
	onTourSkip?: () => void;
}

export default function TourProv({ 
	children, 
	steps, 
	onTourComplete,
	onTourSkip 
}: TourProviderProps) {
	const [isFirstVisit, setIsFirstVisit] = useState(false);

	useEffect(() => {
		// Check if this is the user's first visit
		const hasVisited = localStorage.getItem("app-first-visit");
		if (!hasVisited) {
			setIsFirstVisit(true);
		}
	}, []);

	return (
		<TourProvider
			steps={steps}
			defaultOpen={false}
			styles={{
				popover: (base) => ({
					...base,
					"--reactour-accent": "#3b82f6",
					"--reactour-accent-hover": "#2563eb",
					borderRadius: "16px",
					padding: "24px",
					maxWidth: "450px",
					boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
					border: "1px solid rgba(59, 130, 246, 0.1)",
					background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))",
					backdropFilter: "blur(10px)",
				}),
				maskArea: (base) => ({
					...base,
					rx: 12,
					stroke: "#3b82f6",
					strokeWidth: 2,
					strokeDasharray: "5,5",
					animation: "pulse 2s infinite",
				}),
				badge: (base) => ({
					...base,
					left: "auto",
					right: "-0.8125em",
					backgroundColor: "#3b82f6",
					borderRadius: "50%",
					width: "24px",
					height: "24px",
					fontSize: "12px",
					fontWeight: "600",
					boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
				}),
				controls: (base) => ({
					...base,
					marginTop: "20px",
					gap: "12px",
				}),
				navigation: (base) => ({
					...base,
					borderRadius: "12px",
					padding: "12px 20px",
					fontWeight: "600",
					fontSize: "14px",
					transition: "all 0.2s ease",
					boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
					border: "none",
				}),
				close: (base) => ({
					...base,
					top: "16px",
					right: "16px",
					width: "32px",
					height: "32px",
					borderRadius: "50%",
					backgroundColor: "rgba(0, 0, 0, 0.1)",
					color: "#6b7280",
					transition: "all 0.2s ease",
					"&:hover": {
						backgroundColor: "rgba(0, 0, 0, 0.2)",
						color: "#374151",
					},
				}),
				dots: (base) => ({
					...base,
					marginTop: "16px",
				}),
				dot: (base, { current, disabled }) => ({
					...base,
					width: "8px",
					height: "8px",
					borderRadius: "50%",
					backgroundColor: current ? "#3b82f6" : disabled ? "#d1d5db" : "#e5e7eb",
					transition: "all 0.2s ease",
					"&:hover": {
						backgroundColor: current ? "#2563eb" : "#d1d5db",
					},
				}),
			}}
			onClickMask={({ setCurrentStep, currentStep, steps, setIsOpen }) => {
				if (steps) {
					if (currentStep === steps.length - 1) {
						setIsOpen(false);
						onTourComplete?.();
					} else {
						setCurrentStep((s) => s + 1);
					}
				}
			}}
			onClickClose={({ setIsOpen }) => {
				setIsOpen(false);
				onTourSkip?.();
			}}
			scrollSmooth
			showBadge
			showCloseButton
			showNavigation
			showDots
			disableDotsNavigation={false}
			disableInteraction={true}
			nextButton={({ Button, currentStep, stepsLength, ...props }) => (
				<Button 
					{...props}
					className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
				>
					{currentStep === stepsLength - 1 ? "Finish Tour" : "Next Step"}
				</Button>
			)}
			prevButton={({ Button, ...props }) => (
				<Button 
					{...props}
					className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
				>
					Previous
				</Button>
			)}
			onClickDot={({ setCurrentStep, currentStep, steps, setIsOpen }) => {
				if (steps && currentStep < steps.length - 1) {
					setCurrentStep(currentStep + 1);
				}
			}}
		>
			{children}
		</TourProvider>
	);
}
