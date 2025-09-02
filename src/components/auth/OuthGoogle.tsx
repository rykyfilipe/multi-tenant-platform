/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

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
				callbackUrl: "/auth-callback",
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
		<motion.div
			className='flex flex-col items-center space-y-4 w-full'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: "easeOut" }}>
			<motion.div
				className='w-full'
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}>
				<Button
					onClick={handleGoogleSignIn}
					disabled={loading}
					variant='outline'
					className='w-full flex items-center justify-center gap-3 border border-border hover:bg-muted transition-all'>
					<motion.div
						animate={loading ? { rotate: 360 } : { rotate: 0 }}
						transition={{
							duration: 1,
							repeat: loading ? Infinity : 0,
							ease: "linear",
						}}>
						<FcGoogle size={22} />
					</motion.div>
					{loading
						? t("oauth.google.redirecting")
						: t("oauth.google.continueWith")}
				</Button>
			</motion.div>
		</motion.div>
	);
}
