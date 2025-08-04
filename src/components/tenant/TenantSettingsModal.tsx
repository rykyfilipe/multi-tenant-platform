/** @format */

"use client";

import { useState } from "react";
import { Settings, Building2, Palette, Globe, Save, X } from "lucide-react";
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
	const { showAlert, token, setTenant } = useApp();

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
			<DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Settings className='w-5 h-5' />
						Organization Settings
					</DialogTitle>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					<TabsList className='grid w-full grid-cols-3'>
						<TabsTrigger value='general' className='flex items-center gap-2'>
							<Building2 className='w-4 h-4' />
							General
						</TabsTrigger>
						<TabsTrigger value='contact' className='flex items-center gap-2'>
							<Globe className='w-4 h-4' />
							Contact
						</TabsTrigger>
						<TabsTrigger value='appearance' className='flex items-center gap-2'>
							<Palette className='w-4 h-4' />
							Appearance
						</TabsTrigger>
					</TabsList>

					<form onSubmit={handleSubmit} className='space-y-6 mt-6'>
						{/* General Settings */}
						<TabsContent value='general' className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='name'>Organization Name *</Label>
								<Input
									id='name'
									value={formData.name}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, name: e.target.value }))
									}
									disabled={loading}
									required
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
						<div className='flex gap-3 pt-4 border-t'>
							<Button
								type='button'
								variant='outline'
								onClick={onClose}
								className='flex-1'>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={loading || !formData.name.trim()}
								className='flex-1 gap-2'>
								<Save className='w-4 h-4' />
								{loading ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</form>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

export default TenantSettingsModal;
