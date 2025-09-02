/** @format */

import { useMemo, useState, useEffect } from "react";
import { useDashboardData } from "./useDashboardData";
import { useApp } from "@/contexts/AppContext";

export interface ProcessedAnalyticsData {
	// Raw data from useDashboardData
	raw: any;

	// KPIs and calculated metrics
	kpis: {
		totalDatabases: number;
		totalTables: number;
		totalRows: number;
		totalUsers: number;
		activeUsers: number;
		engagementRate: number;
		memoryUsagePercentage: number;
		storageUsagePercentage: number;
		databaseGrowthRate: number;
		averageTablesPerDatabase: number;
		averageRowsPerTable: number;
		resourceUtilizationScore: number;
	};

	// Growth metrics
	growth: {
		weeklyDatabaseGrowth: number;
		weeklyUserGrowth: number;
		weeklyTableGrowth: number;
		weeklyRowGrowth: number;
		monthlyGrowthTrend: "up" | "down" | "stable";
	};

	// Distribution data
	distributions: {
		databaseSizes: Array<{ name: string; value: number; percentage: number }>;
		userRoles: Array<{ role: string; count: number; percentage: number }>;
		tablesByDatabase: Array<{ database: string; tables: number }>;
		resourceUsage: Array<{
			resource: string;
			used: number;
			total: number;
			percentage: number;
		}>;
	};

	// Top/Bottom performers
	rankings: {
		topDatabases: Array<{
			name: string;
			tables: number;
			rows: number;
			size: number;
		}>;
		mostActiveUsers: Array<{
			name: string;
			email: string;
			lastActive: string;
			status: string;
		}>;
		largestTables: Array<{ name: string; rows: number; database: string }>;
	};

	// Time-based data for charts
	timeSeriesData: {
		userActivity: Array<{
			date: string;
			active: number;
			total: number;
			percentage: number;
		}>;
		databaseGrowth: Array<{
			date: string;
			databases: number;
			tables: number;
			rows: number;
		}>;
		memoryUsage: Array<{ date: string; used: number; percentage: number }>;
		storageUsage: Array<{
			date: string;
			used: number;
			total: number;
			percentage: number;
		}>;
	};

	// Performance metrics
	performance: {
		averageResponseTime: number;
		uptime: number;
		errorRate: number;
		throughput: number;
		peakUsageHours: Array<{ hour: number; usage: number }>;
	};

	// Health scores
	health: {
		overall: number;
		database: number;
		memory: number;
		storage: number;
		users: number;
	};
}

