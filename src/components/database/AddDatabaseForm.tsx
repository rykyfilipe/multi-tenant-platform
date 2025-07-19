/** @format */

"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";

interface Props {
	setShowForm: (x: boolean) => void;
}

function AddDatabaseForm({ setShowForm }: Props) {
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const { showAlert, token, tenant, user } = useApp();
	const { databaseInfo, setDatabaseInfo } = useDatabase();

	const tenantId = tenant?.id;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name) return;

		setLoading(true);
		try {
			const response = await fetch(`/api/tenants/${tenantId}/database`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				showAlert("Eroare la creare database", "error");
			} else {
				const data = await response.json();
				setDatabaseInfo(data);
				showAlert("Database creat cu succes", "success");
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
							Create a Database
						</h2>
					</CardHeader>

					<CardContent>
						<form onSubmit={handleSubmit} className='space-y-4'>
							<Input
								placeholder='Database name'
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={loading}
								required
							/>

							<div className='flex flex-col space-y-2'>
								<Button type='submit' disabled={loading}>
									{loading ? "Creating..." : "Create Database"}
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

export default AddDatabaseForm;
