/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

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
				{ status: 400 },
			);
		}

		// Validate file type
		if (!image.type.startsWith("image/")) {
			return NextResponse.json(
				{ error: "File must be an image" },
				{ status: 400 },
			);
		}

		// Validate file size (max 5MB)
		if (image.size > 5 * 1024 * 1024) {
			return NextResponse.json(
				{ error: "File size must be less than 5MB" },
				{ status: 400 },
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
			return NextResponse.json(
				{ error: "Current user not found" },
				{ status: 404 },
			);
		}

		// Only allow users to update their own profile image
		if (currentUser.id !== user.id) {
			return NextResponse.json(
				{ error: "You can only update your own profile image" },
				{ status: 403 },
			);
		}

		// Generate unique filename
		const timestamp = Date.now();
		const fileExtension = image.name.split(".").pop();
		const fileName = `profile_${userId}_${timestamp}.${fileExtension}`;

		// Convert file to buffer
		const bytes = await image.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Upload to Cloudinary
		const uploadResult = await uploadImage(buffer, fileName, "profiles");

		// Get the current user's profile image to delete the old one
		const currentUser = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			select: { profileImage: true },
		});

		// Delete old profile image from Cloudinary if it exists
		if (
			currentUser?.profileImage &&
			currentUser.profileImage.includes("cloudinary")
		) {
			try {
				// Extract public_id from the URL
				const urlParts = currentUser.profileImage.split("/");
				const publicId = urlParts[urlParts.length - 1].split(".")[0];
				await deleteImage(publicId);
			} catch (error) {
				console.error("Failed to delete old profile image:", error);
				// Continue with the upload even if deletion fails
			}
		}

		// Update user profile in database
		await prisma.user.update({
			where: { id: parseInt(userId) },
			data: { profileImage: uploadResult.secure_url },
		});

		return NextResponse.json({
			message: "Profile image uploaded successfully",
			imageUrl: uploadResult.secure_url,
		});
	} catch (error) {
		console.error("Profile image upload error:", error);
		
		// Provide more specific error messages
		let errorMessage = "Failed to upload profile image";
		if (error instanceof Error) {
			if (error.message.includes('Cloudinary is not configured')) {
				errorMessage = "Image upload service is not configured. Please contact support.";
			} else if (error.message.includes('Upload failed')) {
				errorMessage = "Image upload failed. Please try again.";
			} else {
				errorMessage = error.message;
			}
		}
		
		return NextResponse.json(
			{ error: errorMessage },
			{ status: 500 },
		);
	}
}
