/** @format */

import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
	//  const session = await getServerSession()
	// if (session) { }
}

export const config = {
	matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
