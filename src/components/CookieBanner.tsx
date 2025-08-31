/** @format */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie, Settings } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

// Type declaration for gtag function
declare global {
	interface Window {
		gtag: (
			command: string,
			targetId: string,
			config?: Record<string, any>,
		) => void;
	}
}

export default function CookieBanner() {
	const { t } = useLanguage();
	const [showBanner, setShowBanner] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [cookies, setCookies] = useState({
		essential: true, // Always true
		analytics: false,
		preferences: false,
	});

	useEffect(() => {
		// Check if user has already made a choice
		const cookieConsent = localStorage.getItem("cookie-consent");
		if (!cookieConsent) {
			setShowBanner(true);
		}
	}, []);

	const handleAcceptAll = () => {
		const consent = {
			essential: true,
			analytics: true,
			preferences: true,
			timestamp: new Date().toISOString(),
		};
		localStorage.setItem("cookie-consent", JSON.stringify(consent));
		setShowBanner(false);
		// Trigger analytics if accepted
		if (typeof window !== "undefined" && window.gtag) {
			window.gtag("consent", "update", {
				analytics_storage: "granted",
			});
		}
	};

	const handleAcceptEssential = () => {
		const consent = {
			essential: true,
			analytics: false,
			preferences: false,
			timestamp: new Date().toISOString(),
		};
		localStorage.setItem("cookie-consent", JSON.stringify(consent));
		setShowBanner(false);
	};

	const handleSaveSettings = () => {
		const consent = {
			...cookies,
			timestamp: new Date().toISOString(),
		};
		localStorage.setItem("cookie-consent", JSON.stringify(consent));
		setShowBanner(false);
		setShowSettings(false);

		// Update analytics consent
		if (typeof window !== "undefined" && window.gtag) {
			window.gtag("consent", "update", {
				analytics_storage: cookies.analytics ? "granted" : "denied",
			});
		}
	};

	if (!showBanner) return null;

	return (
		<>
			{/* Main Cookie Banner */}
			{!showSettings && (
				<div className='fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4'>
					<div className='max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4'>
						<div className='flex items-start gap-3 flex-1'>
							<Cookie className='w-6 h-6 text-blue-600 mt-1 flex-shrink-0' />
							<div className='flex-1'>
								<h3 className='font-semibold text-gray-900 mb-1'>
									{t("cookies.title")}
								</h3>
								<p className='text-sm text-gray-600 mb-3'>
									{t("cookies.description")}{" "}
									<Link
										href='/docs/cookies'
										className='text-blue-600 hover:underline'>
										{t("cookies.learnMore")}
									</Link>
								</p>
							</div>
						</div>
						<div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setShowSettings(true)}
								className='flex items-center gap-2'>
								<Settings className='w-4 h-4' />
								{t("cookies.customize")}
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={handleAcceptEssential}>
								{t("cookies.essentialOnly")}
							</Button>
							<Button size='sm' onClick={handleAcceptAll}>
								{t("cookies.acceptAll")}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Cookie Settings Modal */}
			{showSettings && (
				<div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4'>
					<div className='bg-white rounded-lg max-w-md w-full p-6'>
						<div className='flex items-center justify-between mb-4'>
							<h3 className='text-lg font-semibold'>{t("cookies.settings")}</h3>
							<Button
								variant='ghost'
								size='sm'
								onClick={() => setShowSettings(false)}>
								<X className='w-4 h-4' />
							</Button>
						</div>

						<div className='space-y-4 mb-6'>
							<div className='flex items-center justify-between'>
								<div>
									<h4 className='font-medium'>
										{t("cookies.essential.title")}
									</h4>
									<p className='text-sm text-gray-600'>
										{t("cookies.essential.description")}
									</p>
								</div>
								<div className='bg-gray-100 px-3 py-1 rounded text-sm text-gray-600'>
									{t("cookies.essential.alwaysActive")}
								</div>
							</div>

							<div className='flex items-center justify-between'>
								<div>
									<h4 className='font-medium'>
										{t("cookies.analytics.title")}
									</h4>
									<p className='text-sm text-gray-600'>
										{t("cookies.analytics.description")}
									</p>
								</div>
								<label className='relative inline-flex items-center cursor-pointer'>
									<input
										type='checkbox'
										checked={cookies.analytics}
										onChange={(e) =>
											setCookies((prev) => ({
												...prev,
												analytics: e.target.checked,
											}))
										}
										className='sr-only peer'
									/>
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
								</label>
							</div>

							<div className='flex items-center justify-between'>
								<div>
									<h4 className='font-medium'>
										{t("cookies.preferences.title")}
									</h4>
									<p className='text-sm text-gray-600'>
										{t("cookies.preferences.description")}
									</p>
								</div>
								<label className='relative inline-flex items-center cursor-pointer'>
									<input
										type='checkbox'
										checked={cookies.preferences}
										onChange={(e) =>
											setCookies((prev) => ({
												...prev,
												preferences: e.target.checked,
											}))
										}
										className='sr-only peer'
									/>
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
								</label>
							</div>
						</div>

						<div className='flex gap-2'>
							<Button
								variant='outline'
								onClick={() => setShowSettings(false)}
								className='flex-1'>
								{t("cookies.cancel")}
							</Button>
							<Button onClick={handleSaveSettings} className='flex-1'>
								{t("cookies.saveSettings")}
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
