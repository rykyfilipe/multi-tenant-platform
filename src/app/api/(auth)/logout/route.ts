/** @format */
import { NextResponse } from "next/server";

export async function POST() {
	try {
		return new NextResponse(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				"Set-Cookie":
					"token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
				"Content-Type": "application/json",
			},
		});
	} catch {
		return new NextResponse(
			JSON.stringify({ success: false, error: "Logout failed" }),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}
