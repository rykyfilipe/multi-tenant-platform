/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";

function AuthForm() {
	const { showAlert } = useApp();

	const [tab, setTab] = useState("login");
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [role, setRole] = useState("VIEWER");

	const [loading, setLoading] = useState(false);

	const resetForm = () => {
		setEmail("");
		setPassword("");
		setFirstName("");
		setLastName("");
		setRole("VIEWER");
	};

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
			} else if (data.token) {
				localStorage.setItem("token", data.token);
				localStorage.setItem("user", JSON.stringify(data.user));
				showAlert("Login successful!", "success");
				resetForm();

				setTimeout(() => {
					router.push("/home/dashboard");
				}, 2000);
			}
		} catch (error: any) {
			showAlert(error.message || "An error occurred during login.", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					password,
					firstName,
					lastName,
					role,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				showAlert(data.error || "Registration failed", "error");
			} else if (data.token) {
				localStorage.setItem("token", data.token);
				localStorage.setItem("user", JSON.stringify(data.user));
				showAlert("Registration successful!", "success");
				resetForm();

				setTimeout(() => {
					router.push("/home/dashboard");
				}, 2000);
			}
		} catch (error: any) {
			showAlert(
				error.message || "An error occurred during registration.",
				"error",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex items-center justify-center h-screen bg-gray-100'>
			<Tabs
				defaultValue='login'
				value={tab}
				onValueChange={setTab}
				className='w-96'>
				<TabsList className='grid w-full grid-cols-2 mb-4'>
					<TabsTrigger value='login'>Login</TabsTrigger>
					<TabsTrigger value='register'>Register</TabsTrigger>
				</TabsList>

				<TabsContent value='login'>
					<Card className='p-6 shadow-lg'>
						<CardHeader className='text-center text-2xl font-bold'>
							Login
						</CardHeader>
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
				</TabsContent>

				<TabsContent value='register'>
					<Card className='p-6 shadow-lg'>
						<CardHeader className='text-center text-2xl font-bold'>
							Register
						</CardHeader>
						<CardContent>
							<form
								className='flex flex-col space-y-4'
								onSubmit={handleRegister}>
								<div>
									<Label>First Name</Label>
									<Input
										type='text'
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
										required
									/>
								</div>

								<div>
									<Label>Last Name</Label>
									<Input
										type='text'
										value={lastName}
										onChange={(e) => setLastName(e.target.value)}
										required
									/>
								</div>

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

								<div>
									<Label>Role</Label>
									<Select value={role} onValueChange={setRole}>
										<SelectTrigger className='border border-gray-300 rounded-md px-2 py-1'>
											<SelectValue placeholder='Select role' />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectItem value='VIEWER'>Viewer</SelectItem>
												<SelectItem value='ADMIN'>Admin</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>

								<Button type='submit' disabled={loading}>
									{loading ? "Please wait..." : "Register"}
								</Button>
							</form>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default AuthForm;
