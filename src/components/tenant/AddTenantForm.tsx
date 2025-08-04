/** @format */

"use client";

import { useState } from "react";
import { Building2, X } from "lucide-react";
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
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Building2 className="w-5 h-5" />
						Create New Organization
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Organization Name *</Label>
						<Input
							id="name"
							placeholder="Enter organization name"
							value={formData.name}
							onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
							disabled={loading}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="companyEmail">Company Email</Label>
						<Input
							id="companyEmail"
							type="email"
							placeholder="contact@company.com"
							value={formData.companyEmail}
							onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
							disabled={loading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="phone">Phone Number</Label>
						<Input
							id="phone"
							type="tel"
							placeholder="+1 (555) 123-4567"
							value={formData.phone}
							onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
							disabled={loading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="website">Website</Label>
						<Input
							id="website"
							type="url"
							placeholder="https://www.company.com"
							value={formData.website}
							onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
							disabled={loading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="address">Address</Label>
						<Textarea
							id="address"
							placeholder="Enter company address"
							value={formData.address}
							onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
							disabled={loading}
							rows={2}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							placeholder="Brief description of your organization"
							value={formData.description}
							onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
							disabled={loading}
							rows={3}
						/>
					</div>

					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowForm(false)}
							className="flex-1">
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={loading || !formData.name.trim()}
							className="flex-1">
							{loading ? "Creating..." : "Create Organization"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default AddTenantForm;
