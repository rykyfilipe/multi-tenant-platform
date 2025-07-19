/** @format */

"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddTenantForm from "@/components/tenant/AddTenantForm";
import { useApp } from "@/contexts/AppContext";
import Loading from "@/components/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Page() {
	const { user, loading, tenant } = useApp();
	const [showForm, setShowForm] = useState(false);

	return (
		<div className='min-h-screen w-full bg-gradient-to-br from-gray-100 to-white flex items-center justify-center p-6'>
			{loading ? (
				<Loading message='Loading tenant...' />
			) : tenant ? (
				<Card className='w-full max-w-md shadow-xl'>
					<CardHeader>
						<CardTitle className='text-center text-2xl text-primary'>
							Welcome to {tenant.name}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-center text-muted-foreground'>
							You are associated with this tenant.
						</p>
					</CardContent>
				</Card>
			) : (
				<Card className='w-full max-w-md shadow-lg animate-in fade-in duration-300'>
					<CardHeader>
						<CardTitle className='text-center'>No Tenant Found</CardTitle>
					</CardHeader>
					<CardContent className='flex flex-col items-center gap-4'>
						<p className='text-center text-muted-foreground'>
							Create a new tenant to continue using the platform.
						</p>
						<Button
							onClick={() => setShowForm(true)}
							className='gap-2'
							disabled={user?.role !== "ADMIN"}>
							<Plus className='w-4 h-4' />
							Create Tenant
						</Button>
					</CardContent>
				</Card>
			)}

			{showForm && <AddTenantForm setShowForm={setShowForm} />}
		</div>
	);
}

export default Page;
