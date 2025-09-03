/** @format */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";

interface MobileOAuthHandlerProps {
	onSuccess?: () => void;
	onError?: (error: string) => void;
}

export default function MobileOAuthHandler({ onSuccess, onError }: MobileOAuthHandlerProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isHandling, setIsHandling] = useState(false);

	useEffect(() => {
		const handleMobileOAuth = async () => {
			// Check if we're on mobile
			const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
			const isInApp = /wv|WebView/.test(navigator.userAgent);

			if (!isMobile) return;

			setIsHandling(true);

			try {
				// Check for OAuth callback parameters
				const code = searchParams.get("code");
				const state = searchParams.get("state");
				const error = searchParams.get("error");

				if (error) {
					console.error("OAuth error in mobile handler:", error);
					onError?.(error);
					return;
				}

				if (code && state) {
					// We're in the middle of an OAuth flow
					console.log("Handling OAuth callback on mobile");
					
					// Wait a bit for the session to be established
					await new Promise(resolve => setTimeout(resolve, 1000));
					
					// Check if we have a valid session
					const session = await getSession();
					if (session) {
						console.log("Mobile OAuth successful, redirecting");
						onSuccess?.();
						router.replace("/home/analytics");
					} else {
						console.error("No session found after OAuth callback");
						onError?.("Authentication failed");
					}
				}
			} catch (error) {
				console.error("Mobile OAuth handler error:", error);
				onError?.(error instanceof Error ? error.message : "Unknown error");
			} finally {
				setIsHandling(false);
			}
		};

		handleMobileOAuth();
	}, [searchParams, router, onSuccess, onError]);

	// This component doesn't render anything visible
	return null;
}

// Hook for mobile OAuth detection and handling
export function useMobileOAuth() {
	const [isMobile, setIsMobile] = useState(false);
	const [isIOS, setIsIOS] = useState(false);
	const [isInApp, setIsInApp] = useState(false);

	useEffect(() => {
		const userAgent = navigator.userAgent;
		const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
		const ios = /iPad|iPhone|iPod/.test(userAgent);
		const inApp = /wv|WebView/.test(userAgent);

		setIsMobile(mobile);
		setIsIOS(ios);
		setIsInApp(inApp);
	}, []);

	const handleMobileSignIn = async (provider: string) => {
		if (!isMobile) {
			// Use regular signIn for desktop
			return signIn(provider, { callbackUrl: "/auth-callback" });
		}

		// Mobile-specific handling
		try {
			// For mobile, we might need to open in the same window
			const result = await signIn(provider, {
				callbackUrl: "/auth-callback",
				redirect: false, // Handle redirect manually
			});

			if (result?.error) {
				throw new Error(result.error);
			}

			// For mobile, redirect manually
			if (result?.url) {
				window.location.href = result.url;
			}
		} catch (error) {
			console.error("Mobile sign-in error:", error);
			throw error;
		}
	};

	return {
		isMobile,
		isIOS,
		isInApp,
		handleMobileSignIn,
	};
}
