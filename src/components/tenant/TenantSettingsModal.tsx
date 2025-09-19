/** @format */

"use client";

import { useState } from "react";
import {
	Settings,
	Building2,
	Palette,
	Globe,
	Save,
	X,
	Shield,
	Zap,
	TrendingUp,
} from "lucide-react";
import { useTenantTheme } from "@/contexts/ThemeContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tenant } from "@/types/tenant";
import {
	PremiumTabs,
	PremiumTabsContent,
	PremiumTabsList,
	PremiumTabsTrigger,
} from "../ui/premium-tabs";
import LogoUpload from "./LogoUpload";

interface Props {
	tenant: Tenant;
	onClose: () => void;
}

function TenantSettingsModal({ tenant, onClose }: Props) {
	const [activeTab, setActiveTab] = useState("general");
	const [loading, setLoading] = useState(false);
	const { showAlert, token, setTenant, user } = useApp();
	const { t } = useLanguage();
	const { setTheme } = useTenantTheme();

	const [formData, setFormData] = useState({
		name: tenant.name,
		companyEmail: tenant.companyEmail || "",
		phone: tenant.phone || "",
		website: tenant.website || "",
		address: tenant.address || "",
		timezone: tenant.timezone || "UTC",
		language: tenant.language || "en",
		logoUrl: tenant.logoUrl || "",
		defaultCurrency: tenant.defaultCurrency || "USD",
		theme: tenant.theme || "light",
		// Câmpuri obligatorii pentru facturi
		companyTaxId: (tenant as any).companyTaxId || "",
		registrationNumber: (tenant as any).registrationNumber || "",
		companyStreet: (tenant as any).companyStreet || "",
		companyStreetNumber: (tenant as any).companyStreetNumber || "",
		companyCity: (tenant as any).companyCity || "",
		companyCountry: (tenant as any).companyCountry || "România",
		companyPostalCode: (tenant as any).companyPostalCode || "",
		companyIban: (tenant as any).companyIban || "",
		companyBank: (tenant as any).companyBank || "",
		// Invoice numbering settings
		invoiceStartNumber: (tenant as any).invoiceStartNumber || 1,
		invoiceSeriesPrefix: (tenant as any).invoiceSeriesPrefix || "INV",
		invoiceIncludeYear: (tenant as any).invoiceIncludeYear !== false, // default true
	});

	// Check if user is admin
	if (user?.role !== "ADMIN") {
		return (
			<Dialog open={true} onOpenChange={onClose}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader className='text-center pb-6'>
						<div className='w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
							<Shield className='w-10 h-10 text-red-600 dark:text-red-400' />
						</div>
						<DialogTitle className='text-xl font-bold tracking-tight'>
							{t("message.accessRestricted")}
						</DialogTitle>
						<p className='text-sm text-muted-foreground font-medium'>
							{t("message.adminRequired")}
						</p>
					</DialogHeader>
					<div className='text-center py-6'>
						<h3 className='text-lg font-semibold text-foreground mb-3'>
							{t("tenant.enterpriseSettingsLocked")}
						</h3>
						<p className='text-sm text-muted-foreground mb-6 leading-relaxed'>
							{t("tenant.onlyAdminsCanModify")}
						</p>
						<Button
							onClick={onClose}
							className='w-full h-12 text-base font-semibold shadow-lg'>
							{t("common.close")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch(`/api/tenants/${tenant.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorText = await response.text();
				showAlert(t("tenant.failedToUpdateSettings"), "error");
			} else {
				const updatedTenant = await response.json();
				setTenant(updatedTenant);

				// Sync theme with ThemeContext if theme was changed
				if (updatedTenant.theme && updatedTenant.theme !== tenant.theme) {
					setTheme(updatedTenant.theme);
				}

				showAlert(t("message.settingsUpdated"), "success");
				onClose();
			}
		} catch (error) {
			showAlert(t("tenant.networkOrServerError"), "error");
		} finally {
			setLoading(false);
		}
	};

	const timezones = [
		"UTC",
		"America/New_York",
		"America/Chicago",
		"America/Denver",
		"America/Los_Angeles",
		"Europe/London",
		"Europe/Paris",
		"Europe/Berlin",
		"Europe/Bucharest",
		"Asia/Tokyo",
		"Asia/Shanghai",
		"Australia/Sydney",
	];

	const languages = [
		{ code: "en", name: t("languages.english") },
		{ code: "ro", name: t("languages.romanian") },
		{ code: "es", name: t("languages.spanish") },
		{ code: "fr", name: t("languages.french") },
		{ code: "de", name: t("languages.german") },
		{ code: "zh", name: t("languages.chinese") },
		{ code: "ru", name: t("languages.russian") },
	];

	const themes = [
		{ value: "light", name: t("themes.light") },
		{ value: "dark", name: t("themes.dark") },
		{ value: "system", name: t("themes.system") },
	];

	return (
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className='w-[95vw] max-w-[95vw] sm:max-w-3xl max-h-[95vh] overflow-y-auto'>
				<DialogHeader className='text-center pb-3 sm:pb-6'>
					<div className='p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full w-fit mx-auto mb-3 sm:p-4 sm:mb-4'>
						<Settings className='w-6 h-6 text-primary sm:w-8 sm:h-8' />
					</div>
					<DialogTitle className='text-lg font-bold tracking-tight sm:text-2xl'>
						{t("tenant.enterpriseConfiguration")}
					</DialogTitle>
					<p className='text-xs text-muted-foreground font-medium sm:text-sm'>
						{t("tenant.manageOrganizationSettings")}
					</p>
				</DialogHeader>

				<PremiumTabs
					value={activeTab}
					onValueChange={setActiveTab}
					className='w-full'>
					<PremiumTabsList className='grid w-full grid-cols-2 h-10 sm:grid-cols-4 sm:h-12'>
						<PremiumTabsTrigger
							value='general'
							className='flex items-center gap-1 font-semibold text-xs sm:gap-2 sm:text-sm'>
							<Building2 className='w-3 h-3 sm:w-4 sm:h-4' />
							<span className="hidden sm:inline">{t("tenant.general")}</span>
							<span className="sm:hidden">Gen</span>
						</PremiumTabsTrigger>
						<PremiumTabsTrigger
							value='contact'
							className='flex items-center gap-1 font-semibold text-xs sm:gap-2 sm:text-sm'>
							<Globe className='w-3 h-3 sm:w-4 sm:h-4' />
							<span className="hidden sm:inline">{t("tenant.contact")}</span>
							<span className="sm:hidden">Contact</span>
						</PremiumTabsTrigger>
						<PremiumTabsTrigger
							value='invoice'
							className='flex items-center gap-1 font-semibold text-xs sm:gap-2 sm:text-sm'>
							<TrendingUp className='w-3 h-3 sm:w-4 sm:h-4' />
							<span className="hidden sm:inline">{t("tenant.invoice")}</span>
							<span className="sm:hidden">Invoice</span>
						</PremiumTabsTrigger>
						<PremiumTabsTrigger
							value='appearance'
							className='flex items-center gap-1 font-semibold text-xs sm:gap-2 sm:text-sm'>
							<Palette className='w-3 h-3 sm:w-4 sm:h-4' />
							<span className="hidden sm:inline">{t("tenant.appearance")}</span>
							<span className="sm:hidden">Theme</span>
						</PremiumTabsTrigger>
					</PremiumTabsList>

					<form onSubmit={handleSubmit} className='space-y-4 mt-4 sm:space-y-8 sm:mt-8'>
						{/* General Settings */}
						<PremiumTabsContent value='general' className='space-y-6'>
							<div className='space-y-3'>
								<Label
									htmlFor='name'
									className='text-sm font-semibold flex items-center gap-2'>
									<Shield className='w-4 h-4 text-primary' />
									{t("tenant.organizationName")} *
								</Label>
								<Input
									id='name'
									value={formData.name}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, name: e.target.value }))
									}
									disabled={loading}
									required
									className='h-12 text-base font-medium'
								/>
							</div>

							<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='timezone'>{t("tenant.timezone")}</Label>
									<Select
										value={formData.timezone}
										onValueChange={(value) =>
											setFormData((prev) => ({
												...prev,
												timezone: value,
											}))
										}
										disabled={loading}
									>
										<SelectTrigger className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring'>
											<SelectValue placeholder="Select timezone" />
										</SelectTrigger>
										<SelectContent>
											{timezones.map((tz) => (
												<SelectItem key={tz} value={tz}>
													{tz}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='defaultCurrency'>
										{t("tenant.defaultCurrency")}
									</Label>
									<select
										id='defaultCurrency'
										value={formData.defaultCurrency}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												defaultCurrency: e.target.value,
											}))
										}
										disabled={loading}
										className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring'>
										<option value='USD'>USD - US Dollar</option>
										<option value='EUR'>EUR - Euro</option>
										<option value='RON'>RON - Romanian Leu</option>
										<option value='GBP'>GBP - British Pound</option>
										<option value='JPY'>JPY - Japanese Yen</option>
										<option value='CAD'>CAD - Canadian Dollar</option>
										<option value='AUD'>AUD - Australian Dollar</option>
										<option value='CHF'>CHF - Swiss Franc</option>
									</select>
								</div>
							</div>

							<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='language'>{t("tenant.language")}</Label>
									<select
										id='language'
										value={formData.language}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												language: e.target.value,
											}))
										}
										disabled={loading}
										className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring'>
										{languages.map((lang) => (
											<option key={lang.code} value={lang.code}>
												{lang.name}
											</option>
										))}
									</select>
								</div>
							</div>
						</PremiumTabsContent>

						{/* Contact Settings */}
						<PremiumTabsContent value='contact' className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='companyEmail'>{t("tenant.companyEmail")}</Label>
								<Input
									id='companyEmail'
									type='email'
									placeholder='contact@company.com'
									value={formData.companyEmail}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											companyEmail: e.target.value,
										}))
									}
									disabled={loading}
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='phone'>{t("tenant.phone")}</Label>
								<Input
									id='phone'
									type='tel'
									placeholder='+1 (555) 123-4567'
									value={formData.phone}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, phone: e.target.value }))
									}
									disabled={loading}
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='website'>{t("tenant.website")}</Label>
								<Input
									id='website'
									type='url'
									placeholder='https://www.company.com'
									value={formData.website}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											website: e.target.value,
										}))
									}
									disabled={loading}
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='address'>{t("tenant.address")}</Label>
								<Textarea
									id='address'
									placeholder='Enter company address'
									value={formData.address}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											address: e.target.value,
										}))
									}
									disabled={loading}
									rows={3}
								/>
							</div>
						</PremiumTabsContent>

						{/* Invoice Settings */}
						<PremiumTabsContent value='invoice' className='space-y-4'>
							<div className='mb-6'>
								<h3 className='text-lg font-semibold text-foreground mb-2'>
									{t("invoice.companyDetails")}
								</h3>
								<p className='text-sm text-muted-foreground'>
									{t("invoice.companyDetailsDescription")}
								</p>
							</div>

							<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='companyTaxId'>
										{t("invoice.companyTaxId")} *
									</Label>
									<Input
										id='companyTaxId'
										placeholder='RO12345678'
										value={formData.companyTaxId}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												companyTaxId: e.target.value,
											}))
										}
										disabled={loading}
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='registrationNumber'>
										{t("invoice.registrationNumber")} *
									</Label>
									<Input
										id='registrationNumber'
										placeholder='J40/1234/2023'
										value={formData.registrationNumber}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												registrationNumber: e.target.value,
											}))
										}
										disabled={loading}
										required
									/>
								</div>
							</div>

							<div className='space-y-4'>
								<h4 className='text-md font-semibold text-foreground'>
									{t("invoice.companyAddress")}
								</h4>

								<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4'>
									<div className='space-y-2 md:col-span-2'>
										<Label htmlFor='companyStreet'>
											{t("invoice.companyStreet")} *
										</Label>
										<Input
											id='companyStreet'
											placeholder='Calea Victoriei'
											value={formData.companyStreet}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													companyStreet: e.target.value,
												}))
											}
											disabled={loading}
											required
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='companyStreetNumber'>
											{t("invoice.companyStreetNumber")} *
										</Label>
										<Input
											id='companyStreetNumber'
											placeholder='123'
											value={formData.companyStreetNumber}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													companyStreetNumber: e.target.value,
												}))
											}
											disabled={loading}
											required
										/>
									</div>
								</div>

								<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='companyCity'>
											{t("invoice.companyCity")} *
										</Label>
										<Input
											id='companyCity'
											placeholder='București'
											value={formData.companyCity}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													companyCity: e.target.value,
												}))
											}
											disabled={loading}
											required
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='companyCountry'>
											{t("invoice.companyCountry")} *
										</Label>
										<Input
											id='companyCountry'
											placeholder='România'
											value={formData.companyCountry}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													companyCountry: e.target.value,
												}))
											}
											disabled={loading}
											required
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='companyPostalCode'>
											{t("invoice.companyPostalCode")} *
										</Label>
										<Input
											id='companyPostalCode'
											placeholder='010001'
											value={formData.companyPostalCode}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													companyPostalCode: e.target.value,
												}))
											}
											disabled={loading}
											required
										/>
									</div>
								</div>
							</div>

							<div className='space-y-4'>
								<h4 className='text-md font-semibold text-foreground'>
									{t("invoice.bankingDetails")}
								</h4>

								<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='companyIban'>
											{t("invoice.companyIban")}
										</Label>
										<Input
											id='companyIban'
											placeholder='RO49AAAA1B31007593840000'
											value={formData.companyIban}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													companyIban: e.target.value,
												}))
											}
											disabled={loading}
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='companyBank'>
											{t("invoice.companyBank")}
										</Label>
										<Input
											id='companyBank'
											placeholder='Banca Comercială Română'
											value={formData.companyBank}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													companyBank: e.target.value,
												}))
											}
											disabled={loading}
										/>
									</div>
								</div>
							</div>

							{/* Invoice Numbering Settings */}
							<div className='space-y-4 mt-8'>
								<h4 className='text-md font-semibold text-foreground'>
									{t("invoice.numberingSettings")}
								</h4>
								<p className='text-sm text-muted-foreground'>
									{t("invoice.numberingSettingsDescription")}
								</p>

								<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='invoiceSeriesPrefix'>
											{t("invoice.series")}
										</Label>
										<Input
											id='invoiceSeriesPrefix'
											placeholder='INV'
											value={formData.invoiceSeriesPrefix}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													invoiceSeriesPrefix: e.target.value,
												}))
											}
											disabled={loading}
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='invoiceStartNumber'>
											{t("invoice.startNumber")}
										</Label>
										<Input
											id='invoiceStartNumber'
											type='number'
											min='1'
											placeholder='1'
											value={formData.invoiceStartNumber}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													invoiceStartNumber: parseInt(e.target.value) || 1,
												}))
											}
											disabled={loading}
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='invoiceIncludeYear'>
											{t("invoice.includeYear")}
										</Label>
										<Select
											value={formData.invoiceIncludeYear ? 'yes' : 'no'}
											onValueChange={(value) =>
												setFormData((prev) => ({
													...prev,
													invoiceIncludeYear: value === 'yes',
												}))
											}
											disabled={loading}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='yes'>{t("common.yes")}</SelectItem>
												<SelectItem value='no'>{t("common.no")}</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className='p-4 bg-muted/50 rounded-lg'>
									<p className='text-sm text-muted-foreground'>
										<strong>{t("invoice.preview")}:</strong> {
											formData.invoiceIncludeYear 
												? `${formData.invoiceSeriesPrefix}-${new Date().getFullYear()}-${formData.invoiceStartNumber.toString().padStart(6, '0')}`
												: `${formData.invoiceSeriesPrefix}-${formData.invoiceStartNumber.toString().padStart(6, '0')}`
										}
									</p>
								</div>
							</div>
						</PremiumTabsContent>

						{/* Appearance Settings */}
						<PremiumTabsContent value='appearance' className='space-y-6'>
							<div className='space-y-4'>
								<h3 className='text-lg font-semibold text-foreground'>
									{t("tenant.logo")}
								</h3>
								<LogoUpload
									currentLogoUrl={formData.logoUrl}
									onLogoChange={(logoUrl) =>
										setFormData((prev) => ({ ...prev, logoUrl }))
									}
									disabled={loading}
								/>
							</div>

							<div className='space-y-4'>
								<h3 className='text-lg font-semibold text-foreground'>
									{t("tenant.theme")}
								</h3>
								<div className='space-y-2'>
									<Label htmlFor='theme'>{t("tenant.theme")}</Label>
									<select
										id='theme'
										value={formData.theme}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												theme: e.target.value,
											}))
										}
										disabled={loading}
										className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring'>
										{themes.map((theme) => (
											<option key={theme.value} value={theme.value}>
												{theme.name}
											</option>
										))}
									</select>
								</div>
							</div>
						</PremiumTabsContent>

						{/* Action Buttons */}
						<div className='flex flex-col gap-2 pt-4 border-t sm:flex-row sm:gap-4 sm:pt-6'>
							<Button
								type='button'
								variant='outline'
								onClick={onClose}
								className='flex-1 h-10 text-sm font-semibold sm:h-12 sm:text-base'>
								{t("common.cancel")}
							</Button>
							<Button
								type='submit'
								disabled={
									loading ||
									!formData.name.trim() ||
									(activeTab === "invoice" &&
										(!formData.companyTaxId.trim() ||
											!formData.registrationNumber.trim() ||
											!formData.companyStreet.trim() ||
											!formData.companyStreetNumber.trim() ||
											!formData.companyCity.trim() ||
											!formData.companyCountry.trim() ||
											!formData.companyPostalCode.trim()))
								}
								className='flex-1 h-10 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 gap-2 sm:h-12 sm:text-base'>
								<Save className='w-3 h-3 sm:w-4 sm:h-4' />
								{loading ? t("common.loading") : t("tenant.saveConfiguration")}
							</Button>
						</div>
					</form>
				</PremiumTabs>
			</DialogContent>
		</Dialog>
	);
}

export default TenantSettingsModal;
