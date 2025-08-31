/** @format */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TemplateCreationProgressProps {
	progress: {
		current: number;
		total: number;
		message: string;
	} | null;
	isCreating: boolean;
}

export function TemplateCreationProgress({ progress, isCreating }: TemplateCreationProgressProps) {
	const { t } = useLanguage();

	if (!progress && !isCreating) {
		return null;
	}

	const percentage = progress ? (progress.current / progress.total) * 100 : 0;
	const isComplete = progress && progress.current === progress.total;

	return (
		<Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-lg">
					{isComplete ? (
						<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
					) : (
						<Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
					)}
					{t("database.templates.progress.title") || "Creating Tables from Templates"}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Progress Bar */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							{t("database.templates.progress.progress") || "Progress"}
						</span>
						<span className="font-medium">
							{progress?.current || 0} / {progress?.total || 0}
						</span>
					</div>
					<Progress value={percentage} className="h-2" />
				</div>

				{/* Status Message */}
				<div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-slate-800/30 rounded-lg">
					{isComplete ? (
						<CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
					) : (
						<Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
					)}
					<span className="text-sm font-medium">
						{isComplete 
							? (t("database.templates.progress.completed") || "All tables created successfully!")
							: progress?.message || (t("database.templates.progress.preparing") || "Preparing...")
						}
					</span>
				</div>

				{/* Progress Details */}
				{progress && (
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">
								{t("database.templates.progress.remaining") || "Remaining"}
							</span>
							<Badge variant="secondary">
								{progress.total - progress.current}
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">
								{t("database.templates.progress.percentage") || "Completion"}
							</span>
							<Badge variant="default">
								{percentage.toFixed(0)}%
							</Badge>
						</div>
					</div>
				)}

				{/* Completion Message */}
				{isComplete && (
					<div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg">
						<div className="flex items-center gap-2 text-green-800 dark:text-green-200">
							<CheckCircle className="w-4 h-4" />
							<span className="text-sm font-medium">
								{t("database.templates.progress.allTablesCreated") || "All tables have been created successfully!"}
							</span>
						</div>
						<p className="text-xs text-green-700 dark:text-green-300 mt-1">
							{t("database.templates.progress.readyToUse") || "You can now start adding data to your new tables."}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
