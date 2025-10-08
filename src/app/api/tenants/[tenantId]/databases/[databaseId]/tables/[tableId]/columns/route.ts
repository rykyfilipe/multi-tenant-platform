/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkTableEditPermission } from "@/lib/auth";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { z } from "zod";
import { colExists } from "@/lib/utils";
import { Column } from "@/types/database";
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';

// === VALIDARE ===
const ColumnSchema = z.object({
	name: z.string().min(1, "Name is mandatory"),
	type: z.enum([
		"string",
		"text", // Accept both "string" and "text" for compatibility
		"boolean",
		"number",
		"date",
		"reference",
		"customArray",
	]), // Remove the transform - keep "text" as "text"
	description: z.string().optional(), // Column description
	semanticType: z.string().optional(), // What this column represents (product_name, product_price, etc.)
	required: z.boolean().optional(),
	unique: z.boolean().optional(), // Unique constraint
	autoIncrement: z.boolean().optional(),
	referenceTableId: z.number().optional(), // doar pt type "reference"
	customOptions: z.array(z.string()).optional(), // doar pt type "customArray"
	defaultValue: z.string().optional(), // Default value for the column
	order: z.number().optional(), // Ordinea coloanei
	// New useful properties
	indexed: z.boolean().optional(), // Database index for performance
	searchable: z.boolean().optional(), // Include in global search
	hidden: z.boolean().optional(), // Hide from default views
	readOnly: z.boolean().optional(), // Prevent editing in UI
	validation: z.string().optional(), // Custom validation rules
	placeholder: z.string().optional(), // UI placeholder text
	helpText: z.string().optional(), // Help tooltip text
});

const ColumnsSchema = z.object({
	columns: z.array(ColumnSchema),
});

// === VALOARE IMPLICITĂ ===
const getDefaultValue = (
	columnType: string,
	required: boolean = false,
): unknown => {
	if (required) {
		switch (columnType) {
			case "string":
			case "text": // Handle both "string" and "text"
				return "";
			case "number":
				return 0;
			case "boolean":
				return false;
			case "date":
				return new Date().toISOString();
			case "reference":
				return null; // referințele încep goale
			case "customArray":
				return null; // customArray începe gol
			default:
				return "";
		}
	}
	return null;
};

