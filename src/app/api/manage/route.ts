/** @format */

// /app/api/users/delete-all/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ajustează dacă ai alt path

export async function DELETE() {
	try {
		await prisma.user.deleteMany({});
		return NextResponse.json({ message: "All tenants deleted successfully" });
	} catch (error) {
		console.error("Error deleting users:", error);
		return NextResponse.json(
			{ error: "Failed to delete users" },
			{ status: 500 },
		);
	}
}
