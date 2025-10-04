/** @format */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { useSubscription } from "@/hooks/useSubscription";
import { getPlanLimits } from "@/lib/planConstants";

interface DashboardData {
	stats: {
		totalDatabases: number;
		totalTables: number;
		totalUsers: number;
		totalRows: number;
		activeUsers: number;
		subscriptionStatus: string;
		planName: string;
		memoryUsedMB: number;
		memoryLimitMB: number;
		memoryPercentage: number;
		isNearMemoryLimit: boolean;
		isOverMemoryLimit: boolean;
	};
	databaseData: {
		databases: Array<{
			name: string;
			tables: number;
			rows: number;
			size: string;
			usage: number;
		}>;
		totalUsage: number;
		limit: number;
	};
	userData: {
		recentUsers: Array<{
			id: number;
			name: string;
			email: string;
			role: string;
			lastActive: string;
			status: "online" | "offline" | "away";
		}>;
		activeUsers: number;
		totalUsers: number;
	};
	usageData: {
		storage: {
			used: number;
			total: number;
			unit: string;
		};
		tables: {
			used: number;
			total: number;
		};
		rows: {
			used: number;
			total: number;
		};
		databases: {
			used: number;
			total: number;
		};
		users: {
			used: number;
			total: number;
		};
		memory: {
			used: number;
			total: number;
			percentage: number;
			isNearLimit: boolean;
			isOverLimit: boolean;
		};
	};
}

