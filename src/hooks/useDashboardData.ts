/** @format */

import { useState, useEffect } from "react";
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
		memoryUsedGB: number;
		memoryLimitGB: number;
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

				const [databasesData, usersData, memoryData] = await Promise.all([
					databasesResponse.json(),
					usersResponse.json(),
					memoryResponse.json(),
				]);

				// Process databases data
				const databases = Array.isArray(databasesData) ? databasesData : [];

				if (process.env.NODE_ENV === "development") {
					// Dashboard databases data loaded
				}

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

				if (process.env.NODE_ENV === "development") {
					// Dashboard totals calculated
				}

				// Process users data
				const users = Array.isArray(usersData) ? usersData : [];

				if (process.env.NODE_ENV === "development") {
					// Dashboard users data loaded
				}
				// Pentru moment, considerăm toți utilizatorii ca fiind activi
				// În viitor, putem adăuga un câmp status în baza de date
				const activeUsers = users.length;

				// Get plan limits based on subscription
				const planLimits = getPlanLimits(
					subscription?.subscriptionPlan || null,
				);

				console.log("planLimits", planLimits);

				// Get memory data
				const memoryInfo = memoryData.success
					? memoryData.data
					: {
							usedGB: 0,
							limitGB: planLimits.storage / 1024,
							percentage: 0,
							isNearLimit: false,
							isOverLimit: false,
					  };
				console.log("memoryInfo", memoryInfo);
				// Create dashboard data
				const dashboardData: DashboardData = {
					stats: {
						totalDatabases: databases.length,
						totalTables,
						totalUsers: users.length,
						totalRows,
						activeUsers,
						subscriptionStatus:
							subscription?.subscriptionStatus || "no_subscription",
						planName: subscription?.subscriptionPlan || "Starter",
						memoryUsedGB: memoryInfo.usedGB,
						memoryLimitGB: memoryInfo.limitGB,
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
						totalUsers: users.length,
					},
					usageData: {
						storage: {
							used: memoryInfo.usedGB,
							total: memoryInfo.limitGB,
							unit: "GB",
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
							used: users.length,
							total: planLimits.users,
						},
						memory: {
							used: memoryInfo.usedGB,
							total: memoryInfo.limitGB,
							percentage: memoryInfo.percentage,
							isNearLimit: memoryInfo.isNearLimit,
							isOverLimit: memoryInfo.isOverLimit,
						},
					},
				};

				setData(dashboardData);
			} catch (err) {
				console.error("Error fetching dashboard data:", err);
				setError("Failed to load dashboard data");
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [token, tenant, subscription]);

	return { data, loading, error };
};
