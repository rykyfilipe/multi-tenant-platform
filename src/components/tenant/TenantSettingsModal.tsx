/** @format */

"use client";

import { useState } from "react";
import { Settings, Building2, Palette, Globe, Save, X, Shield, Zap, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useApp } from "@/contexts/AppContext";
import { Tenant } from "@/types/tenant";

interface Props {
	tenant: Tenant;
	onClose: () => void;
}

function TenantSettingsModal({ tenant, onClose }: Props) {
	const [activeTab, setActiveTab] = useState("general");
	const [loading, setLoading] = useState(false);
	const { showAlert, token, setTenant, user } = useApp();

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
							Access Restricted
						</DialogTitle>
						<p className='text-sm text-muted-foreground font-medium'>
							Administrator privileges required
						</p>
					</DialogHeader>
					<div className='text-center py-6'>
						<h3 className='text-lg font-semibold text-foreground mb-3'>
							Enterprise Settings Locked
						</h3>
						<p className='text-muted-foreground mb-6 leading-relaxed'>
							Only enterprise administrators can modify organization settings. Please contact your system administrator for any configuration changes.
						</p>
						<Button onClick={onClose} className='w-full h-12 text-base font-semibold shadow-lg'>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	const [formData, setFormData] = useState({
		name: tenant.name,
		companyEmail: tenant.companyEmail || "",
		phone: tenant.phone || "",
		website: tenant.website || "",
		address: tenant.address || "",
		timezone: tenant.timezone || "UTC",
		language: tenant.language || "en",
		logoUrl: tenant.logoUrl || "",
		theme: tenant.theme || "light",
	});

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
				showAlert("Failed to update organization settings.", "error");
			} else {
				const updatedTenant = await response.json();
				setTenant(updatedTenant);
				showAlert("Organization settings updated successfully!", "success");
				onClose();
			}
		} catch (error) {
			showAlert(
				"Network or server error. Please check your connection.",
				"error",
			);
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
		{ code: "en", name: "English" },
		{ code: "ro", name: "Română" },
		{ code: "es", name: "Español" },
		{ code: "fr", name: "Français" },
		{ code: "de", name: "Deutsch" },
	];

	const themes = [
		{ value: "light", name: "Light" },
		{ value: "dark", name: "Dark" },
		{ value: "system", name: "System" },
	];

	return (
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader className='text-center pb-6'>
					<div className='p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full w-fit mx-auto mb-4'>
						<Settings className='w-8 h-8 text-primary' />
					</div>
					<DialogTitle className='text-2xl font-bold tracking-tight'>
						Enterprise Configuration
					</DialogTitle>
					<p className='text-sm text-muted-foreground font-medium'>
						Manage your organization's settings and preferences
					</p>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					<TabsList className='grid w-full grid-cols-3 h-12'>
						<TabsTrigger value='general' className='flex items-center gap-2 font-semibold'>
							<Building2 className='w-4 h-4' />
							General
						</TabsTrigger>
						<TabsTrigger value='contact' className='flex items-center gap-2 font-semibold'>
							<Globe className='w-4 h-4' />
							Contact
						</TabsTrigger>
						<TabsTrigger value='appearance' className='flex items-center gap-2 font-semibold'>
							<Palette className='w-4 h-4' />
							Appearance
						</TabsTrigger>
					</TabsList>

					<form onSubmit={handleSubmit} className='space-y-8 mt-8'>
						{/* General Settings */}
						<TabsContent value='general' className='space-y-6'>
							<div className='space-y-3'>
								<Label htmlFor='name' className='text-sm font-semibold flex items-center gap-2'>
									<Shield className='w-4 h-4 text-primary' />
									Organization Name *
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
									<Label htmlFor='timezone'>Timezone</Label>
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
									<Label htmlFor='language'>Language</Label>
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
						</TabsContent>

						{/* Contact Settings */}
						<TabsContent value='contact' className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='companyEmail'>Company Email</Label>
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
								<Label htmlFor='phone'>Phone Number</Label>
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
								<Label htmlFor='website'>Website</Label>
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
								<Label htmlFor='address'>Address</Label>
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
						</TabsContent>

						{/* Appearance Settings */}
						<TabsContent value='appearance' className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='logoUrl'>Logo URL</Label>
								<Input
									id='logoUrl'
									type='url'
									placeholder='https://example.com/logo.png'
									value={formData.logoUrl}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											logoUrl: e.target.value,
										}))
									}
									disabled={loading}
								/>
								<p className='text-xs text-muted-foreground'>
									Enter the URL of your organization's logo
								</p>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='theme'>Theme</Label>
								<select
									id='theme'
									value={formData.theme}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, theme: e.target.value }))
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
						</TabsContent>

						{/* Action Buttons */}
						<div className='flex gap-4 pt-6 border-t'>
							<Button
								type='button'
								variant='outline'
								onClick={onClose}
								className='flex-1 h-12 text-base font-semibold'>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={loading || !formData.name.trim()}
								className='flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 gap-2'>
								<Save className='w-4 h-4' />
								{loading ? "Saving..." : "Save Configuration"}
							</Button>
						</div>
					</form>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

export default TenantSettingsModal;
