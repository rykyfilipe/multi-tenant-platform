/** @format */

"use client";

import { CreditCard, FileText, Building, MapPin, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface BillingCardProps {
	tenant: {
		companyTaxId?: string;
		registrationNumber?: string;
		companyStreet?: string;
		companyCity?: string;
		companyCountry?: string;
		companyPostalCode?: string;
		companyIban?: string;
		companyBank?: string;
	};
	onEdit?: () => void;
}

export function BillingCard({ tenant, onEdit }: BillingCardProps) {
	const { t } = useLanguage();

	const hasFiscalInfo = tenant.companyTaxId || tenant.registrationNumber;
	const hasAddress = tenant.companyStreet || tenant.companyCity || tenant.companyCountry;
	const hasBanking = tenant.companyIban || tenant.companyBank;

	return (
		<Card className="border-0 shadow-lg bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
							<CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
						</div>
						<div>
							<CardTitle className="text-lg font-bold">
								{t("tenant.management.billingFiscal.title")}
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								{t("tenant.management.billingFiscal.subtitle")}
							</p>
						</div>
					</div>
					{onEdit && (
						<Button variant="outline" size="sm" onClick={onEdit}>
							<Edit className="w-4 h-4 mr-2" />
							Update
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Tax Information */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
						<FileText className="w-4 h-4" />
						Tax Information
					</h4>
					{hasFiscalInfo ? (
						<div className="space-y-3">
							{tenant.companyTaxId && (
								<div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold text-green-800 dark:text-green-200">
											Tax ID (CUI/VAT)
										</span>
										<Badge variant="secondary" className="text-xs">
											{tenant.companyTaxId}
										</Badge>
									</div>
								</div>
							)}
							{tenant.registrationNumber && (
								<div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
											Registration Number
										</span>
										<Badge variant="secondary" className="text-xs">
											{tenant.registrationNumber}
										</Badge>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
							<FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm font-medium">No tax information</p>
							<p className="text-xs text-muted-foreground mt-1">
								Add your tax ID and registration number
							</p>
						</div>
					)}
				</div>

				{/* Registered Address */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
						<Building className="w-4 h-4" />
						Registered Address
					</h4>
					{hasAddress ? (
						<div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
							<div className="space-y-1">
								{tenant.companyStreet && (
									<p className="text-sm font-medium text-foreground">
										{tenant.companyStreet}
									</p>
								)}
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									{tenant.companyCity && <span>{tenant.companyCity}</span>}
									{tenant.companyPostalCode && <span>{tenant.companyPostalCode}</span>}
									{tenant.companyCountry && <span>{tenant.companyCountry}</span>}
								</div>
							</div>
						</div>
					) : (
						<div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
							<MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm font-medium">No registered address</p>
							<p className="text-xs text-muted-foreground mt-1">
								Add your company's registered address
							</p>
						</div>
					)}
				</div>

				{/* Banking Information */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
						<CreditCard className="w-4 h-4" />
						Banking Information
					</h4>
					{hasBanking ? (
						<div className="space-y-3">
							{tenant.companyIban && (
								<div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-800">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
											IBAN
										</span>
										<Badge variant="secondary" className="text-xs font-mono">
											{tenant.companyIban}
										</Badge>
									</div>
								</div>
							)}
							{tenant.companyBank && (
								<div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
											Bank
										</span>
										<Badge variant="secondary" className="text-xs">
											{tenant.companyBank}
										</Badge>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
							<CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm font-medium">No banking information</p>
							<p className="text-xs text-muted-foreground mt-1">
								Add your IBAN and bank details
							</p>
						</div>
					)}
				</div>

				{/* Action Button */}
				<div className="pt-4 border-t border-border/20">
					<Button
						variant="outline"
						className="w-full gap-2"
						onClick={onEdit}>
						<Edit className="w-4 h-4" />
						Update Fiscal Information
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

