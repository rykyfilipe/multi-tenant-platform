/** @format */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [debugInfo, setDebugInfo] = useState<any>(null);

	useEffect(() => {
		// Check for error parameters in URL
		const errorParam = searchParams.get("error");
		const errorDescription = searchParams.get("error_description");

		if (errorParam) {
			setError(errorDescription || errorParam);
			console.error("Auth callback error:", errorParam, errorDescription);
		}

		// Get debug info in development
		if (process.env.NODE_ENV === "development") {
			fetch("/api/auth/debug")
				.then((res) => res.json())
				.then((data) => setDebugInfo(data))
				.catch((err) => console.error("Failed to get debug info:", err));
		}
	}, [searchParams]);

	useEffect(() => {
		if (status === "loading") {
			// Still loading, wait
			return;
		}

		if (status === "authenticated" && session) {
			// User is authenticated, redirect to analytics
			console.log("User authenticated, redirecting to dashboard", {
				user: session.user?.email,
				tenantId: session.user?.tenantId,
				role: session.user?.role
			});
			
			// Add a small delay for mobile browsers to ensure proper redirect
			const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			const delay = isMobile ? 500 : 100;
			
			setTimeout(() => {
				router.replace("/home/analytics");
			}, delay);
		} else if (status === "unauthenticated") {
			// User is not authenticated, redirect to home
			console.log("User not authenticated, redirecting to home");
			
			// Add a small delay for mobile browsers
			const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			const delay = isMobile ? 500 : 100;
			
			setTimeout(() => {
				router.replace("/");
			}, delay);
		}
	}, [session, status, router]);

	// Show error state if there's an error
	if (error) {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center'>
				<div className='text-center max-w-md mx-auto p-6'>
					<div className='text-red-500 text-6xl mb-4'>⚠️</div>
					<h1 className='text-2xl font-bold text-foreground mb-2'>
						Authentication Error
					</h1>
					<p className='text-muted-foreground mb-4'>{error}</p>
					<button
						onClick={() => router.push("/")}
						className='bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors'>
						Return to Home
					</button>
					{debugInfo && (
						<details className='mt-4 text-left'>
							<summary className='cursor-pointer text-sm text-muted-foreground'>
								Debug Info
							</summary>
							<pre className='text-xs bg-muted p-2 rounded mt-2 overflow-auto'>
								{JSON.stringify(debugInfo, null, 2)}
							</pre>
						</details>
					)}
				</div>
			</div>
		);
	}

	// Show loading state while checking authentication
	return (
		<div className='min-h-screen bg-background flex items-center justify-center'>
			<div className='text-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
				<p className='text-muted-foreground'>Completing authentication...</p>
				{debugInfo && (
					<details className='mt-4 text-left max-w-md mx-auto'>
						<summary className='cursor-pointer text-sm text-muted-foreground'>
							Debug Info
						</summary>
						<pre className='text-xs bg-muted p-2 rounded mt-2 overflow-auto'>
							{JSON.stringify(debugInfo, null, 2)}
						</pre>
					</details>
				)}
			</div>
		</div>
	);
}
