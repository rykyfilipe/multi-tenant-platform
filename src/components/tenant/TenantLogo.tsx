/** @format */

"use client";

import React from "react";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Database } from "lucide-react";
import Image from "next/image";

interface Props {
	size?: "sm" | "md" | "lg";
	showText?: boolean;
	className?: string;
}

function TenantLogo({ size = "md", showText = true, className = "" }: Props) {
	const { tenant } = useApp();
	const { t } = useLanguage();

	const sizeClasses = {
		sm: "w-6 h-6",
		md: "w-8 h-8",
		lg: "w-10 h-10",
	};

	const textSizes = {
		sm: "text-sm",
		md: "text-base",
		lg: "text-lg",
	};

	if (!tenant?.logoUrl) {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				<div
					className={`${sizeClasses[size]} bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg`}>
					<Database
						className={`${
							size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
						} text-white`}
					/>
				</div>
				{showText && (
					<span className={`font-bold text-foreground ${textSizes[size]}`}>
						{tenant?.name || t("tenant.logo.defaultName")}
					</span>
				)}
			</div>
		);
	}

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<div
				className={`${sizeClasses[size]} relative rounded-lg overflow-hidden shadow-lg`}>
				<Image
					src={tenant.logoUrl}
					alt={t("tenant.logo.altText", { name: tenant.name })}
					fill
					className='object-contain'
					sizes={size === "sm" ? "24px" : size === "md" ? "32px" : "40px"}
				/>
			</div>
			{showText && (
				<span className={`font-bold text-foreground ${textSizes[size]}`}>
					{tenant.name}
				</span>
			)}
		</div>
	);
}

export default TenantLogo;
