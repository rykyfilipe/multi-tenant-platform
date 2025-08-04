/** @format */

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

function LoginForm({ closeForm }: { closeForm: (x: boolean) => void }) {
	const { showAlert } = useApp();

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
				showAlert(
					"Welcome back! You have been successfully logged in.",
					"success",
				);
				closeForm(false);
			} else {
				showAlert(
					"Login failed. Please check your credentials and try again.",
					"error",
				);
			}
		} catch (error: any) {
			showAlert(
				"An unexpected error occurred during login. Please try again.",
				"error",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className='flex flex-col space-y-4 mt-4' onSubmit={handleLogin}>
			<div>
				<Label>Email</Label>
				<Input
					type='email'
					placeholder='Enter your email'
					className='rounded-lg'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label>Password</Label>
				<Input
					type='password'
					placeholder='Enter your password'
					className='rounded-lg'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>
			<Button
				type='submit'
				disabled={loading}
				className='w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg'>
				{loading ? "Please wait..." : "Login"}
			</Button>
			<p className='text-xs text-gray-500 text-center'>
				By logging in, you agree to our{" "}
				<a href='#' className='underline hover:text-purple-600'>
					Terms of Service
				</a>
			</p>
		</form>
	);
}

export default LoginForm;
