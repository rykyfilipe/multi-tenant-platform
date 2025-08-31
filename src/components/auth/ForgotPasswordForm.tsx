/** @format */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface ForgotPasswordFormProps {
	closeForm: (x: boolean) => void;
	showLoginForm: () => void;
}

function ForgotPasswordForm({
	closeForm,
	showLoginForm,
}: ForgotPasswordFormProps) {
	const { showAlert } = useApp();
	const { t } = useLanguage();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [submitted] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (response.ok) {
				setSubmitted(true);
				showAlert(t("forgotPassword.resetEmailSent"), "success");
			} else {
				showAlert(data.error || t("forgotPassword.failedToSend"), "error");
			}
		} catch (error) {
			showAlert(t("forgotPassword.unexpectedError"), "error");
		} finally {
			setLoading(false);
		}
	};

	if (submitted) {
		return (
			<div className='text-center space-y-4'>
				<div className='text-green-500 text-6xl mb-4'>✓</div>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("forgotPassword.checkEmail")}
				</h2>
				<p className='text-muted-foreground'>
					{t("forgotPassword.resetLinkSent")}{" "}
					<strong className='text-foreground'>{email}</strong>
				</p>
				<p className='text-sm text-muted-foreground'>
					{t("forgotPassword.linkExpires")}
				</p>
				<div className='space-y-2 pt-4'>
					<Button
						onClick={() => setSubmitted(false)}
						variant='outline'
						className='w-full'>
						{t("forgotPassword.sendAnotherEmail")}
					</Button>
					<Button onClick={showLoginForm} variant='ghost' className='w-full'>
						{t("forgotPassword.backToLogin")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			<div className='text-center'>
				<h2 className='text-2xl font-bold text-foreground'>
					{t("forgotPassword.title")}
				</h2>
				<p className='text-muted-foreground mt-2'>
					{t("forgotPassword.subtitle")}
				</p>
			</div>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<Label htmlFor='email'>{t("forgotPassword.emailAddress")}</Label>
					<Input
						id='email'
						type='email'
						placeholder={t("forgotPassword.emailPlaceholder")}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className='rounded-lg'
					/>
				</div>

				<Button
					type='submit'
					disabled={loading}
					className='w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg'>
					{loading
						? t("forgotPassword.sending")
						: t("forgotPassword.sendResetLink")}
				</Button>
			</form>

			<div className='text-center'>
				<Button
					onClick={showLoginForm}
					variant='ghost'
					className='text-primary hover:text-primary/80'>
					{t("forgotPassword.backToLogin")}
				</Button>
			</div>
		</div>
	);
}

export default ForgotPasswordForm;
