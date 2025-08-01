/** @format */

"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function OAuthGoogleLogin() {
	const [loading, setLoading] = useState(false);

	const handleGoogleSignIn = async () => {
		setLoading(true);
		try {
			// Pornește procesul de autentificare Google
			await signIn("google", { callbackUrl: "/home" });
		} catch (error) {
			console.error("Google sign in error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex justify-center'>
			<Button
				onClick={handleGoogleSignIn}
				disabled={loading}
				className='w-full max-w-xs'>
				{loading ? "Redirecting..." : "Sign in with Google"}
			</Button>
		</div>
	);
}
