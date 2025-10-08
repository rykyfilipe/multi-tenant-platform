/** @format */

"use client";

import { useState } from "react";
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
	Plus,
	Zap,
	Receipt,
	CreditCard,
	FileText,
	Puzzle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AddTenantForm from "@/components/tenant/AddTenantForm";
import TenantSettingsModal from "@/components/tenant/TenantSettingsModal";
import ModuleManager from "@/components/modules/ModuleManager";
import { useApp } from "@/contexts/AppContext";
import { TenantLoadingState } from "@/components/ui/loading-states";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { CardDescription } from "@/components/ui/card";

function Page() {
	const { user, loading, tenant, token } = useApp();
	const [showForm, setShowForm] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const { t } = useLanguage();


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
				<div className='border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm'>
					<div className='px-4 sm:px-6 lg:px-8 py-6'>
						<div className='flex items-center gap-3'>
							<div className='p-2 rounded-xl bg-primary/10 shadow-sm'>
								<Building2 className='w-6 h-6 text-primary' />
							</div>
							<div>
								<h1 className='text-2xl sm:text-3xl font-bold text-foreground tracking-tight'>
									{t("tenant.management.title")}
								</h1>
								<p className='text-sm text-muted-foreground'>
									{t("tenant.management.subtitle")}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto'>
					<Card className='border border-border/50 bg-card shadow-lg rounded-2xl'>
						<CardHeader className='text-center pb-8'>
							<div className='p-6 bg-primary/10 rounded-full w-fit mx-auto mb-6 shadow-sm'>
								<Building2 className='w-12 h-12 text-primary' />
							</div>
							<CardTitle className='text-2xl sm:text-3xl font-bold tracking-tight mb-2'>
								{t("tenant.management.noOrganization.title")}
							</CardTitle>
							<p className='text-base text-muted-foreground'>
								{t("tenant.management.noOrganization.subtitle")}
							</p>
						</CardHeader>
						<CardContent className='text-center space-y-6'>
							<div className='max-w-md mx-auto'>
								<p className='text-sm text-muted-foreground leading-relaxed'>
									{t("tenant.management.noOrganization.description")}
								</p>
							</div>
							<div className='flex justify-center'>
								<Button
									onClick={() => setShowForm(true)}
									className='gap-2 px-8 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200'
									disabled={user?.role !== "ADMIN"}
									size="lg">
									<Plus className='w-5 h-5' />
									{t("tenant.management.launchOrganization")}
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
			<div className='border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm'>
				<div className='px-4 sm:px-6 lg:px-8 py-6'>
					<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
						<div className='flex items-center gap-3'>
							<div className='p-2 rounded-xl bg-primary/10 shadow-sm'>
								<Building2 className='w-6 h-6 text-primary' />
							</div>
							<div>
								<h1 className='text-2xl sm:text-3xl font-bold text-foreground tracking-tight'>
									{tenant.name}
								</h1>
								<p className='text-sm text-muted-foreground'>
									{t("tenant.management.enterpriseCommandCenter")}
								</p>
							</div>
						</div>
						<div className='flex items-center gap-3'>
							<Badge
								variant='secondary'
								className='text-xs font-semibold px-3 py-1.5 bg-muted/50'>
								{user?.role}
							</Badge>
							{user?.role === "ADMIN" ? (
								<Button
									onClick={() => setShowSettings(true)}
									variant='outline'
									size='sm'
									className='gap-2 shadow-sm hover:shadow-md transition-all'>
									<Settings className='w-4 h-4' />
									{t("tenant.management.settings")}
								</Button>
							) : (
								<div className='text-xs text-muted-foreground px-3 py-2 bg-muted/30 rounded-lg border border-border/50'>
									{t("tenant.management.onlyAdminsCanModify")}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8'>

				{/* Organization Details */}
				<div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
					{/* Basic Information */}
					<Card className='border border-border/50 bg-card shadow-md rounded-2xl'>
						<CardHeader className='pb-4'>
							<CardTitle className='flex items-center gap-2 text-base font-semibold'>
								<div className='p-2 bg-primary/10 rounded-lg'>
									<Building2 className='w-4 h-4 text-primary' />
								</div>
								{t("tenant.management.enterpriseInformation.title")}
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							<div className='flex items-center justify-between p-3 bg-muted/30 border border-border/30 rounded-lg'>
								<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
									{t(
										"tenant.management.enterpriseInformation.organizationName",
									)}
								</span>
								<span className='text-sm font-bold text-foreground'>
									{tenant.name}
								</span>
							</div>
							<div className='flex items-center justify-between p-3 bg-muted/30 border border-border/30 rounded-lg'>
								<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
									{t("tenant.management.enterpriseInformation.established")}
								</span>
								<span className='text-sm font-medium text-foreground'>
									{formatDate(tenant.createdAt)}
								</span>
							</div>
							<div className='flex items-center justify-between p-3 bg-muted/30 border border-border/30 rounded-lg'>
								<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
									{t("tenant.management.enterpriseInformation.lastUpdated")}
								</span>
								<span className='text-sm font-medium text-foreground'>
									{formatDate(tenant.updatedAt)}
								</span>
							</div>
							{tenant.timezone && (
								<div className='flex items-center justify-between p-3 bg-muted/30 border border-border/30 rounded-lg'>
									<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
										{t("tenant.management.enterpriseInformation.timezone")}
									</span>
									<span className='text-sm font-medium text-foreground flex items-center gap-2'>
										<Globe className='w-4 h-4 text-muted-foreground' />
										{tenant.timezone}
									</span>
								</div>
							)}
							{tenant.language && (
								<div className='flex items-center justify-between p-3 bg-muted/30 border border-border/30 rounded-lg'>
									<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
										{t("tenant.management.enterpriseInformation.language")}
									</span>
									<span className='text-sm font-medium text-foreground'>
										{tenant.language.toUpperCase()}
									</span>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Contact Information */}
					<Card className='border border-border/50 bg-card shadow-md rounded-2xl'>
						<CardHeader className='pb-4'>
							<CardTitle className='flex items-center gap-2 text-base font-semibold'>
								<div className='p-2 bg-primary/10 rounded-lg'>
									<Mail className='w-4 h-4 text-primary' />
								</div>
								{t("tenant.management.businessContact.title")}
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							{tenant.companyEmail ? (
								<div className='flex items-center gap-3 p-3 bg-muted/30 border border-border/30 rounded-lg'>
									<div className='p-2 bg-primary/10 rounded-lg flex-shrink-0'>
										<Mail className='w-4 h-4 text-primary' />
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-semibold text-foreground truncate'>
											{tenant.companyEmail}
										</p>
										<p className='text-xs text-muted-foreground'>
											{t(
												"tenant.management.businessContact.primaryBusinessEmail",
											)}
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50'>
									<Mail className='w-8 h-8 mx-auto mb-2 opacity-50' />
									<p className='text-xs font-medium'>
										{t("tenant.management.businessContact.noBusinessEmail")}
									</p>
								</div>
							)}

							{tenant.phone ? (
								<div className='flex items-center gap-3 p-3 bg-muted/30 border border-border/30 rounded-lg'>
									<div className='p-2 bg-primary/10 rounded-lg flex-shrink-0'>
										<Phone className='w-4 h-4 text-primary' />
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-semibold text-foreground'>
											{tenant.phone}
										</p>
										<p className='text-xs text-muted-foreground'>
											{t("tenant.management.businessContact.businessPhone")}
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50'>
									<Phone className='w-8 h-8 mx-auto mb-2 opacity-50' />
									<p className='text-xs font-medium'>
										{t("tenant.management.businessContact.noPhoneNumber")}
									</p>
								</div>
							)}

							{tenant.website ? (
								<div className='flex items-center gap-3 p-3 bg-muted/30 border border-border/30 rounded-lg'>
									<div className='p-2 bg-primary/10 rounded-lg flex-shrink-0'>
										<ExternalLink className='w-4 h-4 text-primary' />
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-semibold text-foreground truncate'>
											{tenant.website}
										</p>
										<p className='text-xs text-muted-foreground'>
											{t("tenant.management.businessContact.corporateWebsite")}
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50'>
									<ExternalLink className='w-8 h-8 mx-auto mb-2 opacity-50' />
									<p className='text-xs font-medium'>
										{t("tenant.management.businessContact.noWebsite")}
									</p>
								</div>
							)}

							{tenant.address ? (
								<div className='flex items-center gap-3 p-3 bg-muted/30 border border-border/30 rounded-lg'>
									<div className='p-2 bg-primary/10 rounded-lg flex-shrink-0'>
										<MapPin className='w-4 h-4 text-primary' />
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-semibold text-foreground'>
											{tenant.address}
										</p>
										<p className='text-xs text-muted-foreground'>
											{t("tenant.management.businessContact.businessAddress")}
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50'>
									<MapPin className='w-8 h-8 mx-auto mb-2 opacity-50' />
									<p className='text-xs font-medium'>
										{t("tenant.management.businessContact.noAddress")}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

				</div>

				{/* Billing Information - Full Width */}
				<Card className='border border-border/50 bg-card shadow-md rounded-2xl'>
					<CardHeader className='pb-4'>
						<CardTitle className='flex items-center gap-2 text-base font-semibold'>
							<div className='p-2 bg-primary/10 rounded-lg'>
								<Receipt className='w-4 h-4 text-primary' />
							</div>
							{t("tenant.management.billing.title")}
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						{(tenant as any).companyTaxId ||
						(tenant as any).registrationNumber ? (
							<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
								{/* Informații Fiscale */}
								<div className='p-4 bg-muted/30 border border-border/30 rounded-lg'>
									<h4 className='font-semibold text-sm text-foreground mb-3 flex items-center gap-2'>
										<FileText className='w-4 h-4 text-muted-foreground' />
										{t("tenant.management.billing.fiscalInformation")}
									</h4>
									{(tenant as any).companyTaxId && (
										<div className='flex items-center justify-between mb-2'>
											<span className='text-xs font-medium text-muted-foreground'>
												{t("tenant.management.billing.taxCode")}
											</span>
											<span className='text-sm font-bold text-foreground'>
												{(tenant as any).companyTaxId}
											</span>
										</div>
									)}
									{(tenant as any).registrationNumber && (
										<div className='flex items-center justify-between'>
											<span className='text-xs font-medium text-muted-foreground'>
												{t("tenant.management.billing.registrationNumber")}
											</span>
											<span className='text-sm font-bold text-foreground'>
												{(tenant as any).registrationNumber}
											</span>
										</div>
									)}
								</div>

								{/* Adresa Sediului Social */}
								{((tenant as any).companyStreet ||
									(tenant as any).companyCity) && (
									<div className='p-4 bg-muted/30 border border-border/30 rounded-lg'>
										<h4 className='font-semibold text-sm text-foreground mb-3 flex items-center gap-2'>
											<MapPin className='w-4 h-4 text-muted-foreground' />
											{t("tenant.management.billing.registeredOffice")}
										</h4>
										<div className='space-y-2'>
											{(tenant as any).companyStreet && (
												<div className='text-sm text-foreground'>
													<span className='font-medium'>
														{(tenant as any).companyStreet}
														{(tenant as any).companyStreetNumber &&
															` ${(tenant as any).companyStreetNumber}`}
													</span>
												</div>
											)}
											{(tenant as any).companyCity && (
												<div className='text-sm text-foreground'>
													{(tenant as any).companyCity}
													{(tenant as any).companyPostalCode &&
														`, ${(tenant as any).companyPostalCode}`}
												</div>
											)}
											{(tenant as any).companyCountry && (
												<div className='text-sm text-muted-foreground font-medium'>
													{(tenant as any).companyCountry}
												</div>
											)}
										</div>
									</div>
								)}

								{/* Date Bancare */}
								{((tenant as any).companyIban ||
									(tenant as any).companyBank) && (
									<div className='p-4 bg-muted/30 border border-border/30 rounded-lg'>
										<h4 className='font-semibold text-sm text-foreground mb-3 flex items-center gap-2'>
											<CreditCard className='w-4 h-4 text-muted-foreground' />
											{t("tenant.management.billing.bankingDetails")}
										</h4>
										{(tenant as any).companyIban && (
											<div className='flex items-center justify-between mb-2'>
												<span className='text-xs font-medium text-muted-foreground'>
													{t("tenant.settings.companyIban")}
												</span>
												<span className='text-sm font-bold text-foreground font-mono'>
													{(tenant as any).companyIban}
												</span>
											</div>
										)}
										{(tenant as any).companyBank && (
											<div className='flex items-center justify-between'>
												<span className='text-xs font-medium text-muted-foreground'>
													{t("tenant.settings.companyBank")}
												</span>
												<span className='text-sm font-bold text-foreground'>
													{(tenant as any).companyBank}
												</span>
											</div>
										)}
									</div>
								)}
							</div>
						) : (
							<div className='text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50'>
								<Receipt className='w-10 h-10 mx-auto mb-3 opacity-50' />
								<p className='text-sm font-medium'>
									{t("tenant.management.billing.billingNotConfigured")}
								</p>
								<p className='text-xs text-muted-foreground mt-1'>
									{t("tenant.management.billing.configureFiscalInfo")}
								</p>
								{user?.role === "ADMIN" && (
									<Button
										onClick={() => setShowSettings(true)}
										variant='outline'
										size='sm'
										className='mt-3 gap-2'>
										<Settings className='w-4 h-4' />
										{t("tenant.management.billing.configure")}
									</Button>
								)}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Modules Management */}
				{user?.role === "ADMIN" && (
					<Card className='border border-border/50 bg-card shadow-md rounded-2xl'>
						<CardHeader className='pb-4'>
							<CardTitle className='flex items-center gap-2 text-base font-semibold'>
								<div className='p-2 bg-primary/10 rounded-lg'>
									<Puzzle className='w-4 h-4 text-primary' />
								</div>
								{t("tenant.management.modules.title") || "Module Management"}
							</CardTitle>
							<CardDescription className='text-sm text-muted-foreground'>
								{t("tenant.management.modules.description") ||
									"Enable or disable optional modules for your databases. Module tables are excluded from plan limits."}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ModuleManager />
						</CardContent>
					</Card>
				)}
				
				{/* Quick Actions */}
				<Card className='border border-border/50 bg-card shadow-md rounded-2xl'>
					<CardHeader className='pb-4'>
						<CardTitle className='flex items-center gap-2 text-base font-semibold'>
							<div className='p-2 bg-primary/10 rounded-lg'>
								<Zap className='w-4 h-4 text-primary' />
							</div>
							{t("tenant.management.enterpriseActions.title")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<Link href='/home/users'>
								<Button
									variant='outline'
									className='h-auto p-6 flex flex-col items-center gap-3 w-full shadow-sm hover:shadow-md transition-all duration-200 border border-border hover:border-primary/50'>
									<div className='p-3 bg-primary/10 rounded-xl'>
										<Users className='w-6 h-6 text-primary' />
									</div>
									<span className='font-semibold text-sm'>
										{user?.role === "ADMIN"
											? t("tenant.management.enterpriseActions.manageTeam")
											: t("tenant.management.enterpriseActions.viewTeam")}
									</span>
									<span className='text-xs text-muted-foreground text-center leading-relaxed'>
										{user?.role === "ADMIN"
											? t(
													"tenant.management.enterpriseActions.commandWorkforce",
											  )
											: t("tenant.management.enterpriseActions.monitorTeam")}
									</span>
								</Button>
							</Link>
							<Link href='/home/database'>
								<Button
									variant='outline'
									className='h-auto p-6 flex flex-col items-center gap-3 w-full shadow-sm hover:shadow-md transition-all duration-200 border border-border hover:border-primary/50'>
									<div className='p-3 bg-primary/10 rounded-xl'>
										<Database className='w-6 h-6 text-primary' />
									</div>
									<span className='font-semibold text-sm'>
										{t("tenant.management.enterpriseActions.dataCommandCenter")}
									</span>
									<span className='text-xs text-muted-foreground text-center leading-relaxed'>
										{t(
											"tenant.management.enterpriseActions.accessDataInfrastructure",
										)}
									</span>
								</Button>
							</Link>
							{user?.role === "ADMIN" ? (
								<Button
									variant='outline'
									className='h-auto p-6 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200 border border-border hover:border-primary/50'
									onClick={() => setShowSettings(true)}>
									<div className='p-3 bg-primary/10 rounded-xl'>
										<Settings className='w-6 h-6 text-primary' />
									</div>
									<span className='font-semibold text-sm'>
										{t(
											"tenant.management.enterpriseActions.enterpriseSettings",
										)}
									</span>
									<span className='text-xs text-muted-foreground text-center leading-relaxed'>
										{t(
											"tenant.management.enterpriseActions.configurePreferences",
										)}
									</span>
								</Button>
							) : (
								<div className='h-auto p-6 flex flex-col items-center gap-3 border border-dashed border-border/50 rounded-lg bg-muted/20'>
									<div className='p-3 bg-muted/50 rounded-xl'>
										<Settings className='w-6 h-6 text-muted-foreground' />
									</div>
									<span className='text-muted-foreground font-semibold text-sm'>
										{t(
											"tenant.management.enterpriseActions.enterpriseSettings",
										)}
									</span>
									<span className='text-xs text-muted-foreground text-center leading-relaxed'>
										{t(
											"tenant.management.enterpriseActions.adminPrivilegesRequired",
										)}
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
