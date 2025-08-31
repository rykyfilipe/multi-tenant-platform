/** @format */

"use client";

import { useState } from "react";
import { Building2, X, Zap, Shield, TrendingUp, Mail, Phone, ExternalLink, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { DialogFooter } from "../ui/dialog";

interface Props {
	setShowForm: (x: boolean) => void;
}

function AddTenantForm({ setShowForm }: Props) {
	const [formData, setFormData] = useState({
		name: "",
		companyEmail: "",
		phone: "",
		website: "",
		address: "",
		description: ""
	});
	const [loading, setLoading] = useState(false);
	const { showAlert, token, setTenant, user } = useApp();
	const { t } = useLanguage();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) return;

		setLoading(true);
		try {
			const response = await fetch("/api/tenants", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				showAlert(t("tenant.addTenant.failedToCreate"), "error");
			} else {
				const data = await response.json();
				setTenant(data);
				showAlert(t("tenant.addTenant.organizationCreatedSuccessfully"), "success");
				setShowForm(false);
			}
		} catch (error) {
			showAlert(t("tenant.addTenant.networkOrServerError"), "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={true} onOpenChange={setShowForm}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader className="text-center pb-6">
					<div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full w-fit mx-auto mb-4">
						<Building2 className="w-8 h-8 text-primary" />
					</div>
					<DialogTitle className="text-2xl font-bold tracking-tight">
						{t("tenant.addTenant.title")}
					</DialogTitle>
					<p className="text-sm text-muted-foreground font-medium">
						{t("tenant.addTenant.subtitle")}
					</p>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-3">
						<Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
							<Shield className="w-4 h-4 text-primary" />
							{t("tenant.addTenant.organizationName")} *
						</Label>
						<Input
							id="name"
							placeholder={t("tenant.addTenant.organizationNamePlaceholder")}
							value={formData.name}
							onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
							disabled={loading}
							required
							className="h-12 text-base font-medium"
						/>
					</div>

					<div className="space-y-3">
						<Label htmlFor="companyEmail" className="text-sm font-semibold flex items-center gap-2">
							<Mail className="w-4 h-4 text-blue-500" />
							{t("tenant.addTenant.companyEmail")}
						</Label>
						<Input
							id="companyEmail"
							type="email"
							placeholder={t("tenant.addTenant.companyEmailPlaceholder")}
							value={formData.companyEmail}
							onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
							disabled={loading}
							className="h-12 text-base"
						/>
					</div>

					<div className="space-y-3">
						<Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
							<Phone className="w-4 h-4 text-green-500" />
							{t("tenant.addTenant.phone")}
						</Label>
						<Input
							id="phone"
							type="tel"
							placeholder={t("tenant.addTenant.phonePlaceholder")}
							value={formData.phone}
							onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
							disabled={loading}
							className="h-12 text-base"
						/>
					</div>

					<div className="space-y-3">
						<Label htmlFor="website" className="text-sm font-semibold flex items-center gap-2">
							<ExternalLink className="w-4 h-4 text-purple-500" />
							{t("tenant.addTenant.website")}
						</Label>
						<Input
							id="website"
							type="url"
							placeholder={t("tenant.addTenant.websitePlaceholder")}
							value={formData.website}
							onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
							disabled={loading}
							className="h-12 text-base"
						/>
					</div>

					<div className="space-y-3">
						<Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
							<MapPin className="w-4 h-4 text-orange-500" />
							{t("tenant.addTenant.address")}
						</Label>
						<Textarea
							id="address"
							placeholder={t("tenant.addTenant.addressPlaceholder")}
							value={formData.address}
							onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
							disabled={loading}
							rows={2}
							className="text-base"
						/>
					</div>

					<div className="space-y-3">
						<Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
							<TrendingUp className="w-4 h-4 text-indigo-500" />
							{t("tenant.addTenant.description")}
						</Label>
						<Textarea
							id="description"
							placeholder={t("tenant.addTenant.descriptionPlaceholder")}
							value={formData.description}
							onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
							disabled={loading}
							rows={3}
							className="text-base"
						/>
					</div>

					<div className="flex gap-4 pt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowForm(false)}
							className="flex-1 h-12 text-base font-semibold">
							{t("tenant.addTenant.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={loading || !formData.name.trim()}
							className="flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
							{loading ? (
								<>{t("tenant.addTenant.creating")}</>
							) : (
								<>
									<Zap className="w-4 h-4" />
									{t("tenant.addTenant.launchEnterprise")}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default AddTenantForm;
