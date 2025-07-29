/** @format */

import { StepType, TourProvider } from "@reactour/tour";

interface TourProviderProps {
	children: React.ReactNode;
	steps: StepType[];
}

export default function TourProv({ children, steps }: TourProviderProps) {
	return (
		<TourProvider
			steps={steps}
			defaultOpen={false}
			styles={{
				popover: (base) => ({
					...base,
					"--reactour-accent": "#3b82f6", // Blue accent color
					borderRadius: "12px",
					padding: "20px",
					maxWidth: "400px",
				}),
				maskArea: (base) => ({
					...base,
					rx: 8,
				}),
				badge: (base) => ({
					...base,
					left: "auto",
					right: "-0.8125em",
					backgroundColor: "#3b82f6",
				}),
				controls: (base) => ({
					...base,
					marginTop: "16px",
				}),
				navigation: (base) => ({
					...base,
					borderRadius: "8px",
					padding: "8px 16px",
					fontWeight: "500",
				}),
			}}
			onClickMask={({ setCurrentStep, currentStep, steps, setIsOpen }) => {
				if (steps) {
					if (currentStep === steps.length - 1) {
						setIsOpen(false);
					} else {
						setCurrentStep((s) => s + 1);
					}
				}
			}}
			scrollSmooth
			showBadge
			showCloseButton
			showNavigation
			showDots
			disableDotsNavigation={false}
			disableInteraction={true}
			nextButton={({ Button, currentStep, stepsLength, ...props }) => (
				<Button {...props}>
					{currentStep === stepsLength - 1 ? "Finish" : "Next"}
				</Button>
			)}
			prevButton={({ Button, ...props }) => (
				<Button {...props}>Previous</Button>
			)}>
			{children}
		</TourProvider>
	);
}
