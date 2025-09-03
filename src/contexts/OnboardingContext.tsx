/** @format */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useApp } from "./AppContext";
import { logger } from "@/lib/error-logger";

interface OnboardingContextType {
	// Tour state
	isTourVisible: boolean;
	currentStep: number;
	totalSteps: number;
	completedSteps: Set<string>;
	
	// Actions
	startTour: () => void;
	completeTour: () => void;
	skipTour: () => void;
	nextStep: () => void;
	prevStep: () => void;
	markStepCompleted: (stepId: string) => void;
	
	// Tooltip state
	activeTooltip: string | null;
	showTooltip: (tooltipId: string) => void;
	hideTooltip: () => void;
	
	// Progress tracking
	onboardingProgress: number;
	hasCompletedOnboarding: boolean;
	hasSkippedOnboarding: boolean;
	
	// Contextual help
	showContextualHelp: (context: string) => void;
	hideContextualHelp: () => void;
	
	// Reset functionality
	resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
	children: ReactNode;
}

/**
 * Onboarding Context Provider
 * Manages the global state of user onboarding and contextual help
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
	const { user } = useApp();
	
	// Tour state
	const [isTourVisible, setIsTourVisible] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
	
	// Tooltip state
	const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
	
	// Progress tracking
	const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
	const [hasSkippedOnboarding, setHasSkippedOnboarding] = useState(false);
	
	// Contextual help
	const [contextualHelpVisible, setContextualHelpVisible] = useState(false);
	const [currentContext, setCurrentContext] = useState<string | null>(null);

	const totalSteps = 10; // Based on OnboardingTour component
	const onboardingProgress = hasCompletedOnboarding ? 100 : (completedSteps.size / totalSteps) * 100;

	// Load onboarding state on mount
	useEffect(() => {
		if (user?.id) {
			loadOnboardingState();
		}
	}, [user?.id]);

	const loadOnboardingState = () => {
		if (!user?.id) return;

		try {
			// Load completion status
			const completed = localStorage.getItem(`onboarding_completed_${user.id}`) === "true";
			const skipped = localStorage.getItem(`onboarding_skipped_${user.id}`) === "true";
			
			setHasCompletedOnboarding(completed);
			setHasSkippedOnboarding(skipped);

			// Load completed steps
			const savedSteps = localStorage.getItem(`onboarding_steps_${user.id}`);
			if (savedSteps) {
				setCompletedSteps(new Set(JSON.parse(savedSteps)));
			}

			// Auto-start tour for new users
			if (!completed && !skipped) {
				// Check if user is new (created within last 24 hours)
				const userCreatedAt = new Date(user.createdAt);
				const isNewUser = Date.now() - userCreatedAt.getTime() < 24 * 60 * 60 * 1000;
				
				if (isNewUser) {
					// Delay tour start to allow page to load
					setTimeout(() => {
						setIsTourVisible(true);
					}, 2000);
				}
			}
		} catch (error) {
			logger.error("Failed to load onboarding state", error as Error, {
				component: "OnboardingProvider",
				userId: user.id,
			});
		}
	};

	const saveOnboardingState = (updates: Partial<{
		completed: boolean;
		skipped: boolean;
		steps: string[];
	}>) => {
		if (!user?.id) return;

		try {
			if (updates.completed !== undefined) {
				localStorage.setItem(`onboarding_completed_${user.id}`, updates.completed.toString());
				if (updates.completed) {
					localStorage.setItem(`onboarding_completed_date_${user.id}`, new Date().toISOString());
				}
			}

			if (updates.skipped !== undefined) {
				localStorage.setItem(`onboarding_skipped_${user.id}`, updates.skipped.toString());
				if (updates.skipped) {
					localStorage.setItem(`onboarding_skipped_date_${user.id}`, new Date().toISOString());
				}
			}

			if (updates.steps) {
				localStorage.setItem(`onboarding_steps_${user.id}`, JSON.stringify(updates.steps));
			}
		} catch (error) {
			logger.error("Failed to save onboarding state", error as Error, {
				component: "OnboardingProvider",
				userId: user.id,
			});
		}
	};

	const startTour = () => {
		setIsTourVisible(true);
		setCurrentStep(0);
		
		logger.info("Onboarding tour started", {
			component: "OnboardingProvider",
			userId: user?.id,
		});
	};

	const completeTour = () => {
		setIsTourVisible(false);
		setHasCompletedOnboarding(true);
		setHasSkippedOnboarding(false);
		
		saveOnboardingState({ completed: true, skipped: false });
		
		logger.info("Onboarding tour completed", {
			component: "OnboardingProvider",
			userId: user?.id,
			completedSteps: Array.from(completedSteps),
		});
	};

	const skipTour = () => {
		setIsTourVisible(false);
		setHasCompletedOnboarding(false);
		setHasSkippedOnboarding(true);
		
		saveOnboardingState({ completed: false, skipped: true });
		
		logger.info("Onboarding tour skipped", {
			component: "OnboardingProvider",
			userId: user?.id,
		});
	};

	const nextStep = () => {
		if (currentStep < totalSteps - 1) {
			setCurrentStep(prev => prev + 1);
		} else {
			completeTour();
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(prev => prev - 1);
		}
	};

	const markStepCompleted = (stepId: string) => {
		const newCompleted = new Set(completedSteps);
		newCompleted.add(stepId);
		setCompletedSteps(newCompleted);
		
		saveOnboardingState({ steps: Array.from(newCompleted) });
		
		logger.info("Onboarding step completed", {
			component: "OnboardingProvider",
			userId: user?.id,
			stepId,
		});
	};

	const showTooltip = (tooltipId: string) => {
		setActiveTooltip(tooltipId);
		
		logger.info("Contextual tooltip shown", {
			component: "OnboardingProvider",
			userId: user?.id,
			tooltipId,
		});
	};

	const hideTooltip = () => {
		setActiveTooltip(null);
	};

	const showContextualHelp = (context: string) => {
		setCurrentContext(context);
		setContextualHelpVisible(true);
		
		logger.info("Contextual help shown", {
			component: "OnboardingProvider",
			userId: user?.id,
			context,
		});
	};

	const hideContextualHelp = () => {
		setContextualHelpVisible(false);
		setCurrentContext(null);
	};

	const resetOnboarding = () => {
		if (!user?.id) return;

		// Clear localStorage
		localStorage.removeItem(`onboarding_completed_${user.id}`);
		localStorage.removeItem(`onboarding_skipped_${user.id}`);
		localStorage.removeItem(`onboarding_steps_${user.id}`);
		localStorage.removeItem(`onboarding_completed_date_${user.id}`);
		localStorage.removeItem(`onboarding_skipped_date_${user.id}`);

		// Reset state
		setIsTourVisible(false);
		setCurrentStep(0);
		setCompletedSteps(new Set());
		setActiveTooltip(null);
		setHasCompletedOnboarding(false);
		setHasSkippedOnboarding(false);
		setContextualHelpVisible(false);
		setCurrentContext(null);

		logger.info("Onboarding reset", {
			component: "OnboardingProvider",
			userId: user.id,
		});
	};

	// Auto-show contextual help based on user actions
	useEffect(() => {
		if (!user?.id || hasCompletedOnboarding) return;

		// Show help for first-time actions
		const handleFirstAction = (action: string) => {
			if (!completedSteps.has(action)) {
				showContextualHelp(action);
			}
		};

		// Listen for specific user actions
		const handleDatabaseCreate = () => handleFirstAction("create-database");
		const handleTableCreate = () => handleFirstAction("create-table");
		const handleDataImport = () => handleFirstAction("import-data");

		// Add event listeners for first-time actions
		document.addEventListener("database-created", handleDatabaseCreate);
		document.addEventListener("table-created", handleTableCreate);
		document.addEventListener("data-imported", handleDataImport);

		return () => {
			document.removeEventListener("database-created", handleDatabaseCreate);
			document.removeEventListener("table-created", handleTableCreate);
			document.removeEventListener("data-imported", handleDataImport);
		};
	}, [user?.id, hasCompletedOnboarding, completedSteps]);

	const value: OnboardingContextType = {
		// Tour state
		isTourVisible,
		currentStep,
		totalSteps,
		completedSteps,
		
		// Actions
		startTour,
		completeTour,
		skipTour,
		nextStep,
		prevStep,
		markStepCompleted,
		
		// Tooltip state
		activeTooltip,
		showTooltip,
		hideTooltip,
		
		// Progress tracking
		onboardingProgress,
		hasCompletedOnboarding,
		hasSkippedOnboarding,
		
		// Contextual help
		showContextualHelp,
		hideContextualHelp,
		
		// Reset functionality
		resetOnboarding,
	};

	return (
		<OnboardingContext.Provider value={value}>
			{children}
		</OnboardingContext.Provider>
	);
}

/**
 * Hook to use onboarding context
 */
export function useOnboarding() {
	const context = useContext(OnboardingContext);
	if (context === undefined) {
		throw new Error("useOnboarding must be used within an OnboardingProvider");
	}
	return context;
}
