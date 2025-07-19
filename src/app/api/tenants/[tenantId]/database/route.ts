/** @format */

import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const database = await prisma.database.findFirst({
			where: {
				tenant: {
					id: Number(tenantId),
				},
			},
			include: {
				tenant: true,
				tables: {
					include: {
						rows: true,
						columns: true,
					},
				},
			},
		});
		return NextResponse.json(database, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch databases" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const tenant = await prisma.tenant.findUnique({
			where: { id: Number(tenantId) },
		});

		if (!tenant || tenant.adminId !== userId) {
			return NextResponse.json(
				{ error: "Tenant not found or you are not the admin of this tenant" },
				{ status: 403 },
			);
		}

		// Verificăm dacă deja are un Database
		const existingDatabase = await prisma.database.findUnique({
			where: { tenantId: tenant.id },
		});

		if (existingDatabase) {
			return NextResponse.json(
				{ error: "Tenant already has a database" },
				{ status: 400 },
			);
		}

		// Creăm Database-ul
		const newDatabase = await prisma.database.create({
			data: {
				tenantId: tenant.id,
			},
		});

		return NextResponse.json(newDatabase, { status: 201 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to create database" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (role !== "ADMIN" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const existingDatabase = await prisma.database.findUnique({
			where: { tenantId: Number(tenantId) },
		});

		if (existingDatabase) {
			return NextResponse.json(
				{ error: "Tenant already has a database" },
				{ status: 400 },
			);
		}

		await prisma.database.deleteMany({
			where: {
				tenant: {
					adminId: userId,
				},
			},
		});

		return NextResponse.json({ message: "Database deleted!" }, { status: 200 });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch databases" },
			{ status: 500 },
		);
	}
}
