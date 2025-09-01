/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
	request: NextRequest,
	{ params }: { params: { tenantId: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { tenantId } = params;
		const tenantIdNum = parseInt(tenantId);

		// Generate sample data for the last 30 days
		const now = new Date();
		const startDate = new Date();
		startDate.setDate(now.getDate() - 30);

		// Clear existing data
		await prisma.userActivity.deleteMany({
			where: { tenantId: tenantIdNum },
		});
		await prisma.databaseActivity.deleteMany({
			where: { tenantId: tenantIdNum },
		});
		await prisma.systemMetrics.deleteMany({
			where: { tenantId: tenantIdNum },
		});
		await prisma.tenantUsage.deleteMany({
			where: { tenantId: tenantIdNum },
		});
		await prisma.apiUsage.deleteMany({
			where: { tenantId: tenantIdNum },
		});
		await prisma.errorLog.deleteMany({
			where: { tenantId: tenantIdNum },
		});

		// Generate user activity data
		const userActivityData = [];
		for (let i = 0; i < 30; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			// Generate 10-50 activities per day
			const activitiesPerDay = Math.floor(Math.random() * 40) + 10;

			for (let j = 0; j < activitiesPerDay; j++) {
				const activityTime = new Date(date);
				activityTime.setHours(Math.floor(Math.random() * 24));
				activityTime.setMinutes(Math.floor(Math.random() * 60));

				const actions = ["login", "create", "update", "delete", "view"];
				const action = actions[Math.floor(Math.random() * actions.length)];

				userActivityData.push({
					tenantId: tenantIdNum,
					userId: Math.floor(Math.random() * 10) + 1, // 1-10 users
					action,
					resource: action === "view" ? "dashboard" : "database",
					resourceId: Math.floor(Math.random() * 5) + 1,
					metadata: {
						responseTime: Math.floor(Math.random() * 200) + 50,
						ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
					},
					createdAt: activityTime,
				});
			}
		}

		// Generate database activity data
		const databaseActivityData = [];
		for (let i = 0; i < 30; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			const queriesPerDay = Math.floor(Math.random() * 100) + 50;

			for (let j = 0; j < queriesPerDay; j++) {
				const activityTime = new Date(date);
				activityTime.setHours(Math.floor(Math.random() * 24));
				activityTime.setMinutes(Math.floor(Math.random() * 60));

				const actions = ["query", "insert", "update", "delete", "select"];
				const action = actions[Math.floor(Math.random() * actions.length)];

				databaseActivityData.push({
					tenantId: tenantIdNum,
					databaseId: Math.floor(Math.random() * 3) + 1, // 1-3 databases
					action,
					tableName: `table_${Math.floor(Math.random() * 10) + 1}`,
					query: `SELECT * FROM table_${Math.floor(Math.random() * 10) + 1}`,
					responseTime: Math.floor(Math.random() * 100) + 10,
					rowsAffected: Math.floor(Math.random() * 1000),
					metadata: {
						error: Math.random() < 0.05, // 5% error rate
					},
					createdAt: activityTime,
				});
			}
		}

		// Generate system metrics data
		const systemMetricsData = [];
		for (let i = 0; i < 30; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			// Generate hourly metrics
			for (let hour = 0; hour < 24; hour++) {
				const metricTime = new Date(date);
				metricTime.setHours(hour);

				systemMetricsData.push({
					tenantId: tenantIdNum,
					cpuUsage: Math.random() * 80 + 10, // 10-90%
					memoryUsage: Math.random() * 70 + 20, // 20-90%
					diskUsage: Math.random() * 60 + 30, // 30-90%
					networkLatency: Math.floor(Math.random() * 100) + 20, // 20-120ms
					errorRate: Math.random() * 2, // 0-2%
					activeConnections: Math.floor(Math.random() * 50) + 10,
					metadata: {
						serverLoad: Math.random() * 100,
					},
					createdAt: metricTime,
				});
			}
		}

		// Generate tenant usage data
		const tenantUsageData = [];
		for (let i = 0; i < 30; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			tenantUsageData.push({
				tenantId: tenantIdNum,
				cpuUsage: Math.random() * 60 + 20,
				memoryUsage: Math.random() * 50 + 30,
				storageUsage: Math.random() * 1000 + 500, // MB
				apiCalls: Math.floor(Math.random() * 1000) + 100,
				databaseQueries: Math.floor(Math.random() * 500) + 50,
				overageAmount: Math.random() < 0.1 ? Math.random() * 100 : 0, // 10% chance of overage
				lastActivity: date,
				createdAt: date,
			});
		}

		// Generate API usage data
		const apiUsageData = [];
		const endpoints = [
			"/api/users",
			"/api/databases",
			"/api/analytics",
			"/api/auth",
			"/api/tenants",
		];

		for (let i = 0; i < 30; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			const callsPerDay = Math.floor(Math.random() * 200) + 50;

			for (let j = 0; j < callsPerDay; j++) {
				const callTime = new Date(date);
				callTime.setHours(Math.floor(Math.random() * 24));
				callTime.setMinutes(Math.floor(Math.random() * 60));

				const endpoint =
					endpoints[Math.floor(Math.random() * endpoints.length)];
				const methods = ["GET", "POST", "PUT", "DELETE"];
				const method = methods[Math.floor(Math.random() * methods.length)];
				const statusCodes = [200, 201, 400, 401, 404, 500];
				const statusCode =
					statusCodes[Math.floor(Math.random() * statusCodes.length)];

				apiUsageData.push({
					tenantId: tenantIdNum,
					endpoint,
					method,
					statusCode,
					responseTime: Math.floor(Math.random() * 300) + 50,
					requestSize: Math.floor(Math.random() * 1000) + 100,
					responseSize: Math.floor(Math.random() * 2000) + 200,
					userId: Math.floor(Math.random() * 10) + 1,
					ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
					userAgent:
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					createdAt: callTime,
				});
			}
		}

		// Generate error log data
		const errorLogData = [];
		for (let i = 0; i < 30; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			const errorsPerDay = Math.floor(Math.random() * 10) + 1;

			for (let j = 0; j < errorsPerDay; j++) {
				const errorTime = new Date(date);
				errorTime.setHours(Math.floor(Math.random() * 24));
				errorTime.setMinutes(Math.floor(Math.random() * 60));

				const errorTypes = [
					"DatabaseError",
					"ValidationError",
					"AuthError",
					"NetworkError",
					"SystemError",
				];
				const errorType =
					errorTypes[Math.floor(Math.random() * errorTypes.length)];
				const messages = [
					"Connection timeout",
					"Invalid credentials",
					"Database connection failed",
					"Validation failed",
					"Network unreachable",
				];
				const errorMessage =
					messages[Math.floor(Math.random() * messages.length)];

				errorLogData.push({
					tenantId: tenantIdNum,
					userId: Math.floor(Math.random() * 10) + 1,
					errorType,
					errorMessage,
					stackTrace: `Error: ${errorMessage}\n    at Function.${errorType} (/app/src/lib/error.ts:${
						Math.floor(Math.random() * 100) + 1
					}:${Math.floor(Math.random() * 50) + 1})`,
					endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
					metadata: {
						severity: Math.random() < 0.2 ? "critical" : "error",
					},
					resolved: Math.random() < 0.8, // 80% resolved
					createdAt: errorTime,
				});
			}
		}

		// Insert all data
		await prisma.userActivity.createMany({
			data: userActivityData,
		});

		await prisma.databaseActivity.createMany({
			data: databaseActivityData,
		});

		await prisma.systemMetrics.createMany({
			data: systemMetricsData,
		});

		await prisma.tenantUsage.createMany({
			data: tenantUsageData,
		});

		await prisma.apiUsage.createMany({
			data: apiUsageData,
		});

		await prisma.errorLog.createMany({
			data: errorLogData,
		});

		return NextResponse.json({
			message: "Analytics data seeded successfully",
			counts: {
				userActivities: userActivityData.length,
				databaseActivities: databaseActivityData.length,
				systemMetrics: systemMetricsData.length,
				tenantUsage: tenantUsageData.length,
				apiUsage: apiUsageData.length,
				errorLogs: errorLogData.length,
			},
		});
	} catch (error) {
		console.error("Analytics seed error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
