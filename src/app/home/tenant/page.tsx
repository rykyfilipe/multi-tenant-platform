/** @format */

"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddTenantForm from "@/components/tenant/AddTenantForm";
import { useApp } from "@/contexts/AppContext";

function Page() {
	const { showAlert, token, user } = useApp();

	const [tenant, setTenant] = useState(null);
	const [showForm, setShowForm] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTenant = async () => {
			try {
				const response = await fetch("/api/tenant", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!response.ok) {
					throw new Error("Could not fetch tenant");
				}

				const data = await response.json();
				setTenant(data);
			} catch (error) {
				console.error("Error fetching tenant:", error);
				showAlert("Failed to load tenant", "error");
			} finally {
				setLoading(false);
			}
		};

		if (token) {
			fetchTenant();
		}
	}, [token]);

	return (
		<div className='relative w-full h-screen flex items-center justify-center p-4'>
			{loading ? (
				<div className='text-gray-600 text-lg animate-pulse'>
					Loading tenant...
				</div>
			) : tenant ? (
				<h1 className='text-2xl font-bold text-center'>{tenant.name}</h1>
			) : (
				<div className='flex flex-col items-center space-y-4'>
					<h1 className='text-xl font-semibold'>
						No tenant available for this user
					</h1>
					<p className='text-gray-600'>Create a tenant to continue</p>
					<Button onClick={() => setShowForm(true)} className='flex gap-2'>
						<Plus className='w-4 h-4' />
						Create Tenant
					</Button>
				</div>
			)}

			{showForm && (
				<AddTenantForm
					userId={user.id}
					setShowForm={setShowForm}
					setTenant={setTenant}
				/>
			)}
		</div>
	);
}

export default Page;
