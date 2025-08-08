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
	Shield,
	TrendingUp,
	Activity,
	Zap,
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
						storage: memoryData.data.usedMB,
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
				<div className='border-b border-border/20 bg-gradient-to-r from-background via-background/95 to-background/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm'>
					<div className='flex items-center justify-between px-6 py-6'>
						<div className='flex items-center space-x-4'>
							<div className='p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg'>
								<Building2 className='w-7 h-7 text-primary' />
							</div>
							<div>
								<h1 className='text-2xl font-bold text-foreground tracking-tight'>
									Organization Management
								</h1>
								<p className='text-sm text-muted-foreground font-medium'>
									Command Center for Your Enterprise
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='p-8 max-w-5xl mx-auto'>
					<Card className='border border-border/20 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm shadow-xl'>
						<CardHeader className='text-center pb-8'>
							<div className='p-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full w-fit mx-auto mb-6 shadow-lg'>
								<Building2 className='w-12 h-12 text-primary' />
							</div>
							<CardTitle className='text-3xl font-bold tracking-tight mb-2'>
								No Organization Found
							</CardTitle>
							<p className='text-lg text-muted-foreground font-medium'>
								Ready to establish your enterprise presence?
							</p>
						</CardHeader>
						<CardContent className='text-center space-y-6'>
							<div className='max-w-md mx-auto'>
								<p className='text-muted-foreground leading-relaxed'>
									Create a powerful organization to unlock enterprise-grade
									features and team collaboration capabilities.
								</p>
							</div>
							<div className='flex justify-center'>
								<Button
									onClick={() => setShowForm(true)}
									className='gap-3 px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200'
									disabled={user?.role !== "ADMIN"}>
									<Plus className='w-5 h-5' />
									Launch Organization
								</Button>
							</div>
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
			<div className='border-b border-border/20 bg-gradient-to-r from-background via-background/95 to-background/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm'>
				<div className='flex items-center justify-between px-6 py-6'>
					<div className='flex items-center space-x-4'>
						<div className='p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg'>
							<Building2 className='w-7 h-7 text-primary' />
						</div>
						<div>
							<h1 className='text-2xl font-bold text-foreground tracking-tight'>
								{tenant.name}
							</h1>
							<p className='text-sm text-muted-foreground font-medium'>
								Enterprise Command Center
							</p>
						</div>
					</div>
					<div className='flex items-center space-x-3'>
						<Badge
							variant='secondary'
							className='text-xs font-semibold px-3 py-1'>
							{user?.role}
						</Badge>
						{user?.role === "ADMIN" ? (
							<Button
								onClick={() => setShowSettings(true)}
								variant='outline'
								size='sm'
								className='gap-2 shadow-sm hover:shadow-md transition-shadow'>
								<Settings className='w-4 h-4' />
								Settings
							</Button>
						) : (
							<div className='text-xs text-muted-foreground px-3 py-2 bg-muted/50 rounded-md border border-dashed'>
								Only administrators can modify settings
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='p-8 max-w-7xl mx-auto space-y-8'>
				{/* Overview Cards */}
				<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
					<Card className='border border-border/20 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-semibold text-foreground'>
								Team Members
							</CardTitle>
							<div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
								<Users className='h-4 w-4 text-blue-600 dark:text-blue-400' />
							</div>
						</CardHeader>
						<CardContent>
							<div className='text-3xl font-bold text-foreground'>
								{tenantStats.users}
							</div>
							<p className='text-xs text-muted-foreground font-medium'>
								Active enterprise users
							</p>
						</CardContent>
					</Card>

					<Card className='border border-border/20 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-semibold text-foreground'>
								Databases
							</CardTitle>
							<div className='p-2 bg-green-100 dark:bg-green-900/30 rounded-lg'>
								<Database className='h-4 w-4 text-green-600 dark:text-green-400' />
							</div>
						</CardHeader>
						<CardContent>
							<div className='text-3xl font-bold text-foreground'>
								{tenantStats.databases}
							</div>
							<p className='text-xs text-muted-foreground font-medium'>
								Active databases
							</p>
						</CardContent>
					</Card>

					<Card className='border border-border/20 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-semibold text-foreground'>
								Tables
							</CardTitle>
							<div className='p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg'>
								<Database className='h-4 w-4 text-purple-600 dark:text-purple-400' />
							</div>
						</CardHeader>
						<CardContent>
							<div className='text-3xl font-bold text-foreground'>
								{tenantStats.tables}
							</div>
							<p className='text-xs text-muted-foreground font-medium'>
								Total tables created
							</p>
						</CardContent>
					</Card>

					<Card className='border border-border/20 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200'>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-semibold text-foreground'>
								Storage
							</CardTitle>
							<div className='p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg'>
								<Activity className='h-4 w-4 text-orange-600 dark:text-orange-400' />
							</div>
						</CardHeader>
						<CardContent>
							<div className='text-3xl font-bold text-foreground'>
								{tenantStats.storage}MB
							</div>
							<p className='text-xs text-muted-foreground font-medium'>
								Data storage used
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Organization Details */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{/* Basic Information */}
					<Card className='border border-border/20 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm shadow-lg'>
						<CardHeader className='pb-4'>
							<CardTitle className='flex items-center gap-3 text-lg font-bold'>
								<div className='p-2 bg-primary/10 rounded-lg'>
									<Building2 className='w-5 h-5 text-primary' />
								</div>
								Enterprise Information
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-4'>
								<div className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
									<span className='text-sm font-semibold text-muted-foreground'>
										Organization Name
									</span>
									<span className='text-sm font-bold text-foreground'>
										{tenant.name}
									</span>
								</div>
								<div className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
									<span className='text-sm font-semibold text-muted-foreground'>
										Established
									</span>
									<span className='text-sm font-medium'>
										{formatDate(tenant.createdAt)}
									</span>
								</div>
								<div className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
									<span className='text-sm font-semibold text-muted-foreground'>
										Last Updated
									</span>
									<span className='text-sm font-medium'>
										{formatDate(tenant.updatedAt)}
									</span>
								</div>
								{tenant.timezone && (
									<div className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
										<span className='text-sm font-semibold text-muted-foreground'>
											Timezone
										</span>
										<span className='text-sm font-medium flex items-center gap-2'>
											<Globe className='w-4 h-4 text-primary' />
											{tenant.timezone}
										</span>
									</div>
								)}
								{tenant.language && (
									<div className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
										<span className='text-sm font-semibold text-muted-foreground'>
											Language
										</span>
										<span className='text-sm font-medium'>
											{tenant.language.toUpperCase()}
										</span>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Contact Information */}
					<Card className='border border-border/20 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm shadow-lg'>
						<CardHeader className='pb-4'>
							<CardTitle className='flex items-center gap-3 text-lg font-bold'>
								<div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
									<Mail className='w-5 h-5 text-blue-600 dark:text-blue-400' />
								</div>
								Business Contact
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{tenant.companyEmail ? (
								<div className='flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800'>
									<div className='p-2 bg-blue-500 rounded-lg'>
										<Mail className='w-4 h-4 text-white' />
									</div>
									<div className='flex-1'>
										<p className='text-sm font-bold text-foreground'>
											{tenant.companyEmail}
										</p>
										<p className='text-xs text-muted-foreground font-medium'>
											Primary Business Email
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed'>
									<Mail className='w-10 h-10 mx-auto mb-3 opacity-50' />
									<p className='text-sm font-medium'>
										No business email configured
									</p>
									<p className='text-xs text-muted-foreground mt-1'>
										Add your primary contact email
									</p>
								</div>
							)}

							{tenant.phone ? (
								<div className='flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800'>
									<div className='p-2 bg-green-500 rounded-lg'>
										<Phone className='w-4 h-4 text-white' />
									</div>
									<div className='flex-1'>
										<p className='text-sm font-bold text-foreground'>
											{tenant.phone}
										</p>
										<p className='text-xs text-muted-foreground font-medium'>
											Business Phone
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed'>
									<Phone className='w-10 h-10 mx-auto mb-3 opacity-50' />
									<p className='text-sm font-medium'>
										No phone number configured
									</p>
									<p className='text-xs text-muted-foreground mt-1'>
										Add your business contact number
									</p>
								</div>
							)}

							{tenant.website ? (
								<div className='flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800'>
									<div className='p-2 bg-purple-500 rounded-lg'>
										<ExternalLink className='w-4 h-4 text-white' />
									</div>
									<div className='flex-1'>
										<p className='text-sm font-bold text-foreground'>
											{tenant.website}
										</p>
										<p className='text-xs text-muted-foreground font-medium'>
											Corporate Website
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed'>
									<ExternalLink className='w-10 h-10 mx-auto mb-3 opacity-50' />
									<p className='text-sm font-medium'>No website configured</p>
									<p className='text-xs text-muted-foreground mt-1'>
										Add your company website
									</p>
								</div>
							)}

							{tenant.address ? (
								<div className='flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800'>
									<div className='p-2 bg-orange-500 rounded-lg'>
										<MapPin className='w-4 h-4 text-white' />
									</div>
									<div className='flex-1'>
										<p className='text-sm font-bold text-foreground'>
											{tenant.address}
										</p>
										<p className='text-xs text-muted-foreground font-medium'>
											Business Address
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed'>
									<MapPin className='w-10 h-10 mx-auto mb-3 opacity-50' />
									<p className='text-sm font-medium'>No address configured</p>
									<p className='text-xs text-muted-foreground mt-1'>
										Add your business location
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions */}
				<Card className='border border-border/20 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm shadow-lg'>
					<CardHeader className='pb-4'>
						<CardTitle className='flex items-center gap-3 text-lg font-bold'>
							<div className='p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg'>
								<Zap className='w-5 h-5 text-primary' />
							</div>
							Enterprise Actions
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							<Link href='/home/users'>
								<Button
									variant='outline'
									className='h-auto p-6 flex flex-col items-center gap-3 w-full shadow-lg hover:shadow-xl transition-all duration-200 border-2 hover:border-primary/50'>
									<div className='p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full'>
										<Users className='w-6 h-6 text-blue-600 dark:text-blue-400' />
									</div>
									<span className='font-semibold text-base'>
										{user?.role === "ADMIN" ? "Manage Team" : "View Team"}
									</span>
									<span className='text-xs text-muted-foreground text-center leading-relaxed'>
										{user?.role === "ADMIN"
											? "Command your enterprise workforce"
											: "Monitor your team members and roles"}
									</span>
								</Button>
							</Link>
							<Link href='/home/database'>
								<Button
									variant='outline'
									className='h-auto p-6 flex flex-col items-center gap-3 w-full shadow-lg hover:shadow-xl transition-all duration-200 border-2 hover:border-primary/50'>
									<div className='p-3 bg-green-100 dark:bg-green-900/30 rounded-full'>
										<Database className='w-6 h-6 text-green-600 dark:text-green-400' />
									</div>
									<span className='font-semibold text-base'>Data Command Center</span>
									<span className='text-xs text-muted-foreground text-center leading-relaxed'>
										Access and control your enterprise data infrastructure
									</span>
								</Button>
							</Link>
							{user?.role === "ADMIN" ? (
								<Button
									variant='outline'
									className='h-auto p-6 flex flex-col items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200 border-2 hover:border-primary/50'
									onClick={() => setShowSettings(true)}>
									<div className='p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full'>
										<Settings className='w-6 h-6 text-purple-600 dark:text-purple-400' />
									</div>
									<span className='font-semibold text-base'>Enterprise Settings</span>
									<span className='text-xs text-muted-foreground text-center leading-relaxed'>
										Configure your organization's preferences and branding
									</span>
								</Button>
							) : (
								<div className='h-auto p-6 flex flex-col items-center gap-3 border-2 border-dashed rounded-lg bg-muted/20 shadow-lg'>
									<div className='p-3 bg-muted/50 rounded-full'>
										<Settings className='w-6 h-6 text-muted-foreground' />
									</div>
									<span className='text-muted-foreground font-semibold text-base'>Enterprise Settings</span>
									<span className='text-xs text-muted-foreground text-center leading-relaxed'>
										Administrator privileges required
									</span>
								</div>
							)}
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
