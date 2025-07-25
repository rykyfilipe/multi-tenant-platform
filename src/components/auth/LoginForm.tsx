/** @format */

"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

function LoginForm() {
	const { showAlert, setToken, setUser } = useApp();
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				showAlert(data.error || "Login failed", "error");
			} else {
				localStorage.setItem("token", data.token);
				localStorage.setItem("user", JSON.stringify(data.user));
				setToken(data.token);
				setUser(data.user);

				showAlert("Login successful!", "success");

				setTimeout(() => router.push("/home"), 2000);
			}
		} catch (error: any) {
			showAlert(error.message || "An error occurred during login.", "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className='p-6 shadow-lg'>
			<CardHeader className='text-center text-2xl font-bold'>Login</CardHeader>
			<CardContent>
				<form className='flex flex-col space-y-4' onSubmit={handleLogin}>
					<div>
						<Label>Email</Label>
						<Input
							type='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div>
						<Label>Password</Label>
						<Input
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					<Button type='submit' disabled={loading}>
						{loading ? "Please wait..." : "Login"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

export default LoginForm;
