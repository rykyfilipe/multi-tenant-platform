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
			<div className='min-h-screen bg-background'>
				{/* Header */}
				<div className='border-b border-border bg-background sticky top-0 z-50 shadow-sm'>
					<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
						<div className='flex items-center gap-4'>
							<div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border flex items-center justify-center shadow-sm'>
								<Building2 className='w-7 h-7 text-primary' />
							</div>
							<div>
								<h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight'>
									{t("tenant.management.title")}
								</h1>
								<p className='text-sm sm:text-base text-muted-foreground mt-1'>
									{t("tenant.management.subtitle")}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24'>
					<Card className='border border-border bg-card shadow-xl overflow-hidden'>
						<CardHeader className='text-center pb-8 pt-12 bg-muted/30'>
							<div className='w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md border border-border'>
								<Building2 className='w-12 h-12 text-primary' />
							</div>
							<CardTitle className='text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3'>
								{t("tenant.management.noOrganization.title")}
							</CardTitle>
							<p className='text-base sm:text-lg text-muted-foreground max-w-xl mx-auto'>
								{t("tenant.management.noOrganization.subtitle")}
							</p>
						</CardHeader>
						<CardContent className='px-6 sm:px-12 py-12 space-y-8'>
							<div className='max-w-2xl mx-auto'>
								<p className='text-sm sm:text-base text-muted-foreground leading-relaxed text-center'>
									{t("tenant.management.noOrganization.description")}
								</p>
							</div>
							<div className='flex justify-center pt-4'>
								<Button
									onClick={() => setShowForm(true)}
									className='gap-2 px-10 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 h-auto'
									disabled={user?.role !== "ADMIN"}
									size="lg">
									<Plus className='w-5 h-5' />
									{t("tenant.management.launchOrganization")}
								</Button>
							</div>
							{user?.role !== "ADMIN" && (
								<div className='max-w-md mx-auto mt-8 p-4 bg-muted/50 border border-border rounded-xl text-center'>
									<p className='text-xs text-muted-foreground'>
										Only administrators can create organizations
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{showForm && <AddTenantForm setShowForm={setShowForm} />}
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<div className='border-b border-border bg-background sticky top-0 z-50 shadow-sm'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
					<div className='flex flex-col lg:flex-row lg:items-center justify-between gap-6'>
						<div className='flex items-center gap-4'>
							<div className='w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border flex items-center justify-center shadow-sm'>
								<Building2 className='w-7 h-7 sm:w-8 sm:h-8 text-primary' />
							</div>
							<div>
								<h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight'>
									{tenant.name}
								</h1>
								<p className='text-sm sm:text-base text-muted-foreground mt-1'>
									{t("tenant.management.enterpriseCommandCenter")}
								</p>
							</div>
						</div>
						<div className='flex items-center gap-3'>
							<Badge
								variant='secondary'
								className='text-xs font-semibold px-4 py-2 bg-primary/10 text-primary border-primary/20'>
								{user?.role}
							</Badge>
							{user?.role === "ADMIN" ? (
								<Button
									onClick={() => setShowSettings(true)}
									variant='outline'
									size='default'
									className='gap-2 shadow-sm hover:shadow-md transition-all duration-200 border-border bg-card hover:bg-muted/50'>
									<Settings className='w-4 h-4' />
									<span className='hidden sm:inline'>{t("tenant.management.settings")}</span>
								</Button>
							) : (
								<div className='text-xs text-muted-foreground px-4 py-2 bg-muted/50 rounded-xl border border-border'>
									{t("tenant.management.onlyAdminsCanModify")}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 space-y-8'>

				{/* Organization Details */}
				<div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
					{/* Basic Information */}
					<Card className='border border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group'>
						<CardHeader className='pb-5 bg-muted/30 border-b border-border'>
							<CardTitle className='flex items-center gap-3 text-lg font-bold'>
								<div className='w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
									<Building2 className='w-5 h-5 text-primary' />
								</div>
								{t("tenant.management.enterpriseInformation.title")}
							</CardTitle>
						</CardHeader>
						<CardContent className='p-6 space-y-4'>
							<div className='space-y-3'>
								<div className='flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-colors duration-200'>
									<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
										{t("tenant.management.enterpriseInformation.organizationName")}
									</span>
									<span className='text-sm font-bold text-foreground'>
										{tenant.name}
									</span>
								</div>
								<div className='flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-colors duration-200'>
									<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
										{t("tenant.management.enterpriseInformation.established")}
									</span>
									<span className='text-sm font-medium text-foreground'>
										{formatDate(tenant.createdAt)}
									</span>
								</div>
								<div className='flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-colors duration-200'>
									<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
										{t("tenant.management.enterpriseInformation.lastUpdated")}
									</span>
									<span className='text-sm font-medium text-foreground'>
										{formatDate(tenant.updatedAt)}
									</span>
								</div>
								{tenant.timezone && (
									<div className='flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-colors duration-200'>
										<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
											{t("tenant.management.enterpriseInformation.timezone")}
										</span>
										<span className='text-sm font-medium text-foreground flex items-center gap-2'>
											<Globe className='w-4 h-4 text-muted-foreground' />
											{tenant.timezone}
										</span>
									</div>
								)}
								{tenant.language && (
									<div className='flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-colors duration-200'>
										<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
											{t("tenant.management.enterpriseInformation.language")}
										</span>
										<span className='text-sm font-medium text-foreground'>
											{tenant.language.toUpperCase()}
										</span>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Contact Information */}
					<Card className='border border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group'>
						<CardHeader className='pb-5 bg-muted/30 border-b border-border'>
							<CardTitle className='flex items-center gap-3 text-lg font-bold'>
								<div className='w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
									<Mail className='w-5 h-5 text-primary' />
								</div>
								{t("tenant.management.businessContact.title")}
							</CardTitle>
						</CardHeader>
						<CardContent className='p-6 space-y-3'>
							{tenant.companyEmail ? (
								<div className='flex items-center gap-4 p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-all duration-200 group'>
									<div className='w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200'>
										<Mail className='w-5 h-5 text-primary' />
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-semibold text-foreground truncate'>
											{tenant.companyEmail}
										</p>
										<p className='text-xs text-muted-foreground'>
											{t("tenant.management.businessContact.primaryBusinessEmail")}
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border'>
									<Mail className='w-10 h-10 mx-auto mb-3 opacity-40' />
									<p className='text-xs font-medium'>
										{t("tenant.management.businessContact.noBusinessEmail")}
									</p>
								</div>
							)}

							{tenant.phone ? (
								<div className='flex items-center gap-4 p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-all duration-200 group'>
									<div className='w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200'>
										<Phone className='w-5 h-5 text-primary' />
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
								<div className='text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border'>
									<Phone className='w-10 h-10 mx-auto mb-3 opacity-40' />
									<p className='text-xs font-medium'>
										{t("tenant.management.businessContact.noPhoneNumber")}
									</p>
								</div>
							)}

							{tenant.website ? (
								<div className='flex items-center gap-4 p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-all duration-200 group'>
									<div className='w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200'>
										<ExternalLink className='w-5 h-5 text-primary' />
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
								<div className='text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border'>
									<ExternalLink className='w-10 h-10 mx-auto mb-3 opacity-40' />
									<p className='text-xs font-medium'>
										{t("tenant.management.businessContact.noWebsite")}
									</p>
								</div>
							)}

							{tenant.address ? (
								<div className='flex items-center gap-4 p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-all duration-200 group'>
									<div className='w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200'>
										<MapPin className='w-5 h-5 text-primary' />
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
								<div className='text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border'>
									<MapPin className='w-10 h-10 mx-auto mb-3 opacity-40' />
									<p className='text-xs font-medium'>
										{t("tenant.management.businessContact.noAddress")}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

				</div>

				{/* Billing Information - Full Width */}
				<Card className='border border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group'>
					<CardHeader className='pb-5 bg-muted/30 border-b border-border'>
						<CardTitle className='flex items-center gap-3 text-lg font-bold'>
							<div className='w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
								<Receipt className='w-5 h-5 text-primary' />
							</div>
							{t("tenant.management.billing.title")}
						</CardTitle>
					</CardHeader>
					<CardContent className='p-6'>
						{(tenant as any).companyTaxId ||
						(tenant as any).registrationNumber ? (
							<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
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
							<div className='text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border'>
								<Receipt className='w-16 h-16 mx-auto mb-4 opacity-40' />
								<p className='text-base font-semibold mb-1'>
									{t("tenant.management.billing.billingNotConfigured")}
								</p>
								<p className='text-sm text-muted-foreground mb-6 max-w-md mx-auto'>
									{t("tenant.management.billing.configureFiscalInfo")}
								</p>
								{user?.role === "ADMIN" && (
									<Button
										onClick={() => setShowSettings(true)}
										variant='outline'
										className='gap-2 shadow-sm hover:shadow-md transition-all duration-200'>
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
					<Card className='border border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group'>
						<CardHeader className='pb-5 bg-muted/30 border-b border-border'>
							<CardTitle className='flex items-center gap-3 text-lg font-bold'>
								<div className='w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
									<Puzzle className='w-5 h-5 text-primary' />
								</div>
								{t("tenant.management.modules.title") || "Module Management"}
							</CardTitle>
							<CardDescription className='text-sm text-muted-foreground mt-2'>
								{t("tenant.management.modules.description") ||
									"Enable or disable optional modules for your databases. Module tables are excluded from plan limits."}
							</CardDescription>
						</CardHeader>
						<CardContent className='p-6'>
							<ModuleManager />
						</CardContent>
					</Card>
				)}
				
				{/* Quick Actions */}
				<Card className='border border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group'>
					<CardHeader className='pb-5 bg-muted/30 border-b border-border'>
						<CardTitle className='flex items-center gap-3 text-lg font-bold'>
							<div className='w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
								<Zap className='w-5 h-5 text-primary' />
							</div>
							{t("tenant.management.enterpriseActions.title")}
						</CardTitle>
					</CardHeader>
					<CardContent className='p-6'>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							<Link href='/home/users'>
								<Button
									variant='outline'
									className='h-auto p-8 flex flex-col items-center justify-center gap-4 w-full shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/50 hover:bg-muted/30 group'>
									<div className='w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm'>
										<Users className='w-7 h-7 text-primary' />
									</div>
									<div className='space-y-2'>
										<span className='font-bold text-base text-foreground block'>
											{user?.role === "ADMIN"
												? t("tenant.management.enterpriseActions.manageTeam")
												: t("tenant.management.enterpriseActions.viewTeam")}
										</span>
										<span className='text-xs text-muted-foreground text-center leading-relaxed block'>
											{user?.role === "ADMIN"
												? t("tenant.management.enterpriseActions.commandWorkforce")
												: t("tenant.management.enterpriseActions.monitorTeam")}
										</span>
									</div>
								</Button>
							</Link>
							<Link href='/home/database'>
								<Button
									variant='outline'
									className='h-auto p-8 flex flex-col items-center justify-center gap-4 w-full shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/50 hover:bg-muted/30 group'>
									<div className='w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm'>
										<Database className='w-7 h-7 text-primary' />
									</div>
									<div className='space-y-2'>
										<span className='font-bold text-base text-foreground block'>
											{t("tenant.management.enterpriseActions.dataCommandCenter")}
										</span>
										<span className='text-xs text-muted-foreground text-center leading-relaxed block'>
											{t("tenant.management.enterpriseActions.accessDataInfrastructure")}
										</span>
									</div>
								</Button>
							</Link>
							{user?.role === "ADMIN" ? (
								<Button
									variant='outline'
									className='h-auto p-8 flex flex-col items-center justify-center gap-4 shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/50 hover:bg-muted/30 group'
									onClick={() => setShowSettings(true)}>
									<div className='w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm'>
										<Settings className='w-7 h-7 text-primary' />
									</div>
									<div className='space-y-2'>
										<span className='font-bold text-base text-foreground block'>
											{t("tenant.management.enterpriseActions.enterpriseSettings")}
										</span>
										<span className='text-xs text-muted-foreground text-center leading-relaxed block'>
											{t("tenant.management.enterpriseActions.configurePreferences")}
										</span>
									</div>
								</Button>
							) : (
								<div className='h-auto p-8 flex flex-col items-center justify-center gap-4 border border-dashed border-border rounded-xl bg-muted/20'>
									<div className='w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center shadow-sm'>
										<Settings className='w-7 h-7 text-muted-foreground' />
									</div>
									<div className='space-y-2'>
										<span className='text-muted-foreground font-bold text-base block'>
											{t("tenant.management.enterpriseActions.enterpriseSettings")}
										</span>
										<span className='text-xs text-muted-foreground text-center leading-relaxed block'>
											{t("tenant.management.enterpriseActions.adminPrivilegesRequired")}
										</span>
									</div>
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
