/** @format */

"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { BackupManager } from "@/components/backup/BackupManager";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";

function BackupPage() {
	const { data: session } = useSession();
	const { tenant, user } = useApp();
	const { t } = useLanguage();

	if (!session) return null;

	// Only show for admins
	if (user?.role !== "ADMIN") {
		return (
			<div className="h-full bg-background flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-foreground mb-4">
						Access Denied
					</h2>
					<p className="text-muted-foreground">
						Only administrators can access backup functionality.
					</p>
				</div>
			</div>
		);
	}

	return (
		<PerformanceOptimizer preloadFonts={true} preloadCriticalCSS={true}>
			<div className="p-6 max-w-7xl mx-auto">
				<BackupManager tenantId={tenant?.id?.toString() || ""} />
			</div>
		</PerformanceOptimizer>
	);
}

export default BackupPage;
