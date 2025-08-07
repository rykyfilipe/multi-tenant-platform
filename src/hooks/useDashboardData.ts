/** @format */

import { useState, useEffect, useCallback } from "react";
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

	useEffect(() => {
		const fetchDashboardData = async () => {
			if (!token || !tenant) {
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);

				// Fetch databases
				const databasesResponse = await fetch(
					`/api/tenants/${tenant.id}/databases`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				);

				// Fetch users
				const usersResponse = await fetch(`/api/tenants/${tenant.id}/users`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				// Fetch tables and rows data - folosim endpoint-ul corect
				// Nu mai avem nevoie de acest request separat pentru că datele sunt deja în databasesResponse

				// Fetch memory usage data
				const memoryResponse = await fetch(`/api/tenants/${tenant.id}/memory`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				// Auto-recalculate memory on each page load
				try {
					const recalcResponse = await fetch(
						`/api/tenants/${tenant.id}/memory/recalculate`,
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${token}`,
							},
						},
					);
					if (recalcResponse.ok) {
						console.log("🔄 [AUTO] Memory recalculated on page load");
					}
				} catch (recalcError) {
					console.log("⚠️ [AUTO] Memory recalculation failed:", recalcError);
				}

				// Check if all responses are ok
				if (!databasesResponse.ok || !usersResponse.ok || !memoryResponse.ok) {
					throw new Error("Failed to fetch dashboard data");
				}

				const [databasesData, usersData, memoryData] = await Promise.all([
					databasesResponse.json(),
					usersResponse.json(),
					memoryResponse.json(),
				]);

				// Process databases data
				const databases = Array.isArray(databasesData) ? databasesData : [];

				const totalTables = databases.reduce(
					(acc: number, db: any) => acc + (db.tables?.length || 0),
					0,
				);

				// Calculăm totalRows din rândurile efective din fiecare tabelă
				const totalRows = databases.reduce((acc: number, db: any) => {
					const dbRows =
						db.tables?.reduce(
							(dbAcc: number, table: any) => dbAcc + (table.rows?.length || 0),
							0,
						) || 0;
					return acc + dbRows;
				}, 0);

				// Process users data
				const users = Array.isArray(usersData) ? usersData : [];
				// Pentru moment, considerăm toți utilizatorii ca fiind activi
				// În viitor, putem adăuga un câmp status în baza de date
				// Include administratorul curent în calcul (API-ul îl exclude din listă)
				const activeUsers = users.length + 1;

				// Get plan limits based on subscription
				const planLimits = getPlanLimits(
					subscription?.subscriptionPlan || null,
				);

				// Get memory data
				const memoryInfo = memoryData.success
					? memoryData.data
					: {
							usedMB: 0,
							limitMB: planLimits.storage, // Already in MB
							percentage: 0,
							isNearLimit: false,
					  };

				// Create dashboard data
				const dashboardData: DashboardData = {
					stats: {
						totalDatabases: databases.length,
						totalTables,
						totalUsers: users.length + 1, // Include administratorul curent
						totalRows,
						activeUsers,
						subscriptionStatus:
							subscription?.subscriptionStatus || "no_subscription",
						planName: subscription?.subscriptionPlan || "Starter",
						memoryUsedMB: memoryInfo.usedMB,
						memoryLimitMB: memoryInfo.limitMB,
						memoryPercentage: memoryInfo.percentage,
						isNearMemoryLimit: memoryInfo.isNearLimit,
						isOverMemoryLimit: memoryInfo.isOverLimit,
					},
					databaseData: {
						databases: databases.map((db: any) => {
							const dbRows =
								db.tables?.reduce(
									(acc: number, table: any) => acc + (table.rows?.length || 0),
									0,
								) || 0;
							return {
								name: db.name,
								tables: db.tables?.length || 0,
								rows: dbRows,
								size: `${(dbRows * 0.001).toFixed(2)} MB`,
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
							lastActive: "2 hours ago", // Mock data
							status: "online", // Pentru moment, toți sunt online
						})),
						activeUsers,
						totalUsers: users.length + 1, // Include administratorul curent
					},
					usageData: {
						storage: {
							used: memoryInfo.usedMB,
							total: memoryInfo.limitMB,
							unit: "MB",
						},
						tables: {
							used: totalTables,
							total: planLimits.tables,
						},
						rows: {
							used: totalRows,
							total: planLimits.rows, // Use actual plan limit
						},
						databases: {
							used: databases.length,
							total: planLimits.databases,
						},
						users: {
							used: users.length + 1, // Include administratorul curent
							total: planLimits.users,
						},
						memory: {
							used: memoryInfo.usedMB,
							total: memoryInfo.limitMB,
							percentage: memoryInfo.percentage,
							isNearLimit: memoryInfo.isNearLimit,
							isOverLimit: memoryInfo.isOverLimit,
						},
					},
				};

				setData(dashboardData);
			} catch (error) {
				console.error("Error fetching dashboard data:", error);
				setError(error instanceof Error ? error.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		};

		if (token && tenant) {
			fetchDashboardData();
		}
	}, [token, tenant, subscription]); // Remove fetchDashboardData from dependencies

	return { data, loading, error };
};
