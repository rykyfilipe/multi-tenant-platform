/** @format */

import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		message: "NextAuth Debug Information",
		environment: {
			NODE_ENV: process.env.NODE_ENV,
			NEXTAUTH_URL: process.env.NEXTAUTH_URL,
			NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
			GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
			GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
				? "Set"
				: "Not set",
		},
		nextAuth: {
			version: "v4",
			trustHost: true,
		},
		timestamp: new Date().toISOString(),
	});
}
