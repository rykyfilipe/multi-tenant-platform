/** @format */

"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

function RegisterForm() {
	const { showAlert, setToken, setUser } = useApp();
	const router = useRouter();

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const role = "ADMIN";

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
			} else {
				localStorage.setItem("token", data.token);
				localStorage.setItem("user", JSON.stringify(data.user));
				showAlert("Registration successful!", "success");

				setToken(data.token);
				setUser(data.user);

				setTimeout(() => router.push("/home/dashboard"), 2000);
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
		<Card className='p-6 shadow-lg'>
			<CardHeader className='text-center text-2xl font-bold'>
				Register
			</CardHeader>
			<CardContent>
				<form className='flex flex-col space-y-4' onSubmit={handleRegister}>
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
					<div className='flex gap-2 items-center'>
						<Label>Role: ADMIN</Label>
						<Popover open={open}>
							<PopoverTrigger asChild>
								<div
									onMouseEnter={() => setOpen(true)}
									onMouseLeave={() => setOpen(false)}>
									<Info className='w-4 h-4 text-muted-foreground cursor-help' />
								</div>
							</PopoverTrigger>
							<PopoverContent className='text-sm w-[260px] pointer-events-none'>
								Contul va fi creat cu rolul de <strong>ADMIN</strong>. Poți
								gestiona contul din aplicație după autentificare.
							</PopoverContent>
						</Popover>
					</div>

					<Button type='submit' disabled={loading}>
						{loading ? "Please wait..." : "Register"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

export default RegisterForm;
