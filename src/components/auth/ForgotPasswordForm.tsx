/** @format */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

interface ForgotPasswordFormProps {
	closeForm: (x: boolean) => void;
	showLoginForm: () => void;
}

function ForgotPasswordForm({
	closeForm,
	showLoginForm,
}: ForgotPasswordFormProps) {
	const { showAlert } = useApp();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);

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
				showAlert(
					"If an account with that email exists, a password reset link has been sent.",
					"success",
				);
			} else {
				showAlert(
					data.error || "Failed to send reset email. Please try again.",
					"error",
				);
			}
		} catch (error) {
			showAlert("An unexpected error occurred. Please try again.", "error");
		} finally {
			setLoading(false);
		}
	};

	if (submitted) {
		return (
			<div className='text-center space-y-4'>
				<div className='text-green-600 text-6xl mb-4'>✓</div>
				<h2 className='text-2xl font-bold text-gray-900'>Check Your Email</h2>
				<p className='text-gray-600'>
					We've sent a password reset link to <strong>{email}</strong>
				</p>
				<p className='text-sm text-gray-500'>
					The link will expire in 1 hour for security reasons.
				</p>
				<div className='space-y-2 pt-4'>
					<Button
						onClick={() => setSubmitted(false)}
						variant='outline'
						className='w-full'>
						Send Another Email
					</Button>
					<Button onClick={showLoginForm} variant='ghost' className='w-full'>
						Back to Login
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			<div className='text-center'>
				<h2 className='text-2xl font-bold text-gray-900'>Forgot Password?</h2>
				<p className='text-gray-600 mt-2'>
					Enter your email address and we'll send you a link to reset your
					password.
				</p>
			</div>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<Label htmlFor='email'>Email Address</Label>
					<Input
						id='email'
						type='email'
						placeholder='Enter your email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className='rounded-lg'
					/>
				</div>

				<Button
					type='submit'
					disabled={loading}
					className='w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg'>
					{loading ? "Sending..." : "Send Reset Link"}
				</Button>
			</form>

			<div className='text-center'>
				<Button
					onClick={showLoginForm}
					variant='ghost'
					className='text-purple-600 hover:text-purple-700'>
					← Back to Login
				</Button>
			</div>
		</div>
	);
}

export default ForgotPasswordForm;
