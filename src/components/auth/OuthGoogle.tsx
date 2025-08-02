/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

export default function OAuthGoogleLogin() {
	const [loading, setLoading] = useState(false);

	const handleGoogleSignIn = async () => {
		setLoading(true);
		try {
			await signIn("google", { callbackUrl: "/" });
		} catch (error) {
			console.error("Google sign in error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex flex-col items-center space-y-4 w-full'>
			<Button
				onClick={handleGoogleSignIn}
				disabled={loading}
				variant='outline'
				className='w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-100 transition-all'>
				<FcGoogle size={22} />
				{loading ? "Redirecting..." : "Continue with Google"}
			</Button>

			<div className='relative w-full flex items-center justify-center'>
				<div className='absolute w-full h-px bg-gray-200'></div>
				<span className='bg-white px-3 text-gray-400 text-sm z-10'>or</span>
			</div>
		</div>
	);
}
