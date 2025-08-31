/** @format */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Database,
	Table,
	Users,
	Key,
	Globe,
	Settings,
	HardDrive,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { PLAN_LIMITS } from "@/lib/planConstants";
import type { PlanLimits } from "@/lib/planConstants";
import { formatStorageSize, convertMBToBytes } from "@/lib/storage-utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface CurrentCounts {
	databases: number;
	tables: number;
	users: number;
	storage: number;
	rows: number;
}

const LIMIT_ICONS = {
	databases: Database,
	tables: Table,
	users: Users,

	storage: HardDrive,
	rows: Table,
};

const LIMIT_LABELS = {
	databases: "planLimits.databases",
	tables: "planLimits.tables",
	users: "planLimits.users",

	storage: "planLimits.storage",
	rows: "planLimits.rows",
};

// Helper function to format storage display using storage utilities
const formatStorageDisplay = (used: number, total: number) => {
	const usedBytes = convertMBToBytes(used);
	const totalBytes = convertMBToBytes(total);

	return {
		used: formatStorageSize(usedBytes),
		total: formatStorageSize(totalBytes),
	};
};

export default function PlanLimitsDisplay() {
	const { data: session } = useSession();
	const { t } = useLanguage();
	const [currentCounts, setCurrentCounts] = useState<CurrentCounts | null>(
		null,
	);
	const [loading, setLoading] = useState(true);

	const currentPlan = session?.subscription?.plan || "Free";
	const planLimits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.Free;

	const { token, tenant } = useApp();

	const fetchCounts = useCallback(async () => {
		if (!token || !tenant?.id) {
			setLoading(false);
			return;
		}

		try {
			const [limitsResponse, memoryResponse] = await Promise.all([
				fetch("/api/user/limits", {
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}),
				fetch(`/api/tenants/${tenant.id}/memory`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}),
			]);

			if (limitsResponse.ok && memoryResponse.ok) {
				const [limitsData, memoryData] = await Promise.all([
					limitsResponse.json(),
					memoryResponse.json(),
				]);

				const storageUsed = memoryData.used || 0;
				const storageTotal = planLimits.storage || 0;
				const storagePercentage =
					storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0;

				setCurrentCounts({
					...limitsData,
					storage: {
						used: storageUsed,
						total: storageTotal,
						percentage: storagePercentage,
						isNearLimit: storagePercentage >= 80,
						isOverLimit: storagePercentage >= 100,
					},
				});
			}
		} catch (error) {
			console.error("Error fetching counts:", error);
		} finally {
			setLoading(false);
		}
	}, [token, tenant?.id, planLimits.storage]);

	useEffect(() => {
		fetchCounts();
	}, [fetchCounts]);

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Settings className='w-5 h-5' />
						{t("planLimits.loading")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{[...Array(5)].map((_, i) => (
							<div key={i} className='animate-pulse'>
								<div className='h-4 bg-muted rounded w-1/3 mb-2'></div>
								<div className='h-2 bg-muted rounded'></div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!currentCounts) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Settings className='w-5 h-5' />
						{t("planLimits.title")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground'>{t("planLimits.noData")}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("planLimits.title")}
				</h2>
				<div className='flex items-center gap-2'>
					<Globe className='w-4 h-4 text-muted-foreground' />
					<span className='text-sm text-muted-foreground'>
						{t("planLimits.currentPlan")}: {currentPlan}
					</span>
				</div>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{Object.entries(planLimits).map(([key, limit]) => {
					if (key === "storage") {
						const { used, total, percentage, isNearLimit, isOverLimit } =
							currentCounts.storage;
						const storageDisplay = formatStorageDisplay(used, total);

						return (
							<div
								key={key}
								className='p-4 border rounded-lg hover:shadow-sm transition-shadow'>
								<div className='flex items-center justify-between mb-3'>
									<div className='flex items-center space-x-3'>
										<div
											className={`p-2 rounded-lg ${
												isOverLimit
													? "bg-red-100 dark:bg-red-900/20"
													: isNearLimit
													? "bg-yellow-100 dark:bg-yellow-900/20"
													: "bg-primary/10"
											}`}>
											<HardDrive
												className={`w-4 h-4 ${
													isOverLimit
														? "text-red-600 dark:text-red-400"
														: isNearLimit
														? "text-yellow-600 dark:text-yellow-400"
														: "text-primary"
												}`}
											/>
										</div>
										<div>
											<span className='text-sm font-medium text-foreground'>
												{t(LIMIT_LABELS[key as keyof PlanLimits])}
											</span>
											<p className='text-xs text-muted-foreground'>
												{t("planLimits.usedOf", {
													used: storageDisplay.used,
													total: storageDisplay.total,
												})}
											</p>
										</div>
									</div>
									<div className='text-right'>
										<span
											className={`text-sm font-semibold ${
												isOverLimit
													? "text-red-600 dark:text-red-400"
													: isNearLimit
													? "text-yellow-600 dark:text-yellow-400"
													: "text-foreground"
											}`}>
											{storageDisplay.used} / {storageDisplay.total}
										</span>
									</div>
								</div>
								<Progress
									value={percentage}
									className='h-2'
									style={{
										backgroundColor: isOverLimit
											? "#fef2f2"
											: isNearLimit
											? "#fffbeb"
											: "#f3f4f6",
									}}
								/>
								{isOverLimit && (
									<div className='mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700'>
										⚠️ {t("planLimits.storage.exceeded")}
									</div>
								)}
								{isNearLimit && !isOverLimit && (
									<div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700'>
										⚠️ {t("planLimits.storage.nearLimit")}
									</div>
								)}
							</div>
						);
					}

					const current =
						(currentCounts?.[
							key as keyof Omit<CurrentCounts, "storage">
						] as number) || 0;
					const percentage = limit > 0 ? (current / limit) * 100 : 0;
					const Icon = LIMIT_ICONS[key as keyof typeof LIMIT_ICONS];
					const isAtLimit = current >= limit;
					const isNearLimit = percentage >= 80;

					return (
						<div
							key={key}
							className='p-4 border rounded-lg hover:shadow-sm transition-shadow'>
							<div className='flex items-center justify-between mb-3'>
								<div className='flex items-center space-x-3'>
									<div
										className={`p-2 rounded-lg ${
											isAtLimit
												? "bg-red-100 dark:bg-red-900/20"
												: isNearLimit
												? "bg-yellow-100 dark:bg-yellow-900/20"
												: "bg-primary/10"
										}`}>
										<Icon
											className={`w-4 h-4 ${
												isAtLimit
													? "text-red-600 dark:text-red-400"
													: isNearLimit
													? "text-yellow-600 dark:text-yellow-400"
													: "text-primary"
											}`}
										/>
									</div>
									<div>
										<span className='text-sm font-medium text-foreground'>
											{t(LIMIT_LABELS[key as keyof PlanLimits])}
										</span>
										<p className='text-xs text-muted-foreground'>
											{t("planLimits.usedOf", {
												used: current,
												total: limit,
											})}
										</p>
									</div>
								</div>
								<div className='text-right'>
									<span
										className={`text-sm font-semibold ${
											isAtLimit
												? "text-red-600 dark:text-red-400"
												: isNearLimit
												? "text-yellow-600 dark:text-yellow-400"
												: "text-foreground"
										}`}>
										{current} / {limit}
									</span>
								</div>
							</div>
							<Progress
								value={percentage}
								className='h-2'
								style={{
									backgroundColor: isAtLimit
										? "#fef2f2"
										: isNearLimit
										? "#fffbeb"
										: "#f3f4f6",
								}}
							/>
							{isAtLimit && (
								<div className='mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700'>
									⚠️{" "}
									{t("planLimits.limitReached", {
										resource: t(
											LIMIT_LABELS[key as keyof PlanLimits],
										).toLowerCase(),
									})}
								</div>
							)}
							{isNearLimit && !isAtLimit && (
								<div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700'>
									⚠️ {t("planLimits.nearLimit")}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Upgrade CTA */}
			{currentPlan === "Free" && (
				<div className='p-4 bg-muted/30 rounded-lg border border-border'>
					<div className='text-center'>
						<h4 className='text-md font-semibold text-foreground mb-2'>
							{t("planLimits.upgrade.title")}
						</h4>
						<p className='text-sm text-muted-foreground mb-3'>
							{t("planLimits.upgrade.description")}
						</p>
						<Button
							onClick={() => (window.location.href = "/")}
							className='bg-purple-600 hover:bg-purple-700'>
							{t("planLimits.upgrade.viewPlans")}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