export const useDashboardData = () => {
	const { token, tenant } = useApp();
	const { subscription } = useSubscription();
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [loadingPhase, setLoadingPhase] = useState<
		"initial" | "charts" | "complete"
	>("initial");

	// Memoize plan limits to avoid recalculation
	const planLimits = useMemo(
		() => getPlanLimits(subscription?.subscriptionPlan || null),
		[subscription?.subscriptionPlan],
	);

	// Progressive loading: First load essential stats, then charts
	const fetchEssentialData = useCallback(async () => {
		console.log('[useDashboardData] fetchEssentialData called:', {
			hasToken: !!token,
			hasTenant: !!tenant,
			tenantId: tenant?.id
		});
		
		if (!token || !tenant) {
			console.log('[useDashboardData] Missing token or tenant, returning null');
			return null;
		}

		try {
			console.log('[useDashboardData] Starting API calls:', {
				tenantId: tenant.id,
				hasToken: !!token
			});
			
		// Fetch only essential data first for faster FCP
		const [databasesResponse, usersResponse] = await Promise.all([
			fetch(`/api/tenants/${tenant.id}/databases?includePredefined=false`, {
				headers: { Authorization: `Bearer ${token}` },
			}),
			fetch(`/api/tenants/${tenant.id}/users`, {
				headers: { Authorization: `Bearer ${token}` },
			}),
		]);

			console.log('[useDashboardData] API responses:', {
				databasesOk: databasesResponse.ok,
				databasesStatus: databasesResponse.status,
				usersOk: usersResponse.ok,
				usersStatus: usersResponse.status
			});

			if (!databasesResponse.ok || !usersResponse.ok) {
				throw new Error("Failed to fetch essential dashboard data");
			}

			const [databasesData, usersData] = await Promise.all([
				databasesResponse.json(),
				usersResponse.json(),
			]);

			console.log('[useDashboardData] Parsed data:', {
				databasesLength: Array.isArray(databasesData) ? databasesData.length : 'not array',
				usersLength: Array.isArray(usersData) ? usersData.length : 'not array',
				databasesData: databasesData,
				usersData: usersData
			});

			// Process essential data
			const databases = Array.isArray(databasesData) ? databasesData : [];
			const users = Array.isArray(usersData) ? usersData : [];

			const totalTables = databases.reduce(
				(acc: number, db: any) => acc + (db.tables?.length || 0),
				0,
			);

			const totalRows = databases.reduce((acc: number, db: any) => {
				const dbRows =
					db.tables?.reduce(
						(dbAcc: number, table: any) => dbAcc + (table.rowsCount || table._count?.rows || 0),
						0,
					) || 0;
				return acc + dbRows;
			}, 0);

			const activeUsers = users.length + 1;

			console.log('[useDashboardData] Building essential data object:', {
				totalDatabases: databases.length,
				totalTables,
				totalUsers: users.length + 1,
				totalRows,
				activeUsers
			});

			// Return essential stats for immediate display
			const essentialData = {
				stats: {
					totalDatabases: databases.length,
					totalTables,
					totalUsers: users.length + 1,
					totalRows,
					activeUsers,
					subscriptionStatus:
						subscription?.subscriptionStatus || "no_subscription",
					planName: subscription?.subscriptionPlan || "Free",
					memoryUsedMB: 0, // Will be loaded in next phase
					memoryLimitMB: planLimits.storage,
					memoryPercentage: 0,
					isNearMemoryLimit: false,
					isOverMemoryLimit: false,
				},
				databaseData: {
					databases: databases.map((db: any) => {
						const dbRows =
							db.tables?.reduce(
								(acc: number, table: any) => acc + (table.rowsCount || table._count?.rows || 0),
								0,
							) || 0;
						
						// Use fallback calculation - will be updated with real memory data
						const estimatedSizeMB = dbRows * 0.00002; // ~0.02 KB per row
						const estimatedSizeKB = Math.round(dbRows * 0.02);
						
						return {
							name: db.name,
							tables: db.tables?.length || 0,
							rows: dbRows,
							size: `${estimatedSizeMB.toFixed(2)} MB`, // Will be updated with real data
							sizeKB: estimatedSizeKB, // Will be updated with real data
							usage: Math.min(
								((db.tables?.length || 0) / planLimits.tables) * 100,
								100,
							),
						};
					}),
					totalUsage: databases.length,
					limit: planLimits.databases,
				},
				userData: {
					recentUsers: users.slice(0, 5).map((user: any) => ({
						id: user.id,
						name: `${user.firstName} ${user.lastName}`,
						email: user.email,
						role: user.role,
						lastActive: "2 hours ago",
						status: "online" as const,
					})),
					activeUsers,
					totalUsers: users.length + 1,
				},
				usageData: {
					storage: {
						used: 0, // Will be loaded in next phase
						total: planLimits.storage,
						unit: "MB",
					},
					tables: {
						used: totalTables,
						total: planLimits.tables,
					},
					rows: {
						used: totalRows,
						total: planLimits.rows,
					},
					databases: {
						used: databases.length,
						total: planLimits.databases,
					},
					users: {
						used: users.length + 1,
						total: planLimits.users,
					},
					memory: {
						used: 0, // Will be loaded in next phase
						total: planLimits.storage,
						percentage: 0,
						isNearLimit: false,
						isOverLimit: false,
					},
				},
			};

			console.log('[useDashboardData] Essential data created successfully:', {
				hasStats: !!essentialData.stats,
				hasDatabaseData: !!essentialData.databaseData,
				hasUserData: !!essentialData.userData,
				hasUsageData: !!essentialData.usageData
			});

			return essentialData;
		} catch (error) {
			console.error('[useDashboardData] Error in fetchEssentialData:', error);
			throw error;
		}
	}, [token, tenant, subscription?.subscriptionPlan, planLimits]);

	// Load memory data and complete the dashboard
	const fetchMemoryData = useCallback(
		async (essentialData: any) => {
			if (!token || !tenant) return essentialData;

			try {
				// Fetch both memory data and real database sizes in parallel
				const [memoryResponse, realSizesResponse] = await Promise.all([
					fetch(`/api/tenants/${tenant.id}/memory`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch(`/api/analytics/real-database-sizes`, {
						headers: { Authorization: `Bearer ${token}` },
					})
				]);

				if (!memoryResponse.ok) {
					console.warn("Failed to fetch memory data, using defaults");
					return essentialData;
				}

				const memoryData = await memoryResponse.json();
				const memoryInfo = memoryData.success
					? memoryData.data
					: {
							usedMB: 0,
							limitMB: planLimits.storage,
							percentage: 0,
							isNearLimit: false,
							isOverLimit: false,
					  };

				// Get real database sizes if available
				let realSizesData = null;
				if (realSizesResponse.ok) {
					const realSizes = await realSizesResponse.json();
					realSizesData = realSizes.success ? realSizes.data : null;
				}

				// Update database data with real sizes if available
				let updatedDatabaseData = essentialData.databaseData;
				if (realSizesData?.databases) {
					updatedDatabaseData = {
						...essentialData.databaseData,
						databases: essentialData.databaseData.databases.map((db: any) => {
							const realSize = realSizesData.databases.find((realDb: any) => realDb.name === db.name);
							if (realSize) {
								return {
									...db,
									size: `${realSize.realSizeMB.toFixed(2)} MB`,
									sizeKB: realSize.realSizeKB,
									realSizeBytes: realSize.realSizeBytes,
									realSizeFormatted: realSize.sizeFormatted
								};
							}
							return db;
						})
					};
				}

				// Update the data with memory information
				const updatedData = {
					...essentialData,
					databaseData: updatedDatabaseData,
					stats: {
						...essentialData.stats,
						memoryUsedMB: memoryInfo.usedMB,
						memoryLimitMB: memoryInfo.limitMB,
						memoryPercentage: memoryInfo.percentage,
						isNearMemoryLimit: memoryInfo.isNearLimit,
						isOverMemoryLimit: memoryInfo.isOverLimit,
					},
					usageData: {
						...essentialData.usageData,
						storage: {
							used: memoryInfo.usedMB,
							total: memoryInfo.limitMB,
							unit: "MB",
						},
					},
				};

				// Trigger memory recalculation in background if needed
				if (memoryData?.success && memoryData?.data?.lastRecalculated) {
					const lastRecalc = new Date(memoryData.data.lastRecalculated);
					// Check if the date is valid
					if (isNaN(lastRecalc.getTime())) {
						console.warn('Invalid lastRecalculated date:', memoryData.data.lastRecalculated);
						return;
					}
					const now = new Date();
					const hoursSinceRecalc =
						(now.getTime() - lastRecalc.getTime()) / (1000 * 60 * 60);

					if (hoursSinceRecalc > 1) {
						// Fire and forget - don't wait for this
						fetch(`/api/tenants/${tenant.id}/memory/recalculate`, {
							method: "POST",
							headers: { Authorization: `Bearer ${token}` },
						}).catch(() => {
							// Ignore recalculation errors
						});
					}
				}

				return updatedData;
			} catch (error) {
				console.warn("Failed to fetch memory data:", error);
				return essentialData;
			}
		},
		[token, tenant, planLimits],
	);

	useEffect(() => {
		const loadDashboardData = async () => {
			console.log('[useDashboardData] loadDashboardData called:', {
				hasToken: !!token,
				hasTenant: !!tenant,
				tenantId: tenant?.id
			});

			if (!token || !tenant) {
				console.log('[useDashboardData] No token or tenant, setting loading false');
				setLoading(false);
				return;
			}

			try {
				console.log('[useDashboardData] Starting data loading...');
				setLoading(true);
				setError(null);
				setLoadingPhase("initial");

				// Phase 1: Load essential data for immediate display
				console.log('[useDashboardData] Calling fetchEssentialData...');
				const essentialData = await fetchEssentialData();
				console.log('[useDashboardData] fetchEssentialData result:', {
					hasEssentialData: !!essentialData,
					essentialDataKeys: essentialData ? Object.keys(essentialData) : null
				});
				
				if (essentialData) {
					console.log('[useDashboardData] Setting data and updating loading state');
					setData(essentialData);
					setLoadingPhase("charts");
					setLoading(false); // Show content immediately

					// Phase 2: Load memory data in background
					setTimeout(async () => {
						try {
							const completeData = await fetchMemoryData(essentialData);
							setData(completeData);
							setLoadingPhase("complete");
						} catch (error) {
							console.warn("Background memory data loading failed:", error);
						}
					}, 100); // Small delay to prioritize UI rendering
				} else {
					console.log('[useDashboardData] No essential data returned, setting loading false');
					setLoading(false);
				}
			} catch (error) {
				console.error('[useDashboardData] Error in loadDashboardData:', error);
				setError(error instanceof Error ? error.message : "Unknown error");
				setLoading(false);
			}
		};

		loadDashboardData();
	}, [token, tenant?.id, subscription?.subscriptionPlan, planLimits]);

	// Memoize the return value to prevent unnecessary re-renders
	const returnValue = useMemo(
		() => {
			console.log('[useDashboardData] Returning value:', {
				hasData: !!data,
				loading,
				error,
				loadingPhase,
				dataKeys: data ? Object.keys(data) : null
			});
			
			return {
				data,
				loading,
				error,
				loadingPhase,
			};
		},
		[data, loading, error, loadingPhase],
	);
	
	return returnValue;
};
