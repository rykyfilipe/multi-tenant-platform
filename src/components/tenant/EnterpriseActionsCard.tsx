/** @format */

"use client";

import { Settings, Users, Database, Shield, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { QUICK_ACTIONS } from "@/lib/tenant-sections";
import Link from "next/link";

interface EnterpriseActionsCardProps {
	onActionClick?: (actionId: string) => void;
}

export function EnterpriseActionsCard({ onActionClick }: EnterpriseActionsCardProps) {
	const { t } = useLanguage();

	const getVariantStyles = (variant: string) => {
		switch (variant) {
			case "default":
				return "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl";
			case "secondary":
				return "bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary text-secondary-foreground shadow-lg hover:shadow-xl";
			case "outline":
				return "border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5";
			default:
				return "bg-muted hover:bg-muted/80";
		}
	};

	return (
		<Card className="border-0 shadow-lg bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
			<CardHeader className="pb-4">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
						<Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
					</div>
					<div>
						<CardTitle className="text-lg font-bold">
							{t("tenant.management.enterpriseActions.title")}
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							{t("tenant.management.enterpriseActions.subtitle")}
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{QUICK_ACTIONS.map((action) => {
						const Icon = action.icon;
						return (
							<Link key={action.id} href={action.href}>
								<Button
									variant="ghost"
									className={`w-full h-auto p-6 flex flex-col items-start gap-4 text-left transition-all duration-200 hover:scale-[1.02] ${getVariantStyles(
										action.variant,
									)}`}
									onClick={() => onActionClick?.(action.id)}>
									<div className="flex items-center justify-between w-full">
										<div className="p-3 rounded-lg bg-background/20">
											<Icon className="w-6 h-6" />
										</div>
										<ArrowRight className="w-4 h-4 opacity-60" />
									</div>
									<div className="text-left w-full">
										<h4 className="font-semibold text-sm mb-1">
											{action.title}
										</h4>
										<p className="text-xs opacity-80 leading-relaxed">
											{action.description}
										</p>
									</div>
								</Button>
							</Link>
						);
					})}
				</div>

				{/* Additional Actions */}
				<div className="pt-4 border-t border-border/20">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Button
							variant="outline"
							className="w-full gap-2 justify-start"
							onClick={() => onActionClick?.("security")}>
							<Shield className="w-4 h-4" />
							Security Settings
						</Button>
					</div>
				</div>

				{/* Status Summary */}
				<div className="pt-4 border-t border-border/20">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							Enterprise Status
						</span>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
							<span className="text-green-600 font-medium">Active</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

