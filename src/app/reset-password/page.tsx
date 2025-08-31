/** @format */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Eye,
	EyeOff,
	KeyRound,
	CheckCircle,
	AlertTriangle,
	Loader2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function ResetPasswordContent() {
	const { t } = useLanguage();
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams?.get("token");
	const email = searchParams?.get("email");

	// Redirect if no token or email
	useEffect(() => {
		if (!token || !email) {
			router.push("/?error=invalid-reset-link");
		}
	}, [token, email, router]);

	const validatePassword = (password: string) => {
		if (password.length < 6) {
			return t("resetPassword.validation.passwordTooShort");
		}
		return null;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		// Validate passwords
		const passwordError = validatePassword(newPassword);
		if (passwordError) {
			setError(passwordError);
			setLoading(false);
			return;
		}

		if (newPassword !== confirmPassword) {
			setError(t("resetPassword.validation.passwordsDoNotMatch"));
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					token,
					email,
					newPassword,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setSuccess(true);
				// Redirect to login after 3 seconds
				setTimeout(() => {
					router.push("/?message=password-reset-success");
				}, 3000);
			} else {
				setError(data.error || t("resetPassword.errors.failedToReset"));
			}
		} catch (err) {
			setError(t("resetPassword.errors.unexpectedError"));
		} finally {
			setLoading(false);
		}
	};

	if (!token || !email) {
		return null; // Will redirect in useEffect
	}

	if (success) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-background p-4'>
				<Card className='w-full max-w-md'>
					<CardHeader className='text-center'>
						<div className='mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4'>
							<CheckCircle className='w-6 h-6 text-green-600' />
						</div>
						<CardTitle className='text-green-700'>
							{t("resetPassword.success.title")}
						</CardTitle>
						<CardDescription>
							{t("resetPassword.success.description")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={() => router.push("/")} className='w-full'>
							{t("resetPassword.success.goToLogin")}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-background p-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='text-center'>
					<div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4'>
						<KeyRound className='w-6 h-6 text-primary' />
					</div>
					<CardTitle>{t("resetPassword.title")}</CardTitle>
					<CardDescription>{t("resetPassword.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						{error && (
							<Alert variant='destructive'>
								<AlertTriangle className='h-4 w-4' />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className='space-y-2'>
							<Label htmlFor='newPassword'>
								{t("resetPassword.newPassword")}
							</Label>
							<div className='relative'>
								<Input
									id='newPassword'
									type={showPassword ? "text" : "password"}
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder={t("resetPassword.newPasswordPlaceholder")}
									disabled={loading}
									className='pr-10'
									required
								/>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
									onClick={() => setShowPassword(!showPassword)}
									disabled={loading}>
									{showPassword ? (
										<EyeOff className='h-4 w-4' />
									) : (
										<Eye className='h-4 w-4' />
									)}
								</Button>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='confirmPassword'>
								{t("resetPassword.confirmPassword")}
							</Label>
							<div className='relative'>
								<Input
									id='confirmPassword'
									type={showConfirmPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder={t("resetPassword.confirmPasswordPlaceholder")}
									disabled={loading}
									className='pr-10'
									required
								/>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									disabled={loading}>
									{showConfirmPassword ? (
										<EyeOff className='h-4 w-4' />
									) : (
										<Eye className='h-4 w-4' />
									)}
								</Button>
							</div>
						</div>

						<div className='text-xs text-muted-foreground'>
							{t("resetPassword.forSecurity")} {email}
						</div>

						<Button type='submit' className='w-full' disabled={loading}>
							{loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							{loading
								? t("resetPassword.resettingPassword")
								: t("resetPassword.resetPassword")}
						</Button>

						<div className='text-center'>
							<Button
								type='button'
								variant='link'
								size='sm'
								onClick={() => router.push("/")}
								disabled={loading}>
								{t("resetPassword.backToLogin")}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center'>
					<Loader2 className='w-6 h-6 animate-spin' />
				</div>
			}>
			<ResetPasswordContent />
		</Suspense>
	);
}
