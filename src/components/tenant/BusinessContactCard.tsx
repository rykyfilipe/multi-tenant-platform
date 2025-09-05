/** @format */

"use client";

import { Mail, Phone, ExternalLink, MapPin, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface BusinessContactCardProps {
	tenant: {
		companyEmail?: string;
		phone?: string;
		website?: string;
		address?: string;
	};
	onEdit?: () => void;
}

export function BusinessContactCard({ tenant, onEdit }: BusinessContactCardProps) {
	const { t } = useLanguage();

	const contactItems = [
		{
			key: "email",
			icon: Mail,
			value: tenant.companyEmail,
			label: t("tenant.management.businessContact.primaryBusinessEmail"),
			placeholder: t("tenant.management.businessContact.addPrimaryContactEmail"),
			color: "blue",
		},
		{
			key: "phone",
			icon: Phone,
			value: tenant.phone,
			label: t("tenant.management.businessContact.businessPhone"),
			placeholder: t("tenant.management.businessContact.addBusinessContactNumber"),
			color: "green",
		},
		{
			key: "website",
			icon: ExternalLink,
			value: tenant.website,
			label: t("tenant.management.businessContact.corporateWebsite"),
			placeholder: t("tenant.management.businessContact.addCompanyWebsite"),
			color: "purple",
		},
		{
			key: "address",
			icon: MapPin,
			value: tenant.address,
			label: t("tenant.management.businessContact.businessAddress"),
			placeholder: t("tenant.management.businessContact.addBusinessLocation"),
			color: "orange",
		},
	];

	const getColorClasses = (color: string) => {
		const colorMap = {
			blue: {
				bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
				border: "border-blue-200 dark:border-blue-800",
				icon: "bg-blue-500",
				text: "text-blue-800 dark:text-blue-200",
			},
			green: {
				bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
				border: "border-green-200 dark:border-green-800",
				icon: "bg-green-500",
				text: "text-green-800 dark:text-green-200",
			},
			purple: {
				bg: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
				border: "border-purple-200 dark:border-purple-800",
				icon: "bg-purple-500",
				text: "text-purple-800 dark:text-purple-200",
			},
			orange: {
				bg: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
				border: "border-orange-200 dark:border-orange-800",
				icon: "bg-orange-500",
				text: "text-orange-800 dark:text-orange-200",
			},
		};
		return colorMap[color as keyof typeof colorMap] || colorMap.blue;
	};

	return (
		<Card className="border-0 shadow-lg bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
							<Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<CardTitle className="text-lg font-bold">
								{t("tenant.management.businessContact.title")}
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								{t("tenant.management.businessContact.subtitle")}
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
				{contactItems.map((item) => {
					const colors = getColorClasses(item.color);
					const Icon = item.icon;

					return (
						<div key={item.key}>
							{item.value ? (
								<div
									className={`flex items-center gap-4 p-4 bg-gradient-to-r ${colors.bg} rounded-xl border ${colors.border}`}>
									<div className={`p-2 ${colors.icon} rounded-lg`}>
										<Icon className="w-4 h-4 text-white" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-bold text-foreground">
											{item.value}
										</p>
										<p className={`text-xs font-medium ${colors.text}`}>
											{item.label}
										</p>
									</div>
								</div>
							) : (
								<div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
									<Icon className="w-10 h-10 mx-auto mb-3 opacity-50" />
									<p className="text-sm font-medium">
										{t(`tenant.management.businessContact.no${item.key.charAt(0).toUpperCase() + item.key.slice(1)}`)}
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										{item.placeholder}
									</p>
									<Button
										variant="ghost"
										size="sm"
										className="mt-3 gap-2"
										onClick={onEdit}>
										<Plus className="w-4 h-4" />
										Add {item.key}
									</Button>
								</div>
							)}
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}

