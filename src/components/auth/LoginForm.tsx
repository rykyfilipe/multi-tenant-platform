/** @format */

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

interface LoginFormProps {
	closeForm: (x: boolean) => void;
	showForgotPassword: () => void;
}

function LoginForm({ closeForm, showForgotPassword }: LoginFormProps) {
	const { showAlert } = useApp();
	const { t } = useLanguage();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (res?.ok) {
				showAlert(t("login.welcomeBack"), "success");
				closeForm(true);
				// Redirect to dashboard after successful login
				window.location.href = "/home/dashboard";
			} else {
				showAlert(t("login.failed"), "error");
			}
		} catch (error: any) {
			console.error("Login error:", error);
			showAlert(t("login.unexpectedError"), "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className='flex flex-col space-y-4 mt-4' onSubmit={handleLogin}>
			<div>
				<Label>{t("login.email")}</Label>
				<Input
					type='email'
					placeholder={t("login.emailPlaceholder")}
					className='rounded-lg'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label>{t("login.password")}</Label>
				<Input
					type='password'
					placeholder={t("login.passwordPlaceholder")}
					className='rounded-lg'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
				<div className='text-right mt-1'>
					<button
						type='button'
						onClick={showForgotPassword}
						className='text-sm text-primary hover:text-primary/80 underline'>
						{t("login.forgotPassword")}
					</button>
				</div>
			</div>
			<Button
				type='submit'
				disabled={loading}
				className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm'>
				{loading ? t("login.pleaseWait") : t("login.login")}
			</Button>
			<p className='text-xs text-muted-foreground text-center'>
				{t("login.termsAgreement")}{" "}
				<a href='#' className='underline hover:text-primary'>
					{t("login.termsOfService")}
				</a>
			</p>
		</form>
	);
}

export default LoginForm;
