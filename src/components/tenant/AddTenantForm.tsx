/** @format */

"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { useApp } from "@/contexts/AppContext";

interface Props {
	setShowForm: (x: boolean) => void;
}

function AddTenantForm({ setShowForm }: Props) {
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const { showAlert, token, setTenant, user } = useApp();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name) return;

		setLoading(true);
		try {
			const response = await fetch("/api/tenants", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ name }),
			});

			if (!response.ok) {
				showAlert("Eroare la creare tenant", "error");
			} else {
				const data = await response.json();
				setTenant(data);
				showAlert("Tenant creat cu succes", "success");
			}
		} catch (error) {
			showAlert("Eroare rețea sau server", "error");
		} finally {
			setLoading(false);
			setShowForm(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4'>
			<div className='w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300'>
				<Card className='rounded-xl shadow-lg'>
					<CardHeader>
						<h2 className='text-lg font-semibold text-center'>
							Create a Tenant
						</h2>
					</CardHeader>

					<CardContent>
						<form onSubmit={handleSubmit} className='space-y-4'>
							<Input
								placeholder='Tenant name'
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={loading}
								required
							/>

							<div className='flex flex-col space-y-2'>
								<Button type='submit' disabled={loading}>
									{loading ? "Creating..." : "Create Tenant"}
								</Button>
								<Button
									variant='outline'
									onClick={() => setShowForm(false)}
									type='button'>
									Cancel
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default AddTenantForm;
