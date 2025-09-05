/** @format */

"use client";

import { useState } from "react";
import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { TENANT_SECTIONS } from "@/lib/tenant-sections";

interface TenantSidebarProps {
	tenant: {
		name: string;
		logoUrl?: string;
	};
	activeSection: string;
	onSectionChange: (sectionId: string) => void;
}

export function TenantSidebar({
	tenant,
	activeSection,
	onSectionChange,
}: TenantSidebarProps) {
	const { t } = useLanguage();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const scrollToSection = (sectionId: string) => {
		onSectionChange(sectionId);
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
		setIsMobileMenuOpen(false);
	};

	return (
		<>
			{/* Mobile Menu Button */}
			<div className="lg:hidden fixed top-4 left-4 z-50">
				<Button
					variant="outline"
					size="sm"
					onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					className="gap-2">
					{isMobileMenuOpen ? (
						<X className="w-4 h-4" />
					) : (
						<Menu className="w-4 h-4" />
					)}
					Menu
				</Button>
			</div>

			{/* Mobile Overlay */}
			{isMobileMenuOpen && (
				<div
					className="lg:hidden fixed inset-0 bg-black/50 z-40"
					onClick={() => setIsMobileMenuOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<div
				className={`fixed left-0 top-0 h-full w-80 bg-background border-r border-border/20 z-40 transform transition-transform duration-300 ease-in-out ${
					isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
				} lg:translate-x-0`}>
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="p-6 border-b border-border/20">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
								{tenant.logoUrl ? (
									<img
										src={tenant.logoUrl}
										alt={tenant.name}
										className="w-8 h-8 rounded-lg object-cover"
									/>
								) : (
									<Building2 className="w-6 h-6 text-primary" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<h2 className="text-lg font-bold text-foreground truncate">
									{tenant.name}
								</h2>
								<p className="text-sm text-muted-foreground">
									{t("tenant.management.enterpriseCommandCenter")}
								</p>
							</div>
						</div>
					</div>

					{/* Navigation */}
					<div className="flex-1 overflow-y-auto p-4">
						<nav className="space-y-2">
							{TENANT_SECTIONS.map((section) => {
								const Icon = section.icon;
								const isActive = activeSection === section.id;

								return (
									<button
										key={section.id}
										onClick={() => scrollToSection(section.id)}
										className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${
											isActive
												? "bg-primary text-primary-foreground shadow-lg"
												: "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
										}`}>
										<div className="flex items-center gap-3">
											<div
												className={`p-2 rounded-lg ${
													isActive
														? "bg-primary-foreground/20"
														: "bg-muted group-hover:bg-primary/10"
												}`}>
												<Icon
													className={`w-4 h-4 ${
														isActive
															? "text-primary-foreground"
															: "text-muted-foreground group-hover:text-primary"
													}`}
												/>
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-semibold text-sm truncate">
													{section.title}
												</h3>
												<p className="text-xs opacity-80 truncate">
													{section.subtitle}
												</p>
											</div>
											{isActive && (
												<div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
											)}
										</div>
									</button>
								);
							})}
						</nav>
					</div>

					{/* Footer */}
					<div className="p-4 border-t border-border/20">
						<Card className="bg-muted/30">
							<CardContent className="p-4">
								<div className="flex items-center gap-2 mb-2">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									<span className="text-xs font-medium text-foreground">
										Enterprise Active
									</span>
								</div>
								<p className="text-xs text-muted-foreground">
									All systems operational
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</>
	);
}

