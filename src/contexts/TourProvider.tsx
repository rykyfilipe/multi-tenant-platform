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
	onTourSkip,
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
				popover: (base: any) => ({
					...base,
					"--reactour-accent": "#3b82f6",
					"--reactour-accent-hover": "#2563eb",
					borderRadius: "16px",
					padding: "24px",
					maxWidth: "450px",
					boxShadow:
						"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
					border: "1px solid rgba(59, 130, 246, 0.1)",
					background:
						"linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))",
					backdropFilter: "blur(10px)",
				}),
				maskArea: (base: any) => ({
					...base,
					rx: 12,
					stroke: "#3b82f6",
					strokeWidth: 2,
					strokeDasharray: "5,5",
					animation: "pulse 2s infinite",
				}),
				badge: (base: any) => ({
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
				controls: (base: any) => ({
					...base,
					marginTop: "20px",
					gap: "12px",
				}),
				navigation: (base: any) => ({
					...base,
					borderRadius: "12px",
					padding: "12px 20px",
					fontWeight: "600",
					fontSize: "14px",
					transition: "all 0.2s ease",
					boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
					border: "none",
				}),
				close: (base: any) => ({
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
				dot: (
					base: any,
					state?: { current?: boolean; disabled?: boolean },
				) => ({
					...base,
					width: "8px",
					height: "8px",
					borderRadius: "50%",
					backgroundColor: state?.current
						? "#3b82f6"
						: state?.disabled
						? "#d1d5db"
						: "#e5e7eb",
					transition: "all 0.2s ease",
					"&:hover": {
						backgroundColor: state?.current ? "#2563eb" : "#d1d5db",
					},
				}),
			}}
			onClickMask={({ setCurrentStep, currentStep, steps, setIsOpen }: any) => {
				if (steps) {
					if (currentStep === steps.length - 1) {
						setIsOpen(false);
						onTourComplete?.();
					} else {
						setCurrentStep((s: number) => s + 1);
					}
				}
			}}
			onClickClose={({ setIsOpen }: any) => {
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
			nextButton={({ Button, currentStep, stepsLength, ...props }: any) => (
				<Button
					{...props}
					style={{
						backgroundColor: "#3b82f6",
						color: "white",
						fontWeight: "600",
						padding: "8px 16px",
						borderRadius: "8px",
						border: "none",
						cursor: "pointer",
						transition: "all 0.2s ease",
						boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
					}}
					onMouseEnter={(e: any) => {
						e.target.style.backgroundColor = "#2563eb";
						e.target.style.boxShadow = "0 6px 8px -1px rgba(0, 0, 0, 0.15)";
					}}
					onMouseLeave={(e: any) => {
						e.target.style.backgroundColor = "#3b82f6";
						e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
					}}>
					{currentStep === stepsLength - 1 ? "Finish Tour" : "Next Step"}
				</Button>
			)}
			prevButton={({ Button, ...props }: any) => (
				<Button
					{...props}
					style={{
						backgroundColor: "#f3f4f6",
						color: "#374151",
						fontWeight: "600",
						padding: "8px 16px",
						borderRadius: "8px",
						border: "none",
						cursor: "pointer",
						transition: "all 0.2s ease",
					}}
					onMouseEnter={(e: any) => {
						e.target.style.backgroundColor = "#e5e7eb";
					}}
					onMouseLeave={(e: any) => {
						e.target.style.backgroundColor = "#f3f4f6";
					}}>
					Previous
				</Button>
			)}>
			{children}
		</TourProvider>
	);
}
