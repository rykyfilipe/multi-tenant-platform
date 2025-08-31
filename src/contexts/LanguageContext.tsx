/** @format */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useApp } from "./AppContext";
import { Language, useTranslation } from "@/lib/i18n";

interface LanguageContextType {
	currentLanguage: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string, params?: Record<string, any>) => string;
	isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const { tenant } = useApp();
	const [currentLanguage, setCurrentLanguage] = useState<Language>("en");
	const [isLoading, setIsLoading] = useState(true);

	// Get translation function for current language
	const { t } = useTranslation(currentLanguage);

	// Update language when tenant changes
	useEffect(() => {
		if (tenant?.language) {
			setCurrentLanguage(tenant.language as Language);
		}
		setIsLoading(false);
	}, [tenant?.language]);

	const setLanguage = (lang: Language) => {
		setCurrentLanguage(lang);

		// Update tenant language in database if user is admin
		if (tenant && tenant.language !== lang) {
			// This will be handled by the tenant settings modal
			// We just update the local state for immediate effect
		}
	};

	const value: LanguageContextType = {
		currentLanguage,
		setLanguage,
		t,
		isLoading,
	};

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
}
