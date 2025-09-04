/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/error-logger";

/**
 * GDPR Data Export Endpoint
 * Exports all user data in a structured format
 */
export async function GET(request: NextRequest) {
	try {
		const sessionResult = await requireAuthResponse();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const { user } = sessionResult;

		// Log data export request
		logger.info("GDPR data export requested", {
			component: "GDPRExport",
			userId: user.id,
			ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
		});

		// Collect all user data
		const userData = {
			personalInformation: {
				id: user.id,
				email: user.email,
				name: user.name,
				image: user.image,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
			tenantInformation: null as any,
			databases: [] as any[],
			tables: [] as any[],
			rows: [] as any[],
			activityLogs: [] as any[],
			subscriptionData: null as any,
			preferences: null as any,
		};

		// Get tenant information
		if (user.tenantId) {
			const tenant = await prisma.tenant.findUnique({
				where: { id: user.tenantId },
				include: {
					subscription: true,
					settings: true,
				},
			});

			if (tenant) {
				userData.tenantInformation = {
					id: tenant.id,
					name: tenant.name,
					slug: tenant.slug,
					logo: tenant.logo,
					description: tenant.description,
					createdAt: tenant.createdAt,
					updatedAt: tenant.updatedAt,
					subscription: tenant.subscription,
					settings: tenant.settings,
				};

				// Get databases
				const databases = await prisma.database.findMany({
					where: { tenantId: tenant.id },
					include: {
						tables: {
							include: {
								columns: true,
								rows: {
									take: 1000, // Limit for export
									orderBy: { createdAt: "desc" },
								},
							},
						},
					},
				});

				userData.databases = databases.map(db => ({
					id: db.id,
					name: db.name,
					description: db.description,
					createdAt: db.createdAt,
					updatedAt: db.updatedAt,
					tables: db.tables.map(table => ({
						id: table.id,
						name: table.name,
						description: table.description,
						createdAt: table.createdAt,
						updatedAt: table.updatedAt,
						columns: table.columns,
						rowCount: table.rows.length,
						sampleRows: table.rows.slice(0, 10), // Sample of recent rows
					})),
				}));

				// Flatten tables and rows for separate sections
				userData.tables = databases.flatMap(db => 
					db.tables.map(table => ({
						databaseId: db.id,
						databaseName: db.name,
						...table,
					}))
				);

				userData.rows = databases.flatMap(db => 
					db.tables.flatMap(table => 
						table.rows.map(row => ({
							databaseId: db.id,
							databaseName: db.name,
							tableId: table.id,
							tableName: table.name,
							...row,
						}))
					)
				);
			}
		}

		// Get activity logs (if available)
		try {
			const activityLogs = await prisma.activityLog.findMany({
				where: { userId: user.id },
				orderBy: { createdAt: "desc" },
				take: 1000, // Limit for export
			});
			userData.activityLogs = activityLogs;
		} catch (err) {
			// Activity logs might not be available in all setups
			logger.warn("Activity logs not available for export", {
				component: "GDPRExport",
				userId: user.id,
			});
		}

		// Get user preferences
		try {
			const preferences = await prisma.userPreference.findMany({
				where: { userId: user.id },
			});
			userData.preferences = preferences;
		} catch (err) {
			// Preferences might not be available in all setups
			logger.warn("User preferences not available for export", {
				component: "GDPRExport",
				userId: user.id,
			});
		}

		// Create export metadata
		const exportMetadata = {
			exportDate: new Date().toISOString(),
			userId: user.id,
			userEmail: user.email,
			exportVersion: "1.0",
			dataTypes: [
				"personalInformation",
				"tenantInformation", 
				"databases",
				"tables",
				"rows",
				"activityLogs",
				"subscriptionData",
				"preferences"
			],
			recordCounts: {
				databases: userData.databases.length,
				tables: userData.tables.length,
				rows: userData.rows.length,
				activityLogs: userData.activityLogs.length,
			},
		};

		// Create the complete export
		const exportData = {
			metadata: exportMetadata,
			data: userData,
		};

		// Log successful export
		logger.info("GDPR data export completed", {
			component: "GDPRExport",
			userId: user.id,
			recordCounts: exportMetadata.recordCounts,
		});

		// Return as downloadable JSON file
		const filename = `user-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
		
		return new NextResponse(JSON.stringify(exportData, null, 2), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Cache-Control": "no-cache, no-store, must-revalidate",
			},
		});

	} catch (error) {
		logger.error("Failed to export user data", error as Error, {
			component: "GDPRExport",
		});

		return NextResponse.json(
			{ error: "Failed to export user data" },
			{ status: 500 }
		);
	}
}
