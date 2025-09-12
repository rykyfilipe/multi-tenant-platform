/** @format */

import { NextRequest, NextResponse } from "next/server";
import { backupSystem } from "@/lib/backup-system";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.tenantId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const tenantId = searchParams.get("tenantId") || session.user.tenantId;

		const backups = await backupSystem.listBackups(tenantId);
		return NextResponse.json({ backups });
	} catch (error) {
		console.error("Error fetching backups:", error);
		return NextResponse.json(
			{ error: "Failed to fetch backups" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.tenantId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { type, description, tenantId } = body;

		const backup = await backupSystem.createBackup(
			tenantId || session.user.tenantId,
			type,
			description,
			session.user.id
		);

		return NextResponse.json({ backup });
	} catch (error) {
		console.error("Error creating backup:", error);
		return NextResponse.json(
			{ error: "Failed to create backup" },
			{ status: 500 }
		);
	}
}