// === ROUTA POST ===
export async function POST(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const { tenantId, databaseId, tableId } = await params;

	try {
		const body = await request.json();
		const parsedData = ColumnsSchema.parse(body);

		// Verificăm că baza de date există și aparține tenant-ului
		const database = await prisma.database.findFirst({
			where: {
				id: Number(databaseId),
				tenantId: Number(tenantId),
			},
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
			},
			include: {
				columns: true,
				rows: { select: { id: true } },
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Transform Prisma columns to match the expected Column interface
		const transformedColumns: Column[] = table.columns.map(
			(col: { referenceTableId: number | null }) => ({
				...col,
				referenceTableId: col.referenceTableId ?? undefined,
			}),
		);

	// Filtrăm coloanele care există deja (pentru a permite template-uri cu created_at)
	const columnsToCreate = parsedData.columns.filter((column) => {
		const exists = colExists(transformedColumns, column);
		if (exists) {
			console.log(`⚠️  [Column Creation] Skipping duplicate column: "${column.name}"`);
		}
		return !exists;
	});

	// Dacă toate coloanele există deja, returnăm success cu lista existentă
	if (columnsToCreate.length === 0) {
		return NextResponse.json(
			{ 
				message: "All columns already exist",
				columns: transformedColumns,
				skipped: parsedData.columns.map(c => c.name)
			}, 
			{ status: 200 }
		);
	}

	// Verificăm că tabelele de referință există
	for (const column of columnsToCreate) {
		if (column.type === "reference" && column.referenceTableId) {
				const referenceTable = await prisma.table.findUnique({
					where: { id: column.referenceTableId },
				});

				if (!referenceTable) {
					return NextResponse.json(
						{
							error: `Reference table with ID ${column.referenceTableId} not found.`,
						},
						{ status: 404 },
					);
				}
			}

		// Verificăm că coloanele customArray au opțiuni definite
		if (column.type === "customArray") {
			if (!column.customOptions || column.customOptions.length === 0) {
				return NextResponse.json(
					{
						error: `Column "${column.name}" of type customArray must have at least one custom option defined.`,
					},
					{ status: 400 },
				);
			}
		}
	}

	// Get all users in the tenant to create column permissions
		const users = await prisma.user.findMany({
			where: {
				tenantId: Number(tenantId),
			},
		});

		// Get the tenant's subscription plan to determine permissions
		const tenant = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
			include: { admin: true },
		});

		const subscriptionPlan = tenant?.admin?.subscriptionPlan || "Free";

	// Creăm doar coloanele care nu există deja
	const createdColumns = [];
	for (let i = 0; i < columnsToCreate.length; i++) {
		const columnData = columnsToCreate[i];

			// Calculăm ordinea - fie folosim ordinea specificată, fie o calculăm automat
			const order =
				columnData.order !== undefined
					? columnData.order
					: table.columns.length + i;

			const column = await prisma.column.create({
				data: {
					name: columnData.name,
					type: columnData.type,
					description: columnData.description || null,
					semanticType: columnData.semanticType || null,
					required: columnData.required || false,
					unique: columnData.unique || false,
					referenceTableId: columnData.referenceTableId || null,
					customOptions: columnData.customOptions || undefined,
					defaultValue: columnData.defaultValue || null,
					order: order,
					tableId: Number(tableId),
					// New properties - will need migration to add to schema
					// indexed: columnData.indexed || false,
					// searchable: columnData.searchable !== undefined ? columnData.searchable : true,
					// hidden: columnData.hidden || false,
					// readOnly: columnData.readOnly || false,
					// validation: columnData.validation || null,
					// placeholder: columnData.placeholder || null,
					// helpText: columnData.helpText || null,
				},
			});

			createdColumns.push(column);
		}

		// Create column permissions for all users in bulk (moved outside the loop)
		const allColumnPermissions = [];
		for (const column of createdColumns) {
			const columnPermissions = users.map((user: { id: number; role: string }) => ({
				userId: user.id,
				columnId: column.id,
				tableId: Number(tableId),
				tenantId: Number(tenantId),
				canRead: true,
				canEdit: subscriptionPlan === "Free" ? (user.role === "EDITOR" || user.role === "ADMIN" || user.role === "VIEWER") : (user.role === "ADMIN"),
			}));
			allColumnPermissions.push(...columnPermissions);
		}

		if (allColumnPermissions.length > 0) {
			await prisma.columnPermission.createMany({
				data: allColumnPermissions,
			});
		}

		// Adăugăm valori implicite pentru coloanele existente (moved outside the loop)
		if (table.rows.length > 0) {
			const allCells = [];
			for (const column of createdColumns) {
				const columnData = parsedData.columns.find(col => col.name === column.name);
				const cells = table.rows.map((row: { id: number }) => ({
					rowId: row.id,
					columnId: column.id,
					value: columnData?.defaultValue || getDefaultValue(column.type, column.required),
				}));
				allCells.push(...cells);
			}

			if (allCells.length > 0) {
				await prisma.cell.createMany({
					data: allCells,
				});
			}
		}

		return NextResponse.json(createdColumns, { status: 201 });
	} catch (error) {
		console.error("Error creating columns:", error);
		return NextResponse.json(
			{ error: "Failed to create columns" },
			{ status: 500 },
		);
	}
}

