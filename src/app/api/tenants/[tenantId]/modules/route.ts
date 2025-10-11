/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import prisma, { invalidateCacheByTags } from "@/lib/prisma";
import {
	createModuleTables,
	removeModuleTables,
	hasModuleTables,
} from "@/lib/moduleTables";
import { getModuleDefinition, isModuleEnabled } from "@/lib/modules";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	try {
		const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);
		const { tenantId } = await params;

		// Verify user belongs to this tenant
		const userRecord = await prisma.user.findUnique({
			where: { id: userId },
			select: { tenantId: true },
		});

		if (!userRecord || userRecord.tenantId !== parseInt(tenantId)) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Get tenant with enabled modules
		const tenant = await prisma.tenant.findUnique({
			where: { id: parseInt(tenantId) },
			select: { enabledModules: true },
		});

		if (!tenant) {
			return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
		}

		// Get module status for each database
		const databases = await prisma.database.findMany({
			where: { tenantId: parseInt(tenantId) },
			select: { id: true, name: true },
		});

		const modulesStatus = await Promise.all(
			databases.map(async (database: any) => {
				const billingEnabled = await hasModuleTables(database.id, "billing");

				return {
					databaseId: database.id,
					databaseName: database.name,
					modules: {
						billing: {
							enabled: billingEnabled,
							available: true,
						},
						// Future modules can be added here
					},
				};
			}),
		);

		return NextResponse.json({
			enabledModules: tenant.enabledModules,
			modulesStatus,
		});
	} catch (error) {
		console.error("Error fetching modules:", error);
		return NextResponse.json(
			{ error: "Failed to fetch modules" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	try {
		const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);
	const role = sessionResult.user.role;
		const { tenantId } = await params;

		// Only admins can manage modules
		if (role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Only administrators can manage modules" },
				{ status: 403 },
			);
		}

		// Verify user belongs to this tenant
		const userRecord2 = await prisma.user.findUnique({
			where: { id: userId },
			select: { tenantId: true },
		});

		if (!userRecord2 || userRecord2.tenantId !== parseInt(tenantId)) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const { moduleId, action, databaseId } = body;

		if (!moduleId || !action || !databaseId) {
			return NextResponse.json(
				{ error: "Missing required fields: moduleId, action, databaseId" },
				{ status: 400 },
			);
		}

		// Verify module exists
		const moduleDefinition = getModuleDefinition(moduleId);
		if (!moduleDefinition) {
			return NextResponse.json(
				{ error: `Module '${moduleId}' not found` },
				{ status: 400 },
			);
		}

		// Verify database exists and belongs to tenant
		const database = await prisma.database.findUnique({
			where: {
				id: parseInt(databaseId),
				tenantId: parseInt(tenantId),
			},
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found or access denied" },
				{ status: 404 },
			);
		}

		if (action === "enable") {
			// Check if module is already enabled
			const alreadyEnabled = await hasModuleTables(
				parseInt(databaseId),
				moduleId,
			);
			if (alreadyEnabled) {
				return NextResponse.json(
					{
						error: `Module '${moduleId}' is already enabled for this database`,
					},
					{ status: 400 },
				);
			}

			// For billing module, validate that tenant has complete billing details
			if (moduleId === "billing") {
				const tenantDetails = await prisma.tenant.findUnique({
					where: { id: parseInt(tenantId) },
					select: {
						companyTaxId: true,
						registrationNumber: true,
						companyStreet: true,
						companyStreetNumber: true,
						companyCity: true,
						companyCountry: true,
						companyPostalCode: true,
					},
				});

				if (!tenantDetails) {
					return NextResponse.json(
						{ error: "Tenant not found" },
						{ status: 404 },
					);
				}

				// Check if all required billing fields are filled
				const requiredFields = [
					'companyTaxId',
					'registrationNumber', 
					'companyStreet',
					'companyStreetNumber',
					'companyCity',
					'companyCountry',
					'companyPostalCode'
				];

				const missingFields = requiredFields.filter(field => 
					!tenantDetails[field as keyof typeof tenantDetails] || 
					tenantDetails[field as keyof typeof tenantDetails] === ''
				);

				if (missingFields.length > 0) {
					return NextResponse.json(
						{
							error: "Billing details are incomplete. Please complete the billing information in tenant settings before enabling the invoices module.",
							missingFields,
							details: "The following fields are required: Company Tax ID, Registration Number, Company Street, Company Street Number, Company City, Company Country, and Company Postal Code."
						},
						{ status: 400 },
					);
				}
			}

			// Create module tables
			const createdTablesMap = await createModuleTables(parseInt(databaseId), moduleId);

			// Invalidate cache for database and table operations
			invalidateCacheByTags(["database", "table", "tableList", "databaseList"]);

			// Get the created tables with full details
			const tableIds = Object.values(createdTablesMap).map((table: any) => table.id);
			const createdTables = await prisma.table.findMany({
				where: {
					id: { in: tableIds },
				},
				include: {
					columns: true,
					_count: {
						select: {
							rows: true,
						},
					},
				},
			});

			// Update tenant enabled modules
			await prisma.tenant.update({
				where: { id: parseInt(tenantId) },
				data: {
					enabledModules: {
						push: moduleId,
					},
				},
			});

			return NextResponse.json({
				message: `Module '${moduleId}' enabled successfully`,
				moduleId,
				databaseId: parseInt(databaseId),
				createdTables, // Return the created tables
			});
		} else if (action === "disable") {
			// Check if module is enabled
			const isEnabled = await hasModuleTables(parseInt(databaseId), moduleId);
			if (!isEnabled) {
				return NextResponse.json(
					{ error: `Module '${moduleId}' is not enabled for this database` },
					{ status: 400 },
				);
			}

			// Get tables that will be removed before removing them
			const tablesToRemove = await prisma.table.findMany({
				where: {
					databaseId: parseInt(databaseId),
					isProtected: true,
					protectedType: { in: ["customers", "invoices", "invoice_items"] },
				},
				select: { id: true, name: true },
			});

			// Remove module tables
			await removeModuleTables(parseInt(databaseId), moduleId);

			// Invalidate cache for database and table operations
			invalidateCacheByTags(["database", "table", "tableList", "databaseList"]);
			
			// Small delay to ensure cache invalidation propagates
			await new Promise(resolve => setTimeout(resolve, 100));

			// Check if module is still used in other databases
			const otherDatabases = await prisma.database.findMany({
				where: {
					tenantId: parseInt(tenantId),
					id: { not: parseInt(databaseId) },
				},
			});

			const stillUsed = await Promise.all(
				otherDatabases.map((db: any) => hasModuleTables(db.id, moduleId)),
			);

			// If module is not used anywhere else, remove from enabled modules
			if (!stillUsed.some((used:any) => used)) {
				await prisma.tenant.update({
					where: { id: parseInt(tenantId) },
					data: {
						enabledModules: {
							set:
								(
									await prisma.tenant.findUnique({
										where: { id: parseInt(tenantId) },
										select: { enabledModules: true },
									})
								)?.enabledModules.filter((m: any) => m !== moduleId) || [],
						},
					},
				});
			}

			return NextResponse.json({
				message: `Module '${moduleId}' disabled successfully`,
				moduleId,
				databaseId: parseInt(databaseId),
				removedTables: tablesToRemove, // Return removed tables for local state update
			});
		} else {
			return NextResponse.json(
				{ error: "Invalid action. Use 'enable' or 'disable'" },
				{ status: 400 },
			);
		}
	} catch (error: any) {
		console.error("Error managing module:", error);
		
		// Handle specific error cases
		if (error.message?.includes('Invoice tables already exist')) {
			return NextResponse.json(
				{ 
					error: "Tables already exist", 
					message: "Invoice tables are already created for this database. Please refresh the page." 
				},
				{ status: 409 }, // Conflict
			);
		}
		
		return NextResponse.json(
			{ 
				error: "Failed to manage module",
				details: error.message || "Unknown error occurred"
			},
			{ status: 500 },
		);
	}
}
