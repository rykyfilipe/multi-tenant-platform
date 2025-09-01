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
	];

	const themes = [
		{ value: "light", name: t("themes.light") },
		{ value: "dark", name: t("themes.dark") },
		{ value: "system", name: t("themes.system") },
	];

	return (
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader className='text-center pb-6'>
					<div className='p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full w-fit mx-auto mb-4'>
						<Settings className='w-8 h-8 text-primary' />
					</div>
					<DialogTitle className='text-2xl font-bold tracking-tight'>
						{t("tenant.enterpriseConfiguration")}
					</DialogTitle>
					<p className='text-sm text-muted-foreground font-medium'>
						{t("tenant.manageOrganizationSettings")}
					</p>
				</DialogHeader>

				<PremiumTabs
					value={activeTab}
					onValueChange={setActiveTab}
					className='w-full'>
					<PremiumTabsList className='grid w-full grid-cols-4 h-12'>
						<PremiumTabsTrigger
							value='general'
							className='flex items-center gap-2 font-semibold'>
							<Building2 className='w-4 h-4' />
							{t("tenant.general")}
						</PremiumTabsTrigger>
						<PremiumTabsTrigger
							value='contact'
							className='flex items-center gap-2 font-semibold'>
							<Globe className='w-4 h-4' />
							{t("tenant.contact")}
						</PremiumTabsTrigger>
						<PremiumTabsTrigger
							value='invoice'
							className='flex items-center gap-2 font-semibold'>
							<TrendingUp className='w-4 h-4' />
							{t("tenant.invoice")}
						</PremiumTabsTrigger>
						<PremiumTabsTrigger
							value='appearance'
							className='flex items-center gap-2 font-semibold'>
							<Palette className='w-4 h-4' />
							{t("tenant.appearance")}
						</PremiumTabsTrigger>
					</PremiumTabsList>

					<form onSubmit={handleSubmit} className='space-y-8 mt-8'>
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

							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='timezone'>{t("tenant.timezone")}</Label>
									<select
										id='timezone'
										value={formData.timezone}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												timezone: e.target.value,
											}))
										}
										disabled={loading}
										className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring'>
										{timezones.map((tz) => (
											<option key={tz} value={tz}>
												{tz}
											</option>
										))}
									</select>
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

							<div className='grid grid-cols-2 gap-4'>
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

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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

								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
						<div className='flex gap-4 pt-6 border-t'>
							<Button
								type='button'
								variant='outline'
								onClick={onClose}
								className='flex-1 h-12 text-base font-semibold'>
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
								className='flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 gap-2'>
								<Save className='w-4 h-4' />
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
