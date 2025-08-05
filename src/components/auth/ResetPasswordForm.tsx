/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

function ResetPasswordForm() {
	const { showAlert } = useApp();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [token, setToken] = useState("");
	const [email, setEmail] = useState("");
	const [tokenValid, setTokenValid] = useState(false);
	const [validating, setValidating] = useState(true);

	useEffect(() => {
		const tokenParam = searchParams.get("token");
		const emailParam = searchParams.get("email");

		if (!tokenParam || !emailParam) {
			showAlert(
				"Invalid reset link. Please request a new password reset.",
				"error",
			);
			router.push("/");
			return;
		}

		setToken(tokenParam);
		setEmail(emailParam);
		setValidating(false);
		setTokenValid(true);
	}, [searchParams, router, showAlert]);

	const validatePasswords = () => {
		if (newPassword.length < 6) {
			showAlert("Password must be at least 6 characters long", "error");
			return false;
		}

		if (newPassword !== confirmPassword) {
			showAlert("Passwords do not match", "error");
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validatePasswords()) {
			return;
		}

		setLoading(true);

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
				showAlert(
					"Password has been reset successfully! You can now log in.",
					"success",
				);
				router.push("/");
			} else {
				showAlert(
					data.error || "Failed to reset password. Please try again.",
					"error",
				);
			}
		} catch (error) {
			showAlert("An unexpected error occurred. Please try again.", "error");
		} finally {
			setLoading(false);
		}
	};

	if (validating) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto'></div>
					<p className='mt-2 text-gray-600'>Validating reset link...</p>
				</div>
			</div>
		);
	}

	if (!tokenValid) {
		return null;
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-md w-full space-y-8'>
				<div className='text-center'>
					<h2 className='text-3xl font-bold text-gray-900'>
						Reset Your Password
					</h2>
					<p className='mt-2 text-gray-600'>Enter your new password below</p>
				</div>

				<form onSubmit={handleSubmit} className='space-y-6'>
					<div>
						<Label htmlFor='newPassword'>New Password</Label>
						<Input
							id='newPassword'
							type='password'
							placeholder='Enter your new password'
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							required
							className='rounded-lg'
							minLength={6}
						/>
						<p className='text-xs text-gray-500 mt-1'>
							Password must be at least 6 characters long
						</p>
					</div>

					<div>
						<Label htmlFor='confirmPassword'>Confirm New Password</Label>
						<Input
							id='confirmPassword'
							type='password'
							placeholder='Confirm your new password'
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							className='rounded-lg'
						/>
					</div>

					<Button
						type='submit'
						disabled={loading}
						className='w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg'>
						{loading ? "Resetting..." : "Reset Password"}
					</Button>
				</form>

				<div className='text-center'>
					<Button
						onClick={() => router.push("/")}
						variant='ghost'
						className='text-purple-600 hover:text-purple-700'>
						← Back to Login
					</Button>
				</div>
			</div>
		</div>
	);
}

export default ResetPasswordForm;
