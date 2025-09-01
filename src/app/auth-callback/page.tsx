/** @format */

"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "loading") {
			// Still loading, wait
			return;
		}

		if (status === "authenticated" && session) {
			// User is authenticated, redirect to analytics
			router.replace("/home/analytics");
		} else if (status === "unauthenticated") {
			// User is not authenticated, redirect to home
			router.replace("/");
		}
	}, [session, status, router]);

	// Show loading state while checking authentication
	return (
		<div className='min-h-screen bg-background flex items-center justify-center'>
			<div className='text-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
				<p className='text-muted-foreground'>Completing authentication...</p>
			</div>
		</div>
	);
}
