/** @format */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
	Building2,
	Settings,
	Users,
	Database,
	Globe,
	Mail,
	Phone,
	MapPin,
	ExternalLink,
	Edit,
	Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AddTenantForm from "@/components/tenant/AddTenantForm";
import TenantSettingsModal from "@/components/tenant/TenantSettingsModal";
import { useApp } from "@/contexts/AppContext";
import { TenantLoadingState } from "@/components/ui/loading-states";
import Link from "next/link";

function Page() {
	const { user, loading, tenant, token } = useApp();
	const [showForm, setShowForm] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [tenantStats, setTenantStats] = useState({
		users: 0,
		tables: 0,
		databases: 0,
		storage: 0,
	});

	// Fetch tenant statistics
	const fetchTenantStats = useCallback(async () => {
		if (!tenant || !token) return;

		try {
			const [memoryResponse, limitsResponse] = await Promise.all([
				fetch(`/api/tenants/${tenant.id}/memory`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch("/api/user/limits", {
					headers: { Authorization: `Bearer ${token}` },
				}),
			]);

			if (memoryResponse.ok && limitsResponse.ok) {
				const memoryData = await memoryResponse.json();
				const limitsData = await limitsResponse.json();

				if (memoryData.success) {
					setTenantStats((prev) => ({
						...prev,
						storage: memoryData.data.usedGB,
						users: limitsData.users,
						databases: limitsData.databases,
						tables: limitsData.tables,
					}));
				}
			}
		} catch (error) {
			console.error("Failed to fetch tenant stats:", error);
		}
	}, [tenant, token]);

	useEffect(() => {
		if (tenant && token && tenantStats.storage === 0) {
			fetchTenantStats();
		}
	}, [tenant, fetchTenantStats, token, tenantStats.storage]);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	if (loading) {
		return <TenantLoadingState />;
	}

	if (!tenant) {
		return (
			<div className='h-full bg-background'>
				{/* Header */}
				<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
					<div className='flex items-center justify-between px-6 py-4'>
						<div className='flex items-center space-x-4'>
							<div className='p-3 bg-primary/10 rounded-xl'>
								<Building2 className='w-6 h-6 text-primary' />
							</div>
							<div>
								<h1 className='text-xl font-semibold text-foreground'>
									Organization Management
								</h1>
								<p className='text-sm text-muted-foreground'>
									Create and manage your organization
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='p-6 max-w-4xl mx-auto'>
					<Card className='border border-border/20 bg-card/50 backdrop-blur-sm'>
						<CardHeader className='text-center'>
							<div className='p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4'>
								<Building2 className='w-8 h-8 text-muted-foreground' />
							</div>
							<CardTitle className='text-2xl'>No Organization Found</CardTitle>
						</CardHeader>
						<CardContent className='text-center space-y-4'>
							<p className='text-muted-foreground'>
								Create a new organization to start using the platform with your
								team.
							</p>
							<Button
								onClick={() => setShowForm(true)}
								className='gap-2'
								disabled={user?.role !== "ADMIN"}>
								<Plus className='w-4 h-4' />
								Create Organization
							</Button>
						</CardContent>
					</Card>
				</div>

				{showForm && <AddTenantForm setShowForm={setShowForm} />}
			</div>
		);
	}

	return (
		<div className='h-full bg-background'>
			{/* Header */}
			<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
				<div className='flex items-center justify-between px-6 py-4'>
					<div className='flex items-center space-x-4'>
						<div className='p-3 bg-primary/10 rounded-xl'>
							<Building2 className='w-6 h-6 text-primary' />
						</div>
						<div>
							<h1 className='text-xl font-semibold text-foreground'>
								{tenant.name}
							</h1>
							<p className='text-sm text-muted-foreground'>
								Organization Management & Settings
							</p>
						</div>
					</div>
					<div className='flex items-center space-x-3'>
						<Badge variant='secondary' className='text-xs'>
							{user?.role}
						</Badge>
						<Button
							onClick={() => setShowSettings(true)}
							variant='outline'
							size='sm'
							className='gap-2'>
							<Settings className='w-4 h-4' />
							Settings
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='p-6 max-w-7xl mx-auto space-y-6'>
				{/* Overview Cards */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					<Card className='border border-border/20 bg-card/50 backdrop-blur-sm'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Team Members
							</CardTitle>
							<Users className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{tenantStats.users}</div>
							<p className='text-xs text-muted-foreground'>
								Active users in organization
							</p>
						</CardContent>
					</Card>

					<Card className='border border-border/20 bg-card/50 backdrop-blur-sm'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Databases</CardTitle>
							<Database className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{tenantStats.databases}</div>
							<p className='text-xs text-muted-foreground'>Active databases</p>
						</CardContent>
					</Card>

					<Card className='border border-border/20 bg-card/50 backdrop-blur-sm'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Tables</CardTitle>
							<Database className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{tenantStats.tables}</div>
							<p className='text-xs text-muted-foreground'>
								Total tables created
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Organization Details */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Basic Information */}
					<Card className='border border-border/20 bg-card/50 backdrop-blur-sm'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Building2 className='w-5 h-5' />
								Organization Information
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-3'>
								<div className='flex items-center justify-between'>
									<span className='text-sm font-medium text-muted-foreground'>
										Name
									</span>
									<span className='text-sm font-semibold'>{tenant.name}</span>
								</div>
								<Separator />
								<div className='flex items-center justify-between'>
									<span className='text-sm font-medium text-muted-foreground'>
										Created
									</span>
									<span className='text-sm'>
										{formatDate(tenant.createdAt)}
									</span>
								</div>
								<Separator />
								<div className='flex items-center justify-between'>
									<span className='text-sm font-medium text-muted-foreground'>
										Last Updated
									</span>
									<span className='text-sm'>
										{formatDate(tenant.updatedAt)}
									</span>
								</div>
								{tenant.timezone && (
									<>
										<Separator />
										<div className='flex items-center justify-between'>
											<span className='text-sm font-medium text-muted-foreground'>
												Timezone
											</span>
											<span className='text-sm flex items-center gap-1'>
												<Globe className='w-3 h-3' />
												{tenant.timezone}
											</span>
										</div>
									</>
								)}
								{tenant.language && (
									<>
										<Separator />
										<div className='flex items-center justify-between'>
											<span className='text-sm font-medium text-muted-foreground'>
												Language
											</span>
											<span className='text-sm'>
												{tenant.language.toUpperCase()}
											</span>
										</div>
									</>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Contact Information */}
					<Card className='border border-border/20 bg-card/50 backdrop-blur-sm'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Mail className='w-5 h-5' />
								Contact Information
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{tenant.companyEmail ? (
								<div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
									<Mail className='w-4 h-4 text-muted-foreground' />
									<div className='flex-1'>
										<p className='text-sm font-medium'>{tenant.companyEmail}</p>
										<p className='text-xs text-muted-foreground'>
											Company Email
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-6 text-muted-foreground'>
									<Mail className='w-8 h-8 mx-auto mb-2 opacity-50' />
									<p className='text-sm'>No company email set</p>
								</div>
							)}

							{tenant.phone ? (
								<div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
									<Phone className='w-4 h-4 text-muted-foreground' />
									<div className='flex-1'>
										<p className='text-sm font-medium'>{tenant.phone}</p>
										<p className='text-xs text-muted-foreground'>
											Phone Number
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-6 text-muted-foreground'>
									<Phone className='w-8 h-8 mx-auto mb-2 opacity-50' />
									<p className='text-sm'>No phone number set</p>
								</div>
							)}

							{tenant.website ? (
								<div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
									<ExternalLink className='w-4 h-4 text-muted-foreground' />
									<div className='flex-1'>
										<p className='text-sm font-medium'>{tenant.website}</p>
										<p className='text-xs text-muted-foreground'>Website</p>
									</div>
								</div>
							) : (
								<div className='text-center py-6 text-muted-foreground'>
									<ExternalLink className='w-8 h-8 mx-auto mb-2 opacity-50' />
									<p className='text-sm'>No website set</p>
								</div>
							)}

							{tenant.address ? (
								<div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
									<MapPin className='w-4 h-4 text-muted-foreground' />
									<div className='flex-1'>
										<p className='text-sm font-medium'>{tenant.address}</p>
										<p className='text-xs text-muted-foreground'>Address</p>
									</div>
								</div>
							) : (
								<div className='text-center py-6 text-muted-foreground'>
									<MapPin className='w-8 h-8 mx-auto mb-2 opacity-50' />
									<p className='text-sm'>No address set</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions */}
				<Card className='border border-border/20 bg-card/50 backdrop-blur-sm'>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<Link href='/home/users'>
								<Button
									variant='outline'
									className='h-auto p-4 flex flex-col items-center gap-2 w-full'>
									<Users className='w-5 h-5' />
									<span>
										{user?.role === "ADMIN" ? "Manage Users" : "View Team"}
									</span>
									<span className='text-xs text-muted-foreground'>
										{user?.role === "ADMIN"
											? "Add, remove, or edit team members"
											: "View your team members and their roles"}
									</span>
								</Button>
							</Link>
							<Link href='/home/database'>
								<Button
									variant='outline'
									className='h-auto p-4 flex flex-col items-center gap-2 w-full'>
									<Database className='w-5 h-5' />
									<span>View Database</span>
									<span className='text-xs text-muted-foreground'>
										Access your organization's data
									</span>
								</Button>
							</Link>
							<Button
								variant='outline'
								className='h-auto p-4 flex flex-col items-center gap-2'
								onClick={() => setShowSettings(true)}>
								<Settings className='w-5 h-5' />
								<span>Organization Settings</span>
								<span className='text-xs text-muted-foreground'>
									Configure preferences and branding
								</span>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{showForm && <AddTenantForm setShowForm={setShowForm} />}
			{showSettings && (
				<TenantSettingsModal
					tenant={tenant}
					onClose={() => setShowSettings(false)}
				/>
			)}
		</div>
	);
}

export default Page;
