/** @format */

"use client";

import { useState, useEffect } from "react";
import { Building2, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { TenantLoadingState } from "@/components/ui/loading-states";
import { TenantSidebar } from "@/components/tenant/TenantSidebar";
import { EnterpriseInfoCard } from "@/components/tenant/EnterpriseInfoCard";
import { BusinessContactCard } from "@/components/tenant/BusinessContactCard";
import { BillingCard } from "@/components/tenant/BillingCard";
import { ModuleManagementCard } from "@/components/tenant/ModuleManagementCard";
import { EnterpriseActionsCard } from "@/components/tenant/EnterpriseActionsCard";
import { TENANT_SECTIONS } from "@/lib/tenant-sections";
import AddTenantForm from "@/components/tenant/AddTenantForm";
import TenantSettingsModal from "@/components/tenant/TenantSettingsModal";
import ModuleManager from "@/components/modules/ModuleManager";

export default function TenantManagementPage() {
	const { user, loading, tenant, token } = useApp();
	const { t } = useLanguage();
	const [activeSection, setActiveSection] = useState("enterprise-info");
	const [showForm, setShowForm] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showModuleManager, setShowModuleManager] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	// Mock modules data - replace with actual data from your API
	const [modules, setModules] = useState([
		{
			id: "billing",
			name: "Billing & Invoicing",
			description: "Professional invoicing and payment management",
			enabled: true,
			planImpact: "Included in all plans",
		},
		{
			id: "analytics",
			name: "Analytics Dashboard",
			description: "Advanced reporting and data insights",
			enabled: false,
			planImpact: "Premium feature",
		},
		{
			id: "integrations",
			name: "Third-party Integrations",
			description: "Connect with external services and APIs",
			enabled: true,
			planImpact: "Available with Pro plan",
		},
		{
			id: "backup",
			name: "Automated Backups",
			description: "Secure data backup and recovery",
			enabled: true,
			planImpact: "Included in all plans",
		},
	]);

	const handleToggleModule = (moduleId: string, enabled: boolean) => {
		setModules((prev) =>
			prev.map((module) =>
				module.id === moduleId ? { ...module, enabled } : module,
			),
		);
	};

	const handleActionClick = (actionId: string) => {
		console.log("Action clicked:", actionId);
		// Handle different actions
	};

	if (loading) {
		return <TenantLoadingState />;
	}

	if (!tenant) {
		return (
			<div className="min-h-screen bg-background">
				{/* Header */}
				<div className="border-b border-border/20 bg-gradient-to-r from-background via-background/95 to-background/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
					<div className="flex items-center justify-between px-6 py-6">
						<div className="flex items-center space-x-4">
							<div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg">
								<Building2 className="w-7 h-7 text-primary" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-foreground tracking-tight">
									{t("tenant.management.title")}
								</h1>
								<p className="text-sm text-muted-foreground font-medium">
									{t("tenant.management.subtitle")}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="p-8 max-w-5xl mx-auto">
					<Card className="border-0 shadow-lg bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
						<CardHeader className="text-center pb-8">
							<div className="p-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full w-fit mx-auto mb-6 shadow-lg">
								<Building2 className="w-12 h-12 text-primary" />
							</div>
							<CardTitle className="text-3xl font-bold tracking-tight mb-2">
								{t("tenant.management.noOrganization.title")}
							</CardTitle>
							<p className="text-lg text-muted-foreground font-medium">
								{t("tenant.management.noOrganization.subtitle")}
							</p>
						</CardHeader>
						<CardContent className="text-center space-y-6">
							<div className="max-w-md mx-auto">
								<p className="text-muted-foreground leading-relaxed">
									{t("tenant.management.noOrganization.description")}
								</p>
							</div>
							<div className="flex justify-center">
								<Button
									onClick={() => setShowForm(true)}
									className="gap-3 px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
									disabled={user?.role !== "ADMIN"}>
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
		<div className="min-h-screen bg-background">
			{/* Sidebar */}
			<TenantSidebar
				tenant={tenant}
				activeSection={activeSection}
				onSectionChange={setActiveSection}
			/>

			{/* Main Content */}
			<div className="lg:ml-80">
				{/* Header */}
				<div className="sticky top-0 z-30 border-b border-border/20 bg-background/95 backdrop-blur-sm shadow-sm">
					<div className="flex items-center justify-between px-6 py-4">
						<div className="flex items-center gap-4">
							<div>
								<h1 className="text-2xl font-bold text-foreground tracking-tight">
									{tenant.name}
								</h1>
								<p className="text-sm text-muted-foreground font-medium">
									{t("tenant.management.enterpriseCommandCenter")}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							{/* Search */}
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search settings..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10 w-64"
								/>
							</div>
							<Badge variant="secondary" className="text-xs font-semibold px-3 py-1">
								{user?.role}
							</Badge>
							{user?.role === "ADMIN" && (
								<Button
									onClick={() => setShowSettings(true)}
									variant="outline"
									size="sm"
									className="gap-2 shadow-sm hover:shadow-md transition-shadow">
									<Settings className="w-4 h-4" />
									{t("tenant.management.settings")}
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="p-6 max-w-6xl mx-auto space-y-8">
					{/* Enterprise Information */}
					<section id="enterprise-info">
						<EnterpriseInfoCard
							tenant={tenant}
							onEdit={() => setShowSettings(true)}
						/>
					</section>

					{/* Business Contact */}
					<section id="business-contact">
						<BusinessContactCard
							tenant={tenant}
							onEdit={() => setShowSettings(true)}
						/>
					</section>

					{/* Billing & Fiscal */}
					<section id="billing-fiscal">
						<BillingCard
							tenant={tenant}
							onEdit={() => setShowSettings(true)}
						/>
					</section>

					{/* Module Management */}
					<section id="module-management">
						<ModuleManagementCard
							modules={modules}
							onToggleModule={handleToggleModule}
							onManageModules={() => setShowModuleManager(true)}
						/>
					</section>

					{/* Enterprise Actions */}
					<section id="enterprise-actions">
						<EnterpriseActionsCard onActionClick={handleActionClick} />
					</section>
				</div>
			</div>

			{/* Modals */}
			{showForm && <AddTenantForm setShowForm={setShowForm} />}
			{showSettings && (
				<TenantSettingsModal setShowSettings={setShowSettings} />
			)}
			{showModuleManager && (
				<ModuleManager setShowModuleManager={setShowModuleManager} />
			)}
		</div>
	);
}

