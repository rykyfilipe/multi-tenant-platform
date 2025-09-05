/** @format */

"use client";

import { Puzzle, CheckCircle, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";

interface Module {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	planImpact?: string;
	icon?: any;
}

interface ModuleManagementCardProps {
	modules: Module[];
	onToggleModule: (moduleId: string, enabled: boolean) => void;
	onManageModules?: () => void;
}

export function ModuleManagementCard({
	modules,
	onToggleModule,
	onManageModules,
}: ModuleManagementCardProps) {
	const { t } = useLanguage();

	const enabledCount = modules.filter((m) => m.enabled).length;
	const totalCount = modules.length;

	return (
		<Card className="border-0 shadow-lg bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
							<Puzzle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
						</div>
						<div>
							<CardTitle className="text-lg font-bold">
								{t("tenant.management.moduleManagement.title")}
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								{t("tenant.management.moduleManagement.subtitle")}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="text-xs">
							{enabledCount}/{totalCount} enabled
						</Badge>
						{onManageModules && (
							<Button variant="outline" size="sm" onClick={onManageModules}>
								Manage
							</Button>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{modules.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{modules.map((module) => (
							<div
								key={module.id}
								className={`p-4 rounded-lg border transition-all duration-200 ${
									module.enabled
										? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800"
										: "bg-muted/30 border-border/50"
								}`}>
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-3">
										{module.icon ? (
											<div
												className={`p-2 rounded-lg ${
													module.enabled
														? "bg-green-500 text-white"
														: "bg-muted text-muted-foreground"
												}`}>
												<module.icon className="w-4 h-4" />
											</div>
										) : (
											<div
												className={`p-2 rounded-lg ${
													module.enabled
														? "bg-green-500 text-white"
														: "bg-muted text-muted-foreground"
												}`}>
												<Puzzle className="w-4 h-4" />
											</div>
										)}
										<div className="flex-1 min-w-0">
											<h4 className="text-sm font-semibold text-foreground truncate">
												{module.name}
											</h4>
											<p className="text-xs text-muted-foreground line-clamp-2">
												{module.description}
											</p>
										</div>
									</div>
									<Switch
										checked={module.enabled}
										onCheckedChange={(checked) =>
											onToggleModule(module.id, checked)
										}
										className="ml-2"
									/>
								</div>

								{module.planImpact && (
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<Info className="w-3 h-3" />
										<span>{module.planImpact}</span>
									</div>
								)}

								{module.enabled && (
									<div className="flex items-center gap-1 mt-2">
										<CheckCircle className="w-3 h-3 text-green-600" />
										<span className="text-xs text-green-600 font-medium">
											Enabled
										</span>
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-8 text-muted-foreground">
						<Puzzle className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p className="text-sm font-medium">No modules available</p>
						<p className="text-xs text-muted-foreground mt-1">
							Contact support to enable modules for your organization
						</p>
					</div>
				)}

				{/* Summary */}
				{modules.length > 0 && (
					<div className="pt-4 border-t border-border/20">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								Module Status Summary
							</span>
							<div className="flex items-center gap-2">
								<span className="text-green-600 font-medium">
									{enabledCount} enabled
								</span>
								<span className="text-muted-foreground">•</span>
								<span className="text-muted-foreground">
									{totalCount - enabledCount} disabled
								</span>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

