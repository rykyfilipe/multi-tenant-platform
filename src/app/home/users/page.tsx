/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import UserCard from "@/components/users/UserCard";
import { useApp } from "@/contexts/AppContext";
import { User } from "@/types/user";
import { Label } from "@radix-ui/react-label";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

function Page() {
	const { user, token, showAlert } = useApp();
	const [users, setUsers] = useState<User[]>([]);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [role, setRole] = useState("VIEWER");
	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const response = await fetch(`/api/tenant/${user.tenantId}/users`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!response.ok) {
					throw new Error("Could not fetch tenant");
				}
				showAlert("Users data loaded", "success");
				const data = await response.json();
				setUsers(data);
			} catch (error) {
				showAlert("Failed to load tenant", "error");
			}
		};

		if (token) {
			fetchUsers();
		}
	}, [token, user]);
	const resetForm = () => {
		setEmail("");
		setPassword("");
		setFirstName("");
		setLastName("");
		setRole("VIEWER");
	};
	const handleAddUser = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const response = await fetch(`/api/tenant/${user.tenantId}/users`, {
				headers: { Authorization: `Bearer ${token}` },
				method: "POST",
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
				showAlert(data.error || "Create user failed", "error");
			} else if (data.token) {
				showAlert("User created  successful!", "success");
				resetForm();
			}
		} catch (error: any) {
			showAlert(
				error.message || "An error occurred during registration.",
				"error",
			);
		}
	};

	return (
		<div className='relative w-full h-screen flex items-center justify-center p-4'>
			<Card className='p-6 shadow-lg'>
				<CardHeader className='text-center text-2xl font-bold'>
					Create user
				</CardHeader>
				<CardContent>
					<form className='flex flex-col space-y-4' onSubmit={handleAddUser}>
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

						<Button type='submit'>Create</Button>
					</form>
				</CardContent>
			</Card>
			{users?.map((user) => (
				<UserCard user={user} key={user.id} />
			))}
		</div>
	);
}

export default Page;
