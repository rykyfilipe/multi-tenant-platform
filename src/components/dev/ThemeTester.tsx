/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTenantTheme } from "@/contexts/ThemeContext";
import { useApp } from "@/contexts/AppContext";
import { Sun, Moon, Monitor, Database, HardDrive } from "lucide-react";

export default function ThemeTester() {
	const { currentTheme, setTheme } = useTenantTheme();
	const { tenant } = useApp();
	const [localStorageTheme, setLocalStorageTheme] = useState<string>("");
	const [databaseTheme, setDatabaseTheme] = useState<string>("");
	const [isSynced, setIsSynced] = useState(false);

	useEffect(() => {
		// Get theme from localStorage
		if (typeof window !== "undefined") {
			const savedTheme = localStorage.getItem("theme") || "system";
			setLocalStorageTheme(savedTheme);
		}

		// Get theme from database
		if (tenant?.theme) {
			setDatabaseTheme(tenant.theme);
		}

		// Check if themes are synced
		const localStorageThemeValue = localStorage.getItem("theme") || "system";
		const databaseThemeValue = tenant?.theme || "system";
		setIsSynced(localStorageThemeValue === databaseThemeValue);
	}, [tenant?.theme]);

	const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
		setTheme(newTheme);
		// Update local state for immediate feedback
		setLocalStorageTheme(newTheme);
	};

	const getThemeIcon = (theme: string) => {
		switch (theme) {
			case "light":
				return <Sun className="w-4 h-4" />;
			case "dark":
				return <Moon className="w-4 h-4" />;
			case "system":
				return <Monitor className="w-4 h-4" />;
			default:
				return <Monitor className="w-4 h-4" />;
		}
	};

	const getThemeColor = (theme: string) => {
		switch (theme) {
			case "light":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200";
			case "dark":
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
			case "system":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
		}
	};

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Monitor className="w-5 h-5" />
					Theme Synchronization Tester
				</CardTitle>
				<CardDescription>
					Test the synchronization between localStorage and database themes
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Current Theme Status */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium">Current Theme Status</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						<div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
							<HardDrive className="w-4 h-4 text-muted-foreground" />
							<div className="flex-1">
								<p className="text-xs text-muted-foreground">localStorage</p>
								<div className="flex items-center gap-2">
									{getThemeIcon(localStorageTheme)}
									<span className="text-sm font-medium">{localStorageTheme}</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
							<Database className="w-4 h-4 text-muted-foreground" />
							<div className="flex-1">
								<p className="text-xs text-muted-foreground">Database</p>
								<div className="flex items-center gap-2">
									{getThemeIcon(databaseTheme)}
									<span className="text-sm font-medium">{databaseTheme}</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
							<Monitor className="w-4 h-4 text-muted-foreground" />
							<div className="flex-1">
								<p className="text-xs text-muted-foreground">Active</p>
								<div className="flex items-center gap-2">
									{getThemeIcon(currentTheme)}
									<span className="text-sm font-medium">{currentTheme}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Sync Status */}
				<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
					<span className="text-sm font-medium">Synchronization Status</span>
					<Badge 
						variant={isSynced ? "default" : "destructive"}
						className={isSynced ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200" : ""}
					>
						{isSynced ? "Synced" : "Out of Sync"}
					</Badge>
				</div>

				{/* Theme Controls */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium">Change Theme</h3>
					<div className="flex flex-wrap gap-2">
						<Button
							variant={currentTheme === "light" ? "default" : "outline"}
							size="sm"
							onClick={() => handleThemeChange("light")}
							className="flex items-center gap-2"
						>
							<Sun className="w-4 h-4" />
							Light
						</Button>
						
						<Button
							variant={currentTheme === "dark" ? "default" : "outline"}
							size="sm"
							onClick={() => handleThemeChange("dark")}
							className="flex items-center gap-2"
						>
							<Moon className="w-4 h-4" />
							Dark
						</Button>
						
						<Button
							variant={currentTheme === "system" ? "default" : "outline"}
							size="sm"
							onClick={() => handleThemeChange("system")}
							className="flex items-center gap-2"
						>
							<Monitor className="w-4 h-4" />
							System
						</Button>
					</div>
				</div>

				{/* Debug Info */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium">Debug Information</h3>
					<div className="space-y-2 text-xs">
						<div className="flex justify-between">
							<span className="text-muted-foreground">localStorage.getItem('theme'):</span>
							<code className="bg-muted px-2 py-1 rounded">{localStorage.getItem("theme") || "undefined"}</code>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">tenant.theme:</span>
							<code className="bg-muted px-2 py-1 rounded">{tenant?.theme || "undefined"}</code>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">currentTheme:</span>
							<code className="bg-muted px-2 py-1 rounded">{currentTheme}</code>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