export const useProcessedAnalyticsData = (): {
	data: ProcessedAnalyticsData | null;
	loading: boolean;
	error: string | null;
	realTimeData?: any;
	businessData?: any;
} => {
	const { data: rawData, loading, error } = useDashboardData();
	const { token, tenant } = useApp();
	const [realTimeData, setRealTimeData] = useState<any>(null);
	const [businessData, setBusinessData] = useState<any>(null);
	const [realTimeLoading, setRealTimeLoading] = useState(false);
	const [businessLoading, setBusinessLoading] = useState(false);

	// Fetch real-time analytics data
	useEffect(() => {
		const fetchRealTimeData = async () => {
			if (!token || !tenant) return;

			setRealTimeLoading(true);
			setBusinessLoading(true);
			try {
				const response = await fetch(
					`/api/tenants/${tenant.id}/analytics/real-data`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);
				if (response.ok) {
					const data = await response.json();
					setRealTimeData(data.realTimeData);
					setBusinessData(data.businessData);
				}
			} catch (error) {
				console.error("Failed to fetch real-time data:", error);
			} finally {
				setRealTimeLoading(false);
				setBusinessLoading(false);
			}
		};

		fetchRealTimeData();
	}, [token, tenant]);

	const processedData = useMemo(() => {
		if (!rawData) return null;

		// Helper function to generate mock time series data
		const generateTimeSeriesData = (days = 30) => {
			const data = [];
			const now = new Date();
			for (let i = days - 1; i >= 0; i--) {
				const date = new Date(now);
				date.setDate(date.getDate() - i);
				data.push({
					date: date.toISOString().split("T")[0],
					value: Math.floor(Math.random() * 100) + 20,
				});
			}
			return data;
		};

		// Calculate KPIs
		const totalDatabases = rawData.stats?.totalDatabases || 0;
		const totalTables = rawData.stats?.totalTables || 0;
		const totalRows = rawData.stats?.totalRows || 0;
		const totalUsers = rawData.stats?.totalUsers || 0;
		const activeUsers = rawData.stats?.activeUsers || 0;

		const engagementRate =
			totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
		const memoryUsagePercentage = rawData.stats?.memoryPercentage || 0;
		const storageUsagePercentage = rawData.usageData?.storage
			? (rawData.usageData.storage.used / rawData.usageData.storage.total) * 100
			: 0;

		const averageTablesPerDatabase =
			totalDatabases > 0 ? totalTables / totalDatabases : 0;
		const averageRowsPerTable = totalTables > 0 ? totalRows / totalTables : 0;

		// Resource utilization score (0-100)
		const resourceUtilizationScore = Math.round(
			memoryUsagePercentage * 0.3 +
				storageUsagePercentage * 0.3 +
				engagementRate * 0.4,
		);

		// Generate mock growth data (in real app, this would come from historical data)
		const weeklyDatabaseGrowth = Math.floor(Math.random() * 20) + 5;
		const weeklyUserGrowth = Math.floor(Math.random() * 15) + 2;
		const weeklyTableGrowth = Math.floor(Math.random() * 30) + 10;
		const weeklyRowGrowth = Math.floor(Math.random() * 500) + 100;

		// Distribution data
		const databaseSizes =
			rawData.databaseData?.databases?.map((db: any, index: number) => ({
				name: db.name || `Database ${index + 1}`,
				value:
					parseFloat((db.size || "0MB").replace("MB", "")) ||
					Math.floor(Math.random() * 1000) + 100,
				percentage: 0, // Will be calculated after sorting
			})) || [];

		// Calculate percentages for database sizes
		const totalSize = databaseSizes.reduce((acc, db) => acc + db.value, 0);
		databaseSizes.forEach((db) => {
			db.percentage = totalSize > 0 ? (db.value / totalSize) * 100 : 0;
		});

		// User roles distribution (mock data)
		const userRoles = [
			{ role: "Admin", count: Math.floor(totalUsers * 0.1), percentage: 10 },
			{ role: "Editor", count: Math.floor(totalUsers * 0.3), percentage: 30 },
			{ role: "Viewer", count: Math.floor(totalUsers * 0.6), percentage: 60 },
		];

		// Resource usage distribution
		const resourceUsage = [
			{
				resource: "Memory",
				used: rawData.usageData?.memory?.used || 0,
				total: rawData.usageData?.memory?.total || 1,
				percentage: memoryUsagePercentage,
			},
			{
				resource: "Storage",
				used: rawData.usageData?.storage?.used || 0,
				total: rawData.usageData?.storage?.total || 1,
				percentage: storageUsagePercentage,
			},
			{
				resource: "Databases",
				used: rawData.usageData?.databases?.used || 0,
				total: rawData.usageData?.databases?.total || 1,
				percentage:
					rawData.usageData?.databases?.total > 0
						? (rawData.usageData.databases.used /
								rawData.usageData.databases.total) *
						  100
						: 0,
			},
			{
				resource: "Tables",
				used: rawData.usageData?.tables?.used || 0,
				total: rawData.usageData?.tables?.total || 1,
				percentage:
					rawData.usageData?.tables?.total > 0
						? (rawData.usageData.tables.used / rawData.usageData.tables.total) *
						  100
						: 0,
			},
		];

		// Rankings
		const topDatabases =
			rawData.databaseData?.databases
				?.map((db: any) => ({
					name: db.name,
					tables: db.tables || 0,
					rows: db.rows || 0,
					size: parseFloat((db.size || "0MB").replace("MB", "")) || 0,
				}))
				.sort((a: any, b: any) => b.size - a.size)
				.slice(0, 5) || [];

		const mostActiveUsers =
			rawData.userData?.recentUsers
				?.filter((user: any) => user.status === "online")
				.slice(0, 5) || [];

		// Use real data if available, otherwise fallback to mock data
		const userActivityData =
			realTimeData?.userActivity ||
			Array.from({ length: 7 }, (_, i) => {
				const date = new Date();
				date.setDate(date.getDate() - (6 - i));
				return {
					date: date.toISOString().split("T")[0],
					active:
						Math.floor(Math.random() * activeUsers) +
						Math.floor(activeUsers * 0.7),
					total: totalUsers,
					percentage: Math.floor(Math.random() * 30) + 70,
				};
			});

		const databaseGrowthData =
			realTimeData?.databaseActivity ||
			Array.from({ length: 30 }, (_, i) => {
				const date = new Date();
				date.setDate(date.getDate() - (29 - i));
				return {
					date: date.toISOString().split("T")[0],
					databases: Math.max(
						1,
						totalDatabases - Math.floor(Math.random() * 5),
					),
					tables: Math.max(1, totalTables - Math.floor(Math.random() * 20)),
					rows: Math.max(100, totalRows - Math.floor(Math.random() * 1000)),
				};
			});

		const memoryUsageData =
			realTimeData?.systemPerformance ||
			Array.from({ length: 24 }, (_, i) => ({
				date: `${i.toString().padStart(2, "0")}:00`,
				used:
					Math.floor(
						Math.random() * (rawData.usageData?.memory?.total || 1000),
					) + 100,
				percentage: Math.floor(Math.random() * 40) + 30,
			}));

		// Performance metrics (use real data if available)
		const performance = businessData?.performance
			? {
					averageResponseTime: businessData.performance.avgResponseTime,
					uptime: businessData.performance.uptime,
					errorRate: businessData.performance.errorRate,
					throughput: businessData.performance.totalRequests,
					peakUsageHours: Array.from({ length: 24 }, (_, i) => ({
						hour: i,
						usage:
							i === businessData.performance.peakUsageHour
								? 100
								: Math.floor(Math.random() * 50) + 20,
					})),
			  }
			: {
					averageResponseTime: Math.floor(Math.random() * 200) + 50,
					uptime: 99.9 - Math.random() * 0.5,
					errorRate: Math.random() * 0.5,
					throughput: Math.floor(Math.random() * 1000) + 500,
					peakUsageHours: Array.from({ length: 24 }, (_, i) => ({
						hour: i,
						usage: Math.floor(Math.random() * 100) + 20,
					})),
			  };

		// Health scores (0-100)
		const health = {
			overall: Math.floor(
				100 -
					(memoryUsagePercentage * 0.3 +
						storageUsagePercentage * 0.3 +
						(100 - engagementRate) * 0.4),
			),
			database:
				totalDatabases > 0
					? Math.min(100, (totalTables / totalDatabases) * 20)
					: 0,
			memory: Math.max(0, 100 - memoryUsagePercentage),
			storage: Math.max(0, 100 - storageUsagePercentage),
			users: Math.min(100, engagementRate * 1.2),
		};

		const processed: ProcessedAnalyticsData = {
			raw: rawData,
			kpis: {
				totalDatabases,
				totalTables,
				totalRows,
				totalUsers,
				activeUsers,
				engagementRate: Math.round(engagementRate * 100) / 100,
				memoryUsagePercentage: Math.round(memoryUsagePercentage * 100) / 100,
				storageUsagePercentage: Math.round(storageUsagePercentage * 100) / 100,
				databaseGrowthRate: weeklyDatabaseGrowth,
				averageTablesPerDatabase:
					Math.round(averageTablesPerDatabase * 100) / 100,
				averageRowsPerTable: Math.round(averageRowsPerTable),
				resourceUtilizationScore,
			},
			growth: {
				weeklyDatabaseGrowth,
				weeklyUserGrowth,
				weeklyTableGrowth,
				weeklyRowGrowth,
				monthlyGrowthTrend:
					resourceUtilizationScore > 70
						? "up"
						: resourceUtilizationScore > 40
						? "stable"
						: "down",
			},
			distributions: {
				databaseSizes: databaseSizes.sort((a, b) => b.value - a.value),
				userRoles,
				tablesByDatabase:
					rawData.databaseData?.databases?.map((db: any) => ({
						database: db.name,
						tables: db.tables || 0,
					})) || [],
				resourceUsage,
			},
			rankings: {
				topDatabases,
				mostActiveUsers,
				largestTables: [], // Would need table-level data from API
			},
			timeSeriesData: {
				userActivity: userActivityData,
				databaseGrowth: databaseGrowthData,
				memoryUsage: memoryUsageData,
				storageUsage: generateTimeSeriesData(30).map((item, i) => ({
					date: item.date,
					used:
						Math.floor(
							Math.random() * (rawData.usageData?.storage?.total || 1000),
						) + 100,
					total: rawData.usageData?.storage?.total || 1000,
					percentage: Math.floor(Math.random() * 60) + 20,
				})),
			},
			performance,
			health,
		};

		return processed;
	}, [rawData, realTimeData, businessData]);

	return {
		data: processedData,
		loading: loading || realTimeLoading || businessLoading,
		error,
		realTimeData,
		businessData,
	};
};
