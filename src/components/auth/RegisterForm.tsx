/** @format */

"use client";

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
import { signIn } from "next-auth/react";

function RegisterForm({ closeForm }: { closeForm: (x: boolean) => void }) {
	const { showAlert } = useApp();

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
				showAlert(
					data.error ||
						"Registration failed. Please check your information and try again.",
					"error",
				);
			} else {
				const res = await signIn("credentials", {
					email,
					password,
					redirect: false,
				});

				if (res?.ok) {
					showAlert("Account created successfully! Welcome to YDV.", "success");
					closeForm(true);
				} else {
					showAlert(
						"Account created but login failed. Please log in manually.",
						"warning",
					);
				}
			}
		} catch (error: any) {
			showAlert(
				"An unexpected error occurred during registration. Please try again.",
				"error",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className='flex flex-col space-y-4 mt-4' onSubmit={handleRegister}>
			<div>
				<Label>First Name</Label>
				<Input
					type='text'
					placeholder='John'
					value={firstName}
					onChange={(e) => setFirstName(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label>Last Name</Label>
				<Input
					type='text'
					placeholder='Doe'
					value={lastName}
					onChange={(e) => setLastName(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label>Email</Label>
				<Input
					type='email'
					placeholder='you@example.com'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label>Password</Label>
				<Input
					type='password'
					placeholder='••••••••'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>

			<div className='flex gap-2 items-center text-sm text-gray-600'>
				Role: <span className='font-semibold'>ADMIN</span>
				<Popover open={open}>
					<PopoverTrigger asChild>
						<div
							onMouseEnter={() => setOpen(true)}
							onMouseLeave={() => setOpen(false)}>
							<Info className='w-4 h-4 text-gray-400 cursor-help' />
						</div>
					</PopoverTrigger>
					<PopoverContent className='text-sm w-[260px] pointer-events-none'>
						Contul va fi creat cu rolul de <strong>ADMIN</strong>. Poți gestiona
						contul din aplicație după autentificare.
					</PopoverContent>
				</Popover>
			</div>

			<Button
				type='submit'
				disabled={loading}
				className='w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg'>
				{loading ? "Please wait..." : "Register"}
			</Button>
		</form>
	);
}

export default RegisterForm;
