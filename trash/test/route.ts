/** @format */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);

		return NextResponse.json({
			message: "NextAuth Test",
			session: session
				? {
						user: {
							id: session.user?.id,
							email: session.user?.email,
							name: session.user?.name,
						},
						expires: session.expires,
				  }
				: null,
			authWorking: true,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("NextAuth test error:", error);
		return NextResponse.json(
			{
				message: "NextAuth Test Failed",
				error: error instanceof Error ? error.message : "Unknown error",
				authWorking: false,
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
