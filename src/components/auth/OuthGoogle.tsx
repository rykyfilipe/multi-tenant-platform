/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useLanguage } from "@/contexts/LanguageContext";

interface OAuthGoogleLoginProps {
	closeForm: (x: boolean) => void;
}

export default function OAuthGoogleLogin({ closeForm }: OAuthGoogleLoginProps) {
	const { t } = useLanguage();
	const [loading, setLoading] = useState(false);

	const handleGoogleSignIn = async () => {
		setLoading(true);
		try {
			const result = await signIn("google", {
				callbackUrl: "/home/dashboard",
				redirect: true,
			});

			// If we get here, there was an error
			if (result?.error) {
				console.error("Google sign-in error:", result.error);
				alert(t("oauth.google.error"));
			}
		} catch (error) {
			console.error("Google sign-in error:", error);
			alert(t("oauth.google.error"));
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
				className='w-full flex items-center justify-center gap-3 border border-border hover:bg-muted transition-all'>
				<FcGoogle size={22} />
				{loading
					? t("oauth.google.redirecting")
					: t("oauth.google.continueWith")}
			</Button>
		</div>
	);
}
