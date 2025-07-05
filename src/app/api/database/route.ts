/** @format */

import { getUserId, isAdmin, verifyLogin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: Request) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = getUserId(request);
	if (!userId) {
		return NextResponse.json({ error: "User ID not found" }, { status: 400 });
	}

	const user = await prisma.user.findUnique({
		where: { id: Number(userId) },
	});

	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	try {
		const databases = await prisma.database.findMany({
			where: {
				tenant: {
					adminId: user.id,
				},
			},
			include: {
				tenant: true,
				tables: true,
			},
		});
		return NextResponse.json(databases);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch databases" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	const logged = verifyLogin(request);
	const admin = isAdmin(request);

	if (!logged || !admin) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = getUserId(request);

	const user = await prisma.user.findUnique({
		where: { id: Number(userId) },
	});

	if (!user || user.role !== "ADMIN") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	try {
		const tenantId = Number(user.tenantId);

		// Verificăm dacă Tenant-ul există și aparține user-ului admin
		const tenant = await prisma.tenant.findUnique({
			where: { id: tenantId },
		});

		if (!tenant || tenant.adminId !== user.id) {
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
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to create database" },
			{ status: 500 },
		);
	}
}
