/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const image = formData.get("image") as File;
		const userId = formData.get("userId") as string;

		if (!image || !userId) {
			return NextResponse.json(
				{ error: "Image and userId are required" },
				{ status: 400 }
			);
		}

		// Validate file type
		if (!image.type.startsWith("image/")) {
			return NextResponse.json(
				{ error: "File must be an image" },
				{ status: 400 }
			);
		}

		// Validate file size (max 5MB)
		if (image.size > 5 * 1024 * 1024) {
			return NextResponse.json(
				{ error: "File size must be less than 5MB" },
				{ status: 400 }
			);
		}

		// Verify user exists and current user has permission
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			select: { id: true, email: true, tenantId: true },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Check if current user is admin or the same user
		const currentUser = await prisma.user.findUnique({
			where: { email: session.user.email },
			select: { id: true, role: true, tenantId: true },
		});

		if (!currentUser) {
			return NextResponse.json({ error: "Current user not found" }, { status: 404 });
		}

		// Only allow users to update their own profile image
		if (currentUser.id !== user.id) {
			return NextResponse.json({ error: "You can only update your own profile image" }, { status: 403 });
		}

		// Create uploads directory if it doesn't exist
		const uploadsDir = join(process.cwd(), "public", "uploads", "profiles");
		if (!existsSync(uploadsDir)) {
			await mkdir(uploadsDir, { recursive: true });
		}

		// Generate unique filename
		const timestamp = Date.now();
		const fileExtension = image.name.split(".").pop();
		const fileName = `profile_${userId}_${timestamp}.${fileExtension}`;
		const filePath = join(uploadsDir, fileName);

		// Convert file to buffer and save
		const bytes = await image.arrayBuffer();
		const buffer = Buffer.from(bytes);
		await writeFile(filePath, buffer);

		// Generate public URL
		const imageUrl = `/uploads/profiles/${fileName}`;

		// Update user profile in database
		await prisma.user.update({
			where: { id: parseInt(userId) },
			data: { profileImage: imageUrl },
		});

		return NextResponse.json({
			message: "Profile image uploaded successfully",
			imageUrl,
		});
	} catch (error) {
		console.error("Profile image upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload profile image" },
			{ status: 500 }
		);
	}
} 