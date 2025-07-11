/** @format */

import prisma from "@/lib/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";
import { getUserFromRequest, verifyLogin } from "@/lib/auth";
import { User } from "@/types/user";

const userSchema = z.object({
	id: z.number().min(1, "ID must be a positive number"),
	email: z.string().email("Invalid email address"),
	firstName: z.string().min(4, "First name must be at least 4 characters"),
	lastName: z.string().min(4, "Last name must be at least 4 characters"),
	role: z.enum(["VIEWER", "EDITOR"]).default("VIEWER"),
});

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		// Authentication check
		const isLoggedIn = verifyLogin(request);
		if (!isLoggedIn) {
			return NextResponse.json(
				{ error: "Unauthorized: Please log in" },
				{ status: 401 },
			);
		}

		// Authorization check
		const userResult = await getUserFromRequest(request);
		if (userResult instanceof NextResponse) {
			return userResult;
		}

		const { userId, role } = userResult;
		if (role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Forbidden: Admin access required" },
				{ status: 403 },
			);
		}

		// Validate route params
		const { id } = await params;
		const userIdToUpdate = Number(id);
		if (isNaN(userIdToUpdate)) {
			return NextResponse.json(
				{ error: "Invalid user ID format" },
				{ status: 400 },
			);
		}	

		// Parse and validate request body
		const body = await request.json();
		const parsedData = userSchema.safeParse(body);

		if (!parsedData.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parsedData.error.flatten(),
				},
				{ status: 400 },
			);
		}

		// Verify the user exists and belongs to the admin's tenant
		const userExists = await prisma.user.findFirst({
			where: {
				id: userIdToUpdate,
				tenant: {
					adminId: userId,
				},
			},
			select: { id: true },
		});

		if (!userExists) {
			return NextResponse.json(
				{ error: "User not found or not in your tenant" },
				{ status: 404 },
			);
		}

		// Update the user
		const updatedUser = await prisma.user.update({
			where: { id: userIdToUpdate },
			data: {
				firstName: parsedData.data.firstName,
				lastName: parsedData.data.lastName,
				role: parsedData.data.role,
				email: parsedData.data.email,
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
			},
		});

		return NextResponse.json(updatedUser, { status: 200 });
	} catch (error) {
		console.error("Error in PATCH /api/users:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Validation error",
					details: error.flatten(),
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