// === ROUTA GET ===
export async function GET(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const { tenantId, databaseId, tableId } = await params;

	// Try multiple authentication methods
	let userId: number | null = null;
	let tenantIdFromAuth: number | null = null;
	let role: string | null = null;

	// Method 1: Try NextAuth session
	const session = await getServerSession(authOptions);
	console.log('🔐 Columns Session check:', {
		hasSession: !!session,
		userId: session?.user?.id,
		tenantId: session?.user?.tenantId,
		email: session?.user?.email
	});

	if (session?.user?.id && session.user.tenantId) {
		userId = Number(session.user.id);
		tenantIdFromAuth = Number(session.user.tenantId);
		role = session.user.role || null;
		console.log('✅ Using NextAuth session for columns:', { userId, tenantId: tenantIdFromAuth, role });
	} else {
		// Method 2: Try JWT token from cookies (NextAuth format)
		console.log('🔍 Trying cookie-based authentication for columns...');
		try {
			const jwtToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
			if (jwtToken?.id && jwtToken?.tenantId) {
				userId = Number(jwtToken.id);
				tenantIdFromAuth = Number(jwtToken.tenantId);
				role = jwtToken.role || null;
				console.log('✅ Using cookie JWT token for columns:', { userId, tenantId: tenantIdFromAuth, role });
			}
		} catch (error) {
			console.log('❌ Cookie JWT token validation failed for columns:', error);
		}

		// Method 3: Try Authorization header as fallback
		if (!userId || !tenantIdFromAuth) {
			console.log('🔍 Trying Authorization header authentication for columns...');
			const authHeader = request.headers.get('authorization');
			if (authHeader?.startsWith('Bearer ')) {
				const token = authHeader.substring(7);
				try {
					// For custom JWT tokens, we need to decode them manually
					const jwt = require('jsonwebtoken');
					const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET);
					if (decoded?.userId || decoded?.id) {
						userId = decoded.userId || decoded.id;
						console.log('✅ Using custom JWT token for columns:', { userId });

						// Look up tenantId from user if not provided in token
						if (!tenantIdFromAuth && userId) {
							console.log('🔍 Looking up tenantId for user in columns:', userId);
							const user = await prisma.user.findUnique({
								where: { id: userId },
								select: { tenantId: true, role: true }
							});
							if (user?.tenantId) {
								tenantIdFromAuth = user.tenantId;
								role = user.role || null;
								console.log('✅ Found tenantId for columns:', tenantIdFromAuth, 'role:', role);
							}
						}
					}
				} catch (error) {
					console.log('❌ Custom JWT token validation failed for columns:', error);
				}
			}
		}
	}

	if (!userId || !tenantIdFromAuth) {
		console.log('❌ No valid authentication found for columns');
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check tenant access
	if (String(tenantIdFromAuth) !== tenantId) {
		console.log('❌ Tenant access denied for columns:', { userTenantId: tenantIdFromAuth, requestedTenantId: tenantId });
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		// Verificăm că baza de date există și aparține tenant-ului
		const database = await prisma.database.findFirst({
			where: {
				id: Number(databaseId),
				tenantId: Number(tenantId),
			},
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
			},
			include: {
				columns: true,
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Check table edit permissions for column operations instead of hard-coded role check
		const canEdit = await checkTableEditPermission(
			userId!,
			Number(tableId),
			Number(tenantId),
		);
		if (!canEdit)
			return NextResponse.json(
				{ error: "Insufficient permissions to edit columns in this table" },
				{ status: 403 },
			);

		// Verificăm permisiunile pentru utilizatorii non-admin
		if (role! !== "ADMIN") {
			const permission = await prisma.tablePermission.findFirst({
				where: {
					userId: userId!,
					tableId: Number(tableId),
					canRead: true,
				},
			});

			if (!permission) {
				return NextResponse.json({ error: "Access denied" }, { status: 403 });
			}
		}

		// Sortăm coloanele după ordine
		const sortedColumns = table.columns.sort(
			(a: { order: number }, b: { order: number }) => a.order - b.order,
		);
		return NextResponse.json(sortedColumns);
		} catch (error) {
			console.error("Error fetching columns:", error);
			return NextResponse.json(
				{ error: "Failed to fetch columns" },
				{ status: 500 },
			);
		}
	
}
