/** @format */

import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useSubscription } from "@/hooks/useSubscription";

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
					console.log("Dashboard - Databases data:", databases);
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
					console.log("Dashboard - Total tables:", totalTables);
					console.log("Dashboard - Total rows:", totalRows);
				}

				// Process users data
				const users = Array.isArray(usersData) ? usersData : [];

				if (process.env.NODE_ENV === "development") {
					console.log("Dashboard - Users data:", users);
				}
				// Pentru moment, considerăm toți utilizatorii ca fiind activi
				// În viitor, putem adăuga un câmp status în baza de date
				const activeUsers = users.length;

				// Get plan limits based on subscription
				const getPlanLimits = () => {
					switch (subscription?.subscriptionPlan) {
						case "Starter":
							return { databases: 1, tables: 5, users: 2, storage: 1 };
						case "Pro":
							return { databases: 5, tables: 25, users: 10, storage: 10 };
						case "Enterprise":
							return { databases: 999, tables: 999, users: 999, storage: 100 };
						default:
							return { databases: 1, tables: 1, users: 1, storage: 0.1 };
					}
				};

				const planLimits = getPlanLimits();

				// Get memory data
				const memoryInfo = memoryData.success
					? memoryData.data
					: {
							usedGB: 0,
							limitGB: planLimits.storage,
							percentage: 0,
							isNearLimit: false,
							isOverLimit: false,
					  };

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
						planName: subscription?.subscriptionPlan || "Free",
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
							used: Math.round(totalRows * 0.001 * 100) / 100,
							total: planLimits.storage,
							unit: "GB",
						},
						tables: {
							used: totalTables,
							total: planLimits.tables,
						},
						rows: {
							used: totalRows,
							total: planLimits.tables * 10000, // Mock limit
						},
						databases: {
							used: databases.length,
							total: planLimits.databases,
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
