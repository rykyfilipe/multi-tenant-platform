/** @format */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
	const token = request.cookies.get("token")?.value;
	const pathname = request.nextUrl.pathname;

	if ((pathname === "/" || pathname.startsWith("/auth")) && token) {
		return NextResponse.redirect(new URL("/home", request.url));
	}
	if (!token) {
		if (pathname.startsWith("/home")) {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
