/** @format */

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { logger } from "@/lib/error-logger";

interface HelpContext {
	id: string;
	title: string;
	description: string;
	articleId?: string;
	action?: {
		text: string;
		href?: string;
		onClick?: () => void;
	};
	priority: "low" | "medium" | "high";
	conditions?: {
		userRole?: string[];
		planType?: string[];
		hasData?: boolean;
		firstTime?: boolean;
	};
}

/**
 * Hook for providing contextual help based on user context
 */
export function useContextualHelp() {
	const { user, tenant } = useApp();
	const [activeHelp, setActiveHelp] = useState<HelpContext | null>(null);
	const [helpHistory, setHelpHistory] = useState<string[]>([]);
	const [dismissedHelp, setDismissedHelp] = useState<Set<string>>(new Set());

	// Load user preferences
	useEffect(() => {
		if (user?.id) {
			loadHelpPreferences();
		}
	}, [user?.id]);

	const loadHelpPreferences = () => {
		if (!user?.id) return;

		try {
			const dismissed = localStorage.getItem(`help_dismissed_${user.id}`);
			if (dismissed) {
				setDismissedHelp(new Set(JSON.parse(dismissed)));
			}

			const history = localStorage.getItem(`help_history_${user.id}`);
			if (history) {
				setHelpHistory(JSON.parse(history));
			}
		} catch (error) {
			logger.error("Failed to load help preferences", error as Error, {
				component: "useContextualHelp",
				userId: user.id,
			});
		}
	};

	const saveHelpPreferences = useCallback(() => {
		if (!user?.id) return;

		try {
			localStorage.setItem(`help_dismissed_${user.id}`, JSON.stringify(Array.from(dismissedHelp)));
			localStorage.setItem(`help_history_${user.id}`, JSON.stringify(helpHistory));
		} catch (error) {
			logger.error("Failed to save help preferences", error as Error, {
				component: "useContextualHelp",
				userId: user.id,
			});
		}
	}, [user?.id, dismissedHelp, helpHistory]);

	// Save preferences when they change
	useEffect(() => {
		saveHelpPreferences();
	}, [saveHelpPreferences]);

	// Check if help context should be shown
	const shouldShowHelp = useCallback((context: HelpContext): boolean => {
		// Don't show if already dismissed
		if (dismissedHelp.has(context.id)) {
			return false;
		}

		// Don't show if already shown recently
		if (helpHistory.includes(context.id)) {
			return false;
		}

		// Check conditions
		if (context.conditions) {
			const { userRole, planType, hasData, firstTime } = context.conditions;

			// Check user role
			if (userRole && user?.role && !userRole.includes(user.role)) {
				return false;
			}

			// Check plan type
			if (planType && tenant?.plan && !planType.includes(tenant.plan)) {
				return false;
			}

			// Check if user has data
			if (hasData !== undefined) {
				// This would need to be implemented based on your data structure
				// For now, we'll assume it's true if user has a tenant
				const userHasData = !!tenant;
				if (hasData !== userHasData) {
					return false;
				}
			}

			// Check if it's first time
			if (firstTime !== undefined) {
				const isFirstTime = !helpHistory.length;
				if (firstTime !== isFirstTime) {
					return false;
				}
			}
		}

		return true;
	}, [dismissedHelp, helpHistory, user, tenant]);

	// Show contextual help
	const showHelp = useCallback((context: HelpContext) => {
		if (shouldShowHelp(context)) {
			setActiveHelp(context);
			
			// Add to history
			setHelpHistory(prev => [context.id, ...prev.slice(0, 9)]); // Keep last 10
			
			// Log help display
			logger.info("Contextual help displayed", {
				component: "useContextualHelp",
				userId: user?.id,
				helpId: context.id,
				priority: context.priority,
			});
		}
	}, [shouldShowHelp, user?.id]);

	// Hide help
	const hideHelp = useCallback(() => {
		setActiveHelp(null);
	}, []);

	// Dismiss help permanently
	const dismissHelp = useCallback((helpId: string) => {
		setDismissedHelp(prev => new Set([...prev, helpId]));
		setActiveHelp(null);
		
		logger.info("Contextual help dismissed", {
			component: "useContextualHelp",
			userId: user?.id,
			helpId,
		});
	}, [user?.id]);

	// Auto-show help based on user actions
	const trackUserAction = useCallback((action: string, context?: any) => {
		// Define help contexts for different actions
		const helpContexts: Record<string, HelpContext> = {
			"first-database-created": {
				id: "first-database-created",
				title: "Great! You created your first database 🎉",
				description: "Now let's add some tables to organize your data. Tables are where you'll store your actual information.",
				articleId: "getting-started-1",
				action: {
					text: "Create Your First Table",
					href: "/home/database/table/create",
				},
				priority: "high",
				conditions: {
					firstTime: true,
				},
			},
			"first-table-created": {
				id: "first-table-created",
				title: "Table created successfully! 📊",
				description: "Now you can start adding data to your table. You can import from CSV or add entries manually.",
				articleId: "database-1",
				action: {
					text: "Add Your First Row",
					onClick: () => {
						// This would trigger the add row modal
						const addRowButton = document.querySelector('[data-tour="add-row"]') as HTMLElement;
						addRowButton?.click();
					},
				},
				priority: "high",
				conditions: {
					firstTime: true,
				},
			},
			"approaching-limits": {
				id: "approaching-limits",
				title: "You're approaching your plan limits ⚠️",
				description: "Consider upgrading your plan to unlock more features and higher limits.",
				articleId: "billing-1",
				action: {
					text: "View Plans",
					href: "/pricing",
				},
				priority: "medium",
				conditions: {
					planType: ["Free"],
				},
			},
			"team-invitation": {
				id: "team-invitation",
				title: "Ready to collaborate? 👥",
				description: "Invite team members to work together on your databases. Set different permission levels for each user.",
				articleId: "collaboration-1",
				action: {
					text: "Invite Team Members",
					href: "/home/users",
				},
				priority: "medium",
				conditions: {
					hasData: true,
				},
			},
			"data-import": {
				id: "data-import",
				title: "Import your data quickly 📥",
				description: "Save time by importing your existing data from CSV files. We support various formats and can help with data mapping.",
				articleId: "import-1",
				action: {
					text: "Learn About Import",
					onClick: () => {
						// This would open the help system
						const helpButton = document.querySelector('[data-tour="help"]') as HTMLElement;
						helpButton?.click();
					},
				},
				priority: "low",
			},
		};

		const helpContext = helpContexts[action];
		if (helpContext) {
			showHelp(helpContext);
		}
	}, [showHelp]);

	// Predefined help contexts for common scenarios
	const helpContexts = {
		firstDatabase: {
			id: "first-database",
			title: "Create Your First Database",
			description: "Start by creating a database to organize your data. This will be your main container for related tables.",
			articleId: "getting-started-1",
			action: {
				text: "Create Database",
				href: "/home/database/create",
			},
			priority: "high" as const,
			conditions: {
				firstTime: true,
			},
		},
		firstTable: {
			id: "first-table",
			title: "Add Your First Table",
			description: "Tables store your actual data. Define columns with different types to structure your information properly.",
			articleId: "database-1",
			action: {
				text: "Create Table",
				href: "/home/database/table/create",
			},
			priority: "high" as const,
			conditions: {
				hasData: true,
				firstTime: true,
			},
		},
		teamCollaboration: {
			id: "team-collaboration",
			title: "Invite Your Team",
			description: "Collaborate with your team by inviting users and setting appropriate permissions for each member.",
			articleId: "collaboration-1",
			action: {
				text: "Invite Users",
				href: "/home/users",
			},
			priority: "medium" as const,
			conditions: {
				hasData: true,
			},
		},
		upgradePlan: {
			id: "upgrade-plan",
			title: "Upgrade Your Plan",
			description: "You're approaching your plan limits. Consider upgrading to unlock more features and higher limits.",
			articleId: "billing-1",
			action: {
				text: "View Plans",
				href: "/pricing",
			},
			priority: "medium" as const,
			conditions: {
				planType: ["Free"],
			},
		},
	};

	return {
		activeHelp,
		showHelp,
		hideHelp,
		dismissHelp,
		trackUserAction,
		helpContexts,
		helpHistory,
		dismissedHelp,
	};
}
