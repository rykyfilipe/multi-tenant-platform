/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { convertMBToBytes } from "@/lib/storage-utils";
import prisma from "@/lib/prisma";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
	try {
		// Verify authentication
		const sessionResult = await requireAuthResponse("ADMIN");
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}

		// Get user from session
		const userId = getUserId(sessionResult);
		const tenantId = sessionResult.user.tenantId;

		if (!tenantId) {
			return NextResponse.json({ error: "No tenant found" }, { status: 400 });
		}

		// Parse form data
		const formData = await request.formData();
		const logoFile = formData.get("logo") as File;

		if (!logoFile) {
			return NextResponse.json(
				{ error: "No logo file provided" },
				{ status: 400 },
			);
		}

		// Validate file type
		if (!logoFile.type.startsWith("image/")) {
			return NextResponse.json(
				{ error: "Invalid file type. Only images are allowed." },
				{ status: 400 },
			);
		}

		// Validate file size (max 5MB)
		if (logoFile.size > convertMBToBytes(5)) {
			return NextResponse.json(
				{ error: "File size too large. Maximum size is 5MB." },
				{ status: 400 },
			);
		}

		// Generate unique filename
		const timestamp = Date.now();
		const fileExtension = logoFile.name.split(".").pop();
		const fileName = `logo_${currentUser.tenantId}_${timestamp}.${fileExtension}`;

		// Convert file to buffer
		const bytes = await logoFile.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Upload to Cloudinary
		const uploadResult = await uploadImage(buffer, fileName, "logos");

		// Get the current tenant's logo to delete the old one
		const tenant = await prisma.tenant.findUnique({
			where: { id: currentUser.tenantId },
			select: { logoUrl: true },
		});

		// Delete old logo from Cloudinary if it exists
		if (tenant?.logoUrl && tenant.logoUrl.includes("cloudinary")) {
			try {
				// Extract public_id from the URL
				const urlParts = tenant.logoUrl.split("/");
				const publicId = urlParts[urlParts.length - 1].split(".")[0];
				await deleteImage(publicId);
			} catch (error) {
				console.error("Failed to delete old logo:", error);
				// Continue with the upload even if deletion fails
			}
		}

		// Update tenant logo in database
		await prisma.tenant.update({
			where: { id: currentUser.tenantId },
			data: { logoUrl: uploadResult.secure_url },
		});

		return NextResponse.json({
			success: true,
			logoUrl: uploadResult.secure_url,
			message: "Logo uploaded successfully",
		});
	} catch (error) {
		console.error("Logo upload error:", error);

		// Provide more specific error messages
		let errorMessage = "Failed to upload logo";
		if (error instanceof Error) {
			if (error.message.includes("Cloudinary is not configured")) {
				errorMessage =
					"Image upload service is not configured. Please contact support.";
			} else if (error.message.includes("Upload failed")) {
				errorMessage = "Image upload failed. Please try again.";
			} else {
				errorMessage = error.message;
			}
		}

		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
