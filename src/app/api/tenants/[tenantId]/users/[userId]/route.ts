/** @format */

import prisma from "@/lib/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { id } from "date-fns/locale";
import { Numans } from "next/font/google";

// Schema generică pentru body: acceptă un singur câmp cu orice valoare validă
const userUpdateSchema = z.record(z.any());

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; userId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId, userId: userIdToUpdate } = await params;

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	// Verifică că user-ul curent este admin și membru în tenant
	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (!isMember || role !== "ADMIN")
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		// Parsează body generic
		const body = await request.json();
		const parsedData = userUpdateSchema.safeParse(body);

		if (!parsedData.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parsedData.error.flatten(),
				},
				{ status: 400 },
			);
		}

		// Validate fields: opțional poți valida doar câmpurile acceptate
		const allowedFields = ["firstName", "lastName", "email", "role"];
		const fieldsToUpdate = Object.keys(parsedData.data);

		const invalidFields = fieldsToUpdate.filter(
			(f) => !allowedFields.includes(f),
		);
		if (invalidFields.length > 0) {
			return NextResponse.json(
				{
					error: `Invalid fields: ${invalidFields.join(", ")}`,
				},
				{ status: 400 },
			);
		}

		// Verifică că userul există și e în tenant-ul adminului
		const userExists = await prisma.user.findFirst({
			where: {
				id: Number(userIdToUpdate),
				tenant: {
					adminId: userId,
				},
			},
		});

		if (!userExists) {
			return NextResponse.json(
				{ error: "User not found or not in your tenant" },
				{ status: 404 },
			);
		}

		// Actualizează user-ul cu câmpurile dinamice
		const updatedUser = await prisma.user.update({
			where: { id: Number(userIdToUpdate) },
			data: parsedData.data,
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

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ tenantId: string; userId: string }> },
) {
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { tenantId, userId: userIdToDelete } = await params;
	const userResult = await getUserFromRequest(request);

	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));

	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const user = await prisma.user.findUnique({
			where: {
				tenantId: Number(tenantId),
				id: Number(userIdToDelete),
			},
		});

		if (!user)
			return NextResponse.json({ error: "User not found" }, { status: 404 });

		// Check if user is trying to delete themselves
		if (Number(userIdToDelete) === userId) {
			// Allow self-deletion for both admin and regular users
			const tenant = await prisma.tenant.findFirst({
				where: {
					users: {
						some: {
							id: user.id,
						},
					},
				},
			});

			// Check if user is admin of a tenant
			if (user.role === "ADMIN" && tenant) {
				// For admin users, we need to delete the entire tenant and all associated data
				// This will cascade delete all databases, tables, rows, cells, permissions, etc.
				await prisma.tenant.delete({
					where: {
						id: tenant.id,
					},
				});
			} else {
				// For regular users, just delete the user
				await prisma.user.delete({
					where: {
						id: Number(userIdToDelete),
					},
				});
			}
		} else {
			// Admin is deleting another user from their tenant
			if (user.role === "ADMIN") {
				// If deleting another admin, delete the entire tenant
				const tenant = await prisma.tenant.findFirst({
					where: {
						users: {
							some: {
								id: user.id,
							},
						},
					},
				});
				
				if (tenant) {
					await prisma.tenant.delete({
						where: {
							id: tenant.id,
						},
					});
				}
			} else {
				// For regular users, just delete the user
				await prisma.user.delete({
					where: {
						id: Number(userIdToDelete),
					},
				});
			}
		}

		return NextResponse.json({ status: 200 });
	} catch (error) {
		console.error("Error fetching tenant:", error);
		return NextResponse.json(
			{ error: "Failed to fetch tenant" },
			{ status: 500 },
		);
	}
}
