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

interface CurrentCounts {
	databases: number;
	tables: number;
	users: number;
	apiTokens: number;
	publicTables: number;
	storage: {
		used: number;
		total: number;
		percentage: number;
		isNearLimit: boolean;
		isOverLimit: boolean;
	};
	rows: number;
}

const LIMIT_ICONS = {
	databases: Database,
	tables: Table,
	users: Users,
	apiTokens: Key,
	publicTables: Globe,
	storage: HardDrive,
	rows: Table,
};

const LIMIT_LABELS = {
	databases: "Databases",
	tables: "Tables",
	users: "Users",
	apiTokens: "API Tokens",
	publicTables: "Public Tables",
	storage: "Storage",
	rows: "Rows",
};

export default function PlanLimitsDisplay() {
	const { data: session } = useSession();
	const [currentCounts, setCurrentCounts] = useState<CurrentCounts | null>(
		null,
	);
	const [loading, setLoading] = useState(true);

	const currentPlan = session?.subscription?.plan || "Starter";
	const planLimits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.Starter;

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
				const limitsData = await limitsResponse.json();
				const memoryData = await memoryResponse.json();

				const memoryInfo = memoryData.success
					? memoryData.data
					: {
							usedGB: 0,
							limitGB: planLimits.storage / 1024, // Convert MB to GB
							percentage: 0,
							isNearLimit: false,
							isOverLimit: false,
					  };

				setCurrentCounts({
					...limitsData,
					storage: {
						used: memoryInfo.usedGB,
						total: memoryInfo.limitGB,
						percentage: memoryInfo.percentage,
						isNearLimit: memoryInfo.isNearLimit,
						isOverLimit: memoryInfo.isOverLimit,
					},
				});
			} else {
				console.error("Failed to fetch limits:", limitsResponse.status);
			}
		} catch (error) {
			console.error("Error fetching limits:", error);
		} finally {
			setLoading(false);
		}
	}, [token, tenant?.id, planLimits.storage]);

	useEffect(() => {
		if (token && tenant?.id && !currentCounts) {
			fetchCounts();
		}
	}, [token, tenant?.id, fetchCounts, currentCounts]);

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Plan Usage</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='text-center py-8'>
						<div className='w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4'>
							<Settings className='w-8 h-8 text-white animate-spin' />
						</div>
						<h3 className='text-lg font-semibold text-foreground mb-2'>
							Loading usage data
						</h3>
						<p className='text-muted-foreground'>
							Fetching your plan limits and current usage...
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Plan Overview */}
			<div className='flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200'>
				<div>
					<h3 className='text-lg font-semibold text-gray-900'>Current Plan</h3>
					<p className='text-sm text-gray-600'>
						You're on the {currentPlan} plan
					</p>
				</div>
				<Badge
					variant={currentPlan === "Starter" ? "secondary" : "default"}
					className='text-sm px-3 py-1'>
					{currentPlan}
				</Badge>
			</div>

			{/* Usage Details */}
			<div className='space-y-4'>
				<h4 className='text-md font-medium text-gray-900'>Resource Usage</h4>
				<div className='space-y-4'>
					{Object.entries(planLimits).map(([key, limit]) => {
						if (key === "storage") {
							const storageData = currentCounts?.storage;
							if (!storageData) return null;

							const percentage = storageData.percentage;
							const Icon = LIMIT_ICONS[key as keyof typeof LIMIT_ICONS];
							const isAtLimit = storageData.isOverLimit;
							const isNearLimit = storageData.isNearLimit;

							return (
								<div
									key={key}
									className='p-4 border rounded-lg hover:shadow-sm transition-shadow'>
									<div className='flex items-center justify-between mb-3'>
										<div className='flex items-center space-x-3'>
											<div
												className={`p-2 rounded-lg ${
													isAtLimit
														? "bg-red-100"
														: isNearLimit
														? "bg-yellow-100"
														: "bg-blue-100"
												}`}>
												<Icon
													className={`w-4 h-4 ${
														isAtLimit
															? "text-red-600"
															: isNearLimit
															? "text-yellow-600"
															: "text-blue-600"
													}`}
												/>
											</div>
											<div>
												<span className='text-sm font-medium text-gray-900'>
													{LIMIT_LABELS[key as keyof PlanLimits]}
												</span>
												<p className='text-xs text-gray-500'>
													Used {storageData.used.toFixed(3)} of{" "}
													{storageData.total} GB
												</p>
											</div>
										</div>
										<div className='text-right'>
											<span
												className={`text-sm font-semibold ${
													isAtLimit
														? "text-red-600"
														: isNearLimit
														? "text-yellow-600"
														: "text-gray-900"
												}`}>
												{storageData.used.toFixed(3)} / {storageData.total} GB
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
											⚠️ Storage limit exceeded. Upgrade your plan for more
											storage.
										</div>
									)}
									{isNearLimit && !isAtLimit && (
										<div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700'>
											⚠️ Getting close to your storage limit. Consider upgrading
											your plan.
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
													? "bg-red-100"
													: isNearLimit
													? "bg-yellow-100"
													: "bg-blue-100"
											}`}>
											<Icon
												className={`w-4 h-4 ${
													isAtLimit
														? "text-red-600"
														: isNearLimit
														? "text-yellow-600"
														: "text-blue-600"
												}`}
											/>
										</div>
										<div>
											<span className='text-sm font-medium text-gray-900'>
												{LIMIT_LABELS[key as keyof PlanLimits]}
											</span>
											<p className='text-xs text-gray-500'>
												Used {current} of {limit}
											</p>
										</div>
									</div>
									<div className='text-right'>
										<span
											className={`text-sm font-semibold ${
												isAtLimit
													? "text-red-600"
													: isNearLimit
													? "text-yellow-600"
													: "text-gray-900"
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
										⚠️ Limit reached. Upgrade your plan for more{" "}
										{LIMIT_LABELS[key as keyof PlanLimits].toLowerCase()}.
									</div>
								)}
								{isNearLimit && !isAtLimit && (
									<div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700'>
										⚠️ Getting close to your limit. Consider upgrading your
										plan.
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Upgrade CTA */}
			{currentPlan === "Starter" && (
				<div className='p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200'>
					<div className='text-center'>
						<h4 className='text-md font-semibold text-gray-900 mb-2'>
							Need More Resources?
						</h4>
						<p className='text-sm text-gray-600 mb-3'>
							Upgrade to Pro or Enterprise for more databases, tables, and
							users.
						</p>
						<Button
							onClick={() => (window.location.href = "/")}
							className='bg-purple-600 hover:bg-purple-700'>
							View Plans
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
