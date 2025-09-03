/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
	Shield, 
	Settings, 
	CheckCircle, 
	XCircle,
	Info,
	ExternalLink
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { logger } from "@/lib/error-logger";

interface CookiePreferences {
	necessary: boolean;
	analytics: boolean;
	marketing: boolean;
	functional: boolean;
}

interface CookieConsentManagerProps {
	onPreferencesChange?: (preferences: CookiePreferences) => void;
	showDetails?: boolean;
}

/**
 * GDPR Compliant Cookie Consent Manager
 * Handles cookie preferences and consent management
 */
export function CookieConsentManager({ 
	onPreferencesChange, 
	showDetails = false 
}: CookieConsentManagerProps) {
	const { t } = useLanguage();
	const [preferences, setPreferences] = useState<CookiePreferences>({
		necessary: true, // Always required
		analytics: false,
		marketing: false,
		functional: false,
	});
	const [showManager, setShowManager] = useState(false);
	const [hasConsent, setHasConsent] = useState(false);

	useEffect(() => {
		// Load saved preferences
		const savedPreferences = localStorage.getItem("cookie_preferences");
		const savedConsent = localStorage.getItem("cookie_consent");
		
		if (savedPreferences) {
			try {
				const parsed = JSON.parse(savedPreferences);
				setPreferences(parsed);
				setHasConsent(true);
			} catch (err) {
				logger.error("Failed to parse saved cookie preferences", err as Error, {
					component: "CookieConsentManager",
				});
			}
		}

		if (savedConsent === "true") {
			setHasConsent(true);
		}
	}, []);

	const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
		const newPreferences = { ...preferences, [key]: value };
		setPreferences(newPreferences);
		
		// Save to localStorage
		localStorage.setItem("cookie_preferences", JSON.stringify(newPreferences));
		
		// Apply cookie settings
		applyCookieSettings(newPreferences);
		
		// Notify parent component
		onPreferencesChange?.(newPreferences);
		
		// Log consent change
		logger.info("Cookie preferences updated", {
			component: "CookieConsentManager",
			preferences: newPreferences,
		});
	};

	const applyCookieSettings = (prefs: CookiePreferences) => {
		// Apply analytics cookies
		if (prefs.analytics) {
			// Enable Google Analytics, etc.
			window.gtag?.('consent', 'update', {
				analytics_storage: 'granted'
			});
		} else {
			// Disable analytics
			window.gtag?.('consent', 'update', {
				analytics_storage: 'denied'
			});
		}

		// Apply marketing cookies
		if (prefs.marketing) {
			// Enable marketing tracking
			window.gtag?.('consent', 'update', {
				ad_storage: 'granted'
			});
		} else {
			// Disable marketing
			window.gtag?.('consent', 'update', {
				ad_storage: 'denied'
			});
		}

		// Apply functional cookies
		if (prefs.functional) {
			// Enable functional features
			// This could include user preferences, theme settings, etc.
		}
	};

	const acceptAll = () => {
		const allAccepted = {
			necessary: true,
			analytics: true,
			marketing: true,
			functional: true,
		};
		
		setPreferences(allAccepted);
		localStorage.setItem("cookie_preferences", JSON.stringify(allAccepted));
		localStorage.setItem("cookie_consent", "true");
		setHasConsent(true);
		applyCookieSettings(allAccepted);
		onPreferencesChange?.(allAccepted);
		
		logger.info("All cookies accepted", {
			component: "CookieConsentManager",
		});
	};

	const acceptSelected = () => {
		localStorage.setItem("cookie_preferences", JSON.stringify(preferences));
		localStorage.setItem("cookie_consent", "true");
		setHasConsent(true);
		applyCookieSettings(preferences);
		onPreferencesChange?.(preferences);
		
		logger.info("Selected cookies accepted", {
			component: "CookieConsentManager",
			preferences,
		});
	};

	const rejectAll = () => {
		const minimalPreferences = {
			necessary: true,
			analytics: false,
			marketing: false,
			functional: false,
		};
		
		setPreferences(minimalPreferences);
		localStorage.setItem("cookie_preferences", JSON.stringify(minimalPreferences));
		localStorage.setItem("cookie_consent", "true");
		setHasConsent(true);
		applyCookieSettings(minimalPreferences);
		onPreferencesChange?.(minimalPreferences);
		
		logger.info("All non-essential cookies rejected", {
			component: "CookieConsentManager",
		});
	};

	const cookieCategories = [
		{
			key: "necessary" as keyof CookiePreferences,
			title: "Necessary Cookies",
			description: "Essential for the website to function properly. Cannot be disabled.",
			required: true,
			icon: Shield,
			color: "text-green-600",
		},
		{
			key: "analytics" as keyof CookiePreferences,
			title: "Analytics Cookies",
			description: "Help us understand how visitors interact with our website by collecting anonymous information.",
			required: false,
			icon: Info,
			color: "text-blue-600",
		},
		{
			key: "functional" as keyof CookiePreferences,
			title: "Functional Cookies",
			description: "Enable enhanced functionality and personalization, such as remembering your preferences.",
			required: false,
			icon: Settings,
			color: "text-purple-600",
		},
		{
			key: "marketing" as keyof CookiePreferences,
			title: "Marketing Cookies",
			description: "Used to track visitors across websites to display relevant and engaging advertisements.",
			required: false,
			icon: ExternalLink,
			color: "text-orange-600",
		},
	];

	if (!showManager && hasConsent) {
		return (
			<Button
				variant="outline"
				size="sm"
				onClick={() => setShowManager(true)}
				className="fixed bottom-4 right-4 z-50"
			>
				<Settings className="h-4 w-4 mr-2" />
				Cookie Settings
			</Button>
		);
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<CardHeader>
					<div className="flex items-center gap-3">
						<Shield className="h-6 w-6 text-primary" />
						<div>
							<CardTitle>Cookie Preferences</CardTitle>
							<CardDescription>
								We use cookies to enhance your experience and analyze our traffic.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Cookie Categories */}
					<div className="space-y-4">
						{cookieCategories.map((category) => (
							<div key={category.key} className="flex items-start justify-between p-4 border rounded-lg">
								<div className="flex items-start gap-3 flex-1">
									<category.icon className={`h-5 w-5 mt-0.5 ${category.color}`} />
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<h4 className="font-medium">{category.title}</h4>
											{category.required && (
												<Badge variant="secondary" className="text-xs">
													Required
												</Badge>
											)}
										</div>
										<p className="text-sm text-muted-foreground">
											{category.description}
										</p>
									</div>
								</div>
								<Switch
									checked={preferences[category.key]}
									onCheckedChange={(checked) => 
										!category.required && handlePreferenceChange(category.key, checked)
									}
									disabled={category.required}
									className="ml-4"
								/>
							</div>
						))}
					</div>

					{/* Privacy Policy Link */}
					<div className="text-center text-sm text-muted-foreground">
						By using our website, you agree to our{" "}
						<a 
							href="/privacy-policy" 
							className="text-primary hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							Privacy Policy
						</a>{" "}
						and{" "}
						<a 
							href="/terms-of-service" 
							className="text-primary hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							Terms of Service
						</a>
						.
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-3">
						<Button
							variant="outline"
							onClick={rejectAll}
							className="flex-1"
						>
							<XCircle className="h-4 w-4 mr-2" />
							Reject All
						</Button>
						<Button
							variant="outline"
							onClick={acceptSelected}
							className="flex-1"
						>
							<Settings className="h-4 w-4 mr-2" />
							Save Preferences
						</Button>
						<Button
							onClick={acceptAll}
							className="flex-1"
						>
							<CheckCircle className="h-4 w-4 mr-2" />
							Accept All
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
