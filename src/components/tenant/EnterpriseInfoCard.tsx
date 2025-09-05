/** @format */

"use client";

import { Building2, Globe, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

interface EnterpriseInfoCardProps {
	tenant: {
		name: string;
		createdAt: string;
		updatedAt: string;
		timezone?: string;
		language?: string;
	};
	onEdit?: () => void;
}

export function EnterpriseInfoCard({ tenant, onEdit }: EnterpriseInfoCardProps) {
	const { t } = useLanguage();

	const formatDate = (dateString: string) => {
		return format(new Date(dateString), "MMM dd, yyyy");
	};

	return (
		<Card className="border-0 shadow-lg bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Building2 className="w-5 h-5 text-primary" />
						</div>
						<div>
							<CardTitle className="text-lg font-bold">
								{t("tenant.management.enterpriseInformation.title")}
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								{t("tenant.management.enterpriseInformation.subtitle")}
							</p>
						</div>
					</div>
					{onEdit && (
						<Button variant="outline" size="sm" onClick={onEdit}>
							Edit
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Organization Name */}
				<div className="p-4 bg-muted/30 rounded-lg">
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-muted-foreground">
							{t("tenant.management.enterpriseInformation.organizationName")}
						</span>
						<span className="text-sm font-bold text-foreground">
							{tenant.name}
						</span>
					</div>
				</div>

				{/* Established Date */}
				<div className="p-4 bg-muted/30 rounded-lg">
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
							<Calendar className="w-4 h-4" />
							{t("tenant.management.enterpriseInformation.established")}
						</span>
						<span className="text-sm font-medium">
							{formatDate(tenant.createdAt)}
						</span>
					</div>
				</div>

				{/* Last Updated */}
				<div className="p-4 bg-muted/30 rounded-lg">
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
							<Clock className="w-4 h-4" />
							{t("tenant.management.enterpriseInformation.lastUpdated")}
						</span>
						<span className="text-sm font-medium">
							{formatDate(tenant.updatedAt)}
						</span>
					</div>
				</div>

				{/* Timezone and Language */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{tenant.timezone && (
						<div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
							<div className="flex items-center gap-2 mb-2">
								<Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								<span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
									{t("tenant.management.enterpriseInformation.timezone")}
								</span>
							</div>
							<Badge variant="secondary" className="text-xs">
								{tenant.timezone}
							</Badge>
						</div>
					)}

					{tenant.language && (
						<div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
							<div className="flex items-center gap-2 mb-2">
								<span className="text-sm font-semibold text-green-800 dark:text-green-200">
									{t("tenant.management.enterpriseInformation.language")}
								</span>
							</div>
							<Badge variant="secondary" className="text-xs">
								{tenant.language.toUpperCase()}
							</Badge>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

