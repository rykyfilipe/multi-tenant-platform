/** @format */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
	ChevronLeft, 
	ChevronRight, 
	X, 
	Play, 
	Database, 
	Table, 
	Users, 
	BarChart3,
	Settings,
	Rocket,
	CheckCircle,
	ArrowRight,
	Sparkles
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApp } from "@/contexts/AppContext";
import { logger } from "@/lib/error-logger";

interface TourStep {
	id: string;
	title: string;
	description: string;
	icon: React.ComponentType<any>;
	action?: {
		text: string;
		href: string;
		onClick?: () => void;
	};
	highlight?: string; // CSS selector to highlight
	position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
	onComplete?: () => void;
	onSkip?: () => void;
	userId?: string;
}

/**
 * Comprehensive Onboarding Tour Component
 * Guides new users through the platform's key features
 */
export function OnboardingTour({ onComplete, onSkip, userId }: OnboardingTourProps) {
	const { t } = useLanguage();
	const { user, tenant } = useApp();
	const [currentStep, setCurrentStep] = useState(0);
	const [isVisible, setIsVisible] = useState(false);
	const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
	const [isAnimating, setIsAnimating] = useState(false);
	const tourRef = useRef<HTMLDivElement>(null);

	const tourSteps: TourStep[] = [
		{
			id: "welcome",
			title: "Welcome to Your Multi-Tenant Platform! 🎉",
			description: "Let's take a quick tour to help you get started with managing your databases, tables, and data efficiently.",
			icon: Rocket,
			position: "bottom",
		},
		{
			id: "dashboard",
			title: "Your Dashboard",
			description: "This is your main dashboard where you can see an overview of all your databases, recent activity, and key metrics.",
			icon: BarChart3,
			highlight: "[data-tour='dashboard']",
			position: "bottom",
		},
		{
			id: "create-database",
			title: "Create Your First Database",
			description: "Start by creating a database to organize your data. Click here to create your first database.",
			icon: Database,
			highlight: "[data-tour='create-database']",
			action: {
				text: "Create Database",
				href: "/home/database/create",
			},
			position: "right",
		},
		{
			id: "database-management",
			title: "Database Management",
			description: "Here you can view, edit, and manage all your databases. Each database can contain multiple tables.",
			icon: Database,
			highlight: "[data-tour='database-list']",
			position: "left",
		},
		{
			id: "create-table",
			title: "Create Tables",
			description: "Tables are where you store your actual data. Define columns with different data types to structure your information.",
			icon: Table,
			highlight: "[data-tour='create-table']",
			action: {
				text: "Create Table",
				href: "/home/database/table/create",
			},
			position: "top",
		},
		{
			id: "data-management",
			title: "Manage Your Data",
			description: "Add, edit, and organize your data rows. You can import data from CSV files or add entries manually.",
			icon: Table,
			highlight: "[data-tour='data-rows']",
			position: "bottom",
		},
		{
			id: "user-management",
			title: "Team Collaboration",
			description: "Invite team members and manage their permissions. Collaborate on your databases with different access levels.",
			icon: Users,
			highlight: "[data-tour='user-management']",
			action: {
				text: "Manage Users",
				href: "/home/users",
			},
			position: "left",
		},
		{
			id: "analytics",
			title: "Analytics & Insights",
			description: "Track your data usage, view analytics, and monitor your platform's performance with detailed reports.",
			icon: BarChart3,
			highlight: "[data-tour='analytics']",
			action: {
				text: "View Analytics",
				href: "/home/analytics",
			},
			position: "right",
		},
		{
			id: "settings",
			title: "Customize Your Experience",
			description: "Configure your account settings, preferences, and platform customization options.",
			icon: Settings,
			highlight: "[data-tour='settings']",
			action: {
				text: "Open Settings",
				href: "/home/settings",
			},
			position: "top",
		},
		{
			id: "complete",
			title: "You're All Set! 🚀",
			description: "Congratulations! You've completed the tour. You now know the basics of using the platform. Start creating your first database and explore all the features.",
			icon: CheckCircle,
			position: "bottom",
		},
	];

	useEffect(() => {
		// Check if user has completed onboarding
		const hasCompletedTour = localStorage.getItem(`onboarding_completed_${userId || user?.id}`);
		if (!hasCompletedTour) {
			setIsVisible(true);
		}
	}, [userId, user?.id]);

	useEffect(() => {
		// Load completed steps
		const savedSteps = localStorage.getItem(`onboarding_steps_${userId || user?.id}`);
		if (savedSteps) {
			try {
				setCompletedSteps(new Set(JSON.parse(savedSteps)));
			} catch (err) {
				logger.warn("Failed to load onboarding progress", {
					component: "OnboardingTour",
					error: err,
				});
			}
		}
	}, [userId, user?.id]);

	useEffect(() => {
		// Highlight current step element
		const currentStepData = tourSteps[currentStep];
		if (currentStepData?.highlight) {
			const element = document.querySelector(currentStepData.highlight);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
	}, [currentStep]);

	const nextStep = () => {
		if (currentStep < tourSteps.length - 1) {
			setIsAnimating(true);
			setTimeout(() => {
				setCurrentStep(prev => prev + 1);
				setIsAnimating(false);
			}, 200);
		} else {
			completeTour();
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setIsAnimating(true);
			setTimeout(() => {
				setCurrentStep(prev => prev - 1);
				setIsAnimating(false);
			}, 200);
		}
	};

	const completeTour = () => {
		const userIdKey = userId || user?.id;
		if (userIdKey) {
			localStorage.setItem(`onboarding_completed_${userIdKey}`, "true");
			localStorage.setItem(`onboarding_completed_date_${userIdKey}`, new Date().toISOString());
		}

		logger.info("Onboarding tour completed", {
			component: "OnboardingTour",
			userId: userIdKey,
			completedSteps: Array.from(completedSteps),
		});

		setIsVisible(false);
		onComplete?.();
	};

	const skipTour = () => {
		const userIdKey = userId || user?.id;
		if (userIdKey) {
			localStorage.setItem(`onboarding_skipped_${userIdKey}`, "true");
			localStorage.setItem(`onboarding_skipped_date_${userIdKey}`, new Date().toISOString());
		}

		logger.info("Onboarding tour skipped", {
			component: "OnboardingTour",
			userId: userIdKey,
		});

		setIsVisible(false);
		onSkip?.();
	};

	const markStepCompleted = (stepId: string) => {
		const newCompleted = new Set(completedSteps);
		newCompleted.add(stepId);
		setCompletedSteps(newCompleted);

		const userIdKey = userId || user?.id;
		if (userIdKey) {
			localStorage.setItem(`onboarding_steps_${userIdKey}`, JSON.stringify(Array.from(newCompleted)));
		}
	};

	if (!isVisible) return null;

	const currentStepData = tourSteps[currentStep];
	const progress = ((currentStep + 1) / tourSteps.length) * 100;
	const isLastStep = currentStep === tourSteps.length - 1;

	return (
		<>
			{/* Overlay */}
			<div className="fixed inset-0 bg-black/50 z-40" />
			
			{/* Tour Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<Card 
					ref={tourRef}
					className={`w-full max-w-md transition-all duration-300 ${
						isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
					}`}
				>
					<CardHeader className="relative">
						{/* Progress Bar */}
						<div className="mb-4">
							<div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
								<span>Step {currentStep + 1} of {tourSteps.length}</span>
								<span>{Math.round(progress)}% Complete</span>
							</div>
							<Progress value={progress} className="h-2" />
						</div>

						{/* Close Button */}
						<Button
							variant="ghost"
							size="sm"
							onClick={skipTour}
							className="absolute top-4 right-4 h-8 w-8 p-0"
						>
							<X className="h-4 w-4" />
						</Button>

						{/* Step Icon and Title */}
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 bg-primary/10 rounded-lg">
								<currentStepData.icon className="h-6 w-6 text-primary" />
							</div>
							<CardTitle className="text-xl">{currentStepData.title}</CardTitle>
						</div>

						<CardDescription className="text-base">
							{currentStepData.description}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						{/* Action Button */}
						{currentStepData.action && (
							<Button 
								className="w-full" 
								onClick={() => {
									markStepCompleted(currentStepData.id);
									if (currentStepData.action?.onClick) {
										currentStepData.action.onClick();
									}
									nextStep();
								}}
							>
								<Play className="h-4 w-4 mr-2" />
								{currentStepData.action.text}
								<ArrowRight className="h-4 w-4 ml-2" />
							</Button>
						)}

						{/* Navigation */}
						<div className="flex items-center justify-between">
							<Button
								variant="outline"
								onClick={prevStep}
								disabled={currentStep === 0}
								className="flex items-center gap-2"
							>
								<ChevronLeft className="h-4 w-4" />
								Previous
							</Button>

							<div className="flex items-center gap-2">
								<Button variant="ghost" onClick={skipTour} className="text-muted-foreground">
									Skip Tour
								</Button>
								
								<Button 
									onClick={isLastStep ? completeTour : nextStep}
									className="flex items-center gap-2"
								>
									{isLastStep ? (
										<>
											<CheckCircle className="h-4 w-4" />
											Complete
										</>
									) : (
										<>
											Next
											<ChevronRight className="h-4 w-4" />
										</>
									)}
								</Button>
							</div>
						</div>

						{/* Step Indicators */}
						<div className="flex justify-center gap-2 pt-2">
							{tourSteps.map((_, index) => (
								<div
									key={index}
									className={`h-2 w-2 rounded-full transition-colors ${
										index === currentStep
											? "bg-primary"
											: index < currentStep
											? "bg-primary/50"
											: "bg-muted"
									}`}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Highlight Overlay for Current Step */}
			{currentStepData.highlight && (
				<div className="fixed inset-0 z-30 pointer-events-none">
					{/* This would be implemented with a proper highlighting system */}
				</div>
			)}
		</>
	);
}

/**
 * Hook to check if user has completed onboarding
 */
export function useOnboardingStatus(userId?: string) {
	const { user } = useApp();
	const [hasCompleted, setHasCompleted] = useState<boolean | null>(null);
	const [hasSkipped, setHasSkipped] = useState<boolean | null>(null);

	useEffect(() => {
		const userIdKey = userId || user?.id;
		if (userIdKey) {
			const completed = localStorage.getItem(`onboarding_completed_${userIdKey}`) === "true";
			const skipped = localStorage.getItem(`onboarding_skipped_${userIdKey}`) === "true";
			
			setHasCompleted(completed);
			setHasSkipped(skipped);
		}
	}, [userId, user?.id]);

	const resetOnboarding = () => {
		const userIdKey = userId || user?.id;
		if (userIdKey) {
			localStorage.removeItem(`onboarding_completed_${userIdKey}`);
			localStorage.removeItem(`onboarding_skipped_${userIdKey}`);
			localStorage.removeItem(`onboarding_steps_${userIdKey}`);
			setHasCompleted(false);
			setHasSkipped(false);
		}
	};

	return {
		hasCompleted,
		hasSkipped,
		needsOnboarding: !hasCompleted && !hasSkipped,
		resetOnboarding,
	};
}
