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
				showAlert("Failed to create organization. Please check your information and try again.", "error");
			} else {
				const data = await response.json();
				setTenant(data);
				showAlert("Organization created successfully!", "success");
				setShowForm(false);
			}
		} catch (error) {
			showAlert("Network or server error. Please check your connection.", "error");
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
						Launch Your Enterprise
					</DialogTitle>
					<p className="text-sm text-muted-foreground font-medium">
						Establish your organization's digital foundation
					</p>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-3">
						<Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
							<Shield className="w-4 h-4 text-primary" />
							Organization Name *
						</Label>
						<Input
							id="name"
							placeholder="Enter your enterprise name"
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
							Business Email
						</Label>
						<Input
							id="companyEmail"
							type="email"
							placeholder="contact@yourcompany.com"
							value={formData.companyEmail}
							onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
							disabled={loading}
							className="h-12 text-base"
						/>
					</div>

					<div className="space-y-3">
						<Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
							<Phone className="w-4 h-4 text-green-500" />
							Business Phone
						</Label>
						<Input
							id="phone"
							type="tel"
							placeholder="+1 (555) 123-4567"
							value={formData.phone}
							onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
							disabled={loading}
							className="h-12 text-base"
						/>
					</div>

					<div className="space-y-3">
						<Label htmlFor="website" className="text-sm font-semibold flex items-center gap-2">
							<ExternalLink className="w-4 h-4 text-purple-500" />
							Corporate Website
						</Label>
						<Input
							id="website"
							type="url"
							placeholder="https://www.yourcompany.com"
							value={formData.website}
							onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
							disabled={loading}
							className="h-12 text-base"
						/>
					</div>

					<div className="space-y-3">
						<Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
							<MapPin className="w-4 h-4 text-orange-500" />
							Business Address
						</Label>
						<Textarea
							id="address"
							placeholder="Enter your business address"
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
							Organization Description
						</Label>
						<Textarea
							id="description"
							placeholder="Brief description of your enterprise and mission"
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
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={loading || !formData.name.trim()}
							className="flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
							{loading ? (
								<>Creating...</>
							) : (
								<>
									<Zap className="w-4 h-4" />
									Launch Enterprise
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
