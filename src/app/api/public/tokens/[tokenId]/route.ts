/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ tokenId: string }> },
) {
	try {
		const { tokenId } = await params;

		// Delete the token
		const deletedToken = await prisma.apiToken.delete({
			where: { id: tokenId },
		});
		return NextResponse.json({ status: 200 });
	} catch (err) {
		console.error("Error updating row:", err);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
