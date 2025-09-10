/** @format */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
	Shield, 
	Download, 
	Trash2, 
	AlertTriangle,
	CheckCircle,
	Info,
	FileText,
	Settings
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { logger } from "@/lib/error-logger";

export default function PrivacySettingsPage() {
	const { user, tenant } = useApp();
	const { t } = useLanguage();
	const [isExporting, setIsExporting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [deleteReason, setDeleteReason] = useState("");
	const [showDeleteForm, setShowDeleteForm] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

	const handleDataExport = async () => {
		setIsExporting(true);
		setMessage(null);

		try {
			const response = await fetch("/api/gdpr/export-data", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to export data");
			}

			// Create download link
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			setMessage({
				type: "success",
				text: "Your data has been exported successfully. The download should start automatically.",
			});

			logger.info("User data export completed", {
				component: "PrivacySettings",
				userId: user?.id.toString(),
			});

		} catch (error) {
			setMessage({
				type: "error",
				text: "Failed to export your data. Please try again or contact support.",
			});

			logger.error("Failed to export user data", error as Error, {
				component: "PrivacySettings",
				userId: user?.id.toString(),
			});
		} finally {
			setIsExporting(false);
		}
	};

	const handleAccountDeletion = async () => {
		if (deleteConfirmation !== "DELETE_MY_ACCOUNT") {
			setMessage({
				type: "error",
				text: "Please type 'DELETE_MY_ACCOUNT' to confirm account deletion.",
			});
			return;
		}

		setIsDeleting(true);
		setMessage(null);

		try {
			const response = await fetch("/api/gdpr/delete-account", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					confirmation: deleteConfirmation,
					reason: deleteReason,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete account");
			}

			setMessage({
				type: "success",
				text: "Your account and all associated data have been permanently deleted. You will be redirected shortly.",
			});

			logger.warn("User account deletion completed", {
				component: "PrivacySettings",
				userId: user?.id.toString(),
				reason: deleteReason,
			});

			// Redirect to home page after successful deletion
			setTimeout(() => {
				window.location.href = "/";
			}, 3000);

		} catch (error) {
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Failed to delete account. Please contact support.",
			});

			logger.error("Failed to delete user account", error as Error, {
				component: "PrivacySettings",
				userId: user?.id.toString(),
			});
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-4">
					<Shield className="h-8 w-8 text-primary" />
					<h1 className="text-4xl font-bold">Privacy & Data Management</h1>
				</div>
				<p className="text-lg text-muted-foreground">
					Manage your personal data and privacy settings in compliance with GDPR regulations.
				</p>
			</div>

			{/* Message Display */}
			{message && (
				<Alert className={`mb-6 ${message.type === "error" ? "border-destructive" : "border-green-500"}`}>
					{message.type === "success" ? (
						<CheckCircle className="h-4 w-4 text-green-600" />
					) : (
						<AlertTriangle className="h-4 w-4 text-destructive" />
					)}
					<AlertDescription className={message.type === "error" ? "text-destructive" : "text-green-600"}>
						{message.text}
					</AlertDescription>
				</Alert>
			)}

			{/* Data Export Section */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Download className="h-5 w-5" />
						Export Your Data
					</CardTitle>
					<CardDescription>
						Download a complete copy of all your personal data stored in our system.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="bg-muted p-4 rounded-lg">
						<h4 className="font-medium mb-2">What's included in your data export:</h4>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>• Personal information (name, email, profile data)</li>
							<li>• All databases, tables, and data you've created</li>
							<li>• Activity logs and usage history</li>
							<li>• Account settings and preferences</li>
							<li>• Subscription and billing information</li>
						</ul>
					</div>
					
					<Button 
						onClick={handleDataExport} 
						disabled={isExporting}
						className="w-full sm:w-auto"
					>
						<Download className="h-4 w-4 mr-2" />
						{isExporting ? "Exporting..." : "Export My Data"}
					</Button>
				</CardContent>
			</Card>

			{/* Cookie Settings */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Cookie Preferences
					</CardTitle>
					<CardDescription>
						Manage your cookie preferences and consent settings.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button 
						variant="outline" 
						onClick={() => {
							// Trigger cookie consent manager
							localStorage.removeItem("cookie_consent");
							localStorage.removeItem("cookie_preferences");
							window.location.reload();
						}}
					>
						<Settings className="h-4 w-4 mr-2" />
						Manage Cookie Settings
					</Button>
				</CardContent>
			</Card>

			{/* Privacy Policy & Terms */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Legal Documents
					</CardTitle>
					<CardDescription>
						Review our privacy policy and terms of service.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center justify-between p-3 border rounded-lg">
						<div>
							<h4 className="font-medium">Privacy Policy</h4>
							<p className="text-sm text-muted-foreground">
								How we collect, use, and protect your personal information
							</p>
						</div>
						<Button variant="outline" size="sm">
							<FileText className="h-4 w-4 mr-2" />
							View
						</Button>
					</div>
					
					<div className="flex items-center justify-between p-3 border rounded-lg">
						<div>
							<h4 className="font-medium">Terms of Service</h4>
							<p className="text-sm text-muted-foreground">
								Terms and conditions for using our platform
							</p>
						</div>
						<Button variant="outline" size="sm">
							<FileText className="h-4 w-4 mr-2" />
							View
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Account Deletion Section */}
			<Card className="border-destructive/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-destructive">
						<Trash2 className="h-5 w-5" />
						Delete Account
					</CardTitle>
					<CardDescription>
						Permanently delete your account and all associated data. This action cannot be undone.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Alert className="border-destructive">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							<strong>Warning:</strong> This will permanently delete your account, all your data, 
							databases, tables, and any other information associated with your account. 
							This action cannot be undone.
						</AlertDescription>
					</Alert>

					{!showDeleteForm ? (
						<Button 
							variant="destructive" 
							onClick={() => setShowDeleteForm(true)}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete My Account
						</Button>
					) : (
						<div className="space-y-4">
							<div>
								<Label htmlFor="deleteConfirmation">
									Type "DELETE_MY_ACCOUNT" to confirm:
								</Label>
								<Input
									id="deleteConfirmation"
									value={deleteConfirmation}
									onChange={(e) => setDeleteConfirmation(e.target.value)}
									placeholder="DELETE_MY_ACCOUNT"
									className="mt-1"
								/>
							</div>

							<div>
								<Label htmlFor="deleteReason">
									Reason for deletion (optional):
								</Label>
								<Textarea
									id="deleteReason"
									value={deleteReason}
									onChange={(e) => setDeleteReason(e.target.value)}
									placeholder="Please let us know why you're deleting your account..."
									className="mt-1"
									rows={3}
								/>
							</div>

							<div className="flex gap-3">
								<Button 
									variant="destructive" 
									onClick={handleAccountDeletion}
									disabled={isDeleting || deleteConfirmation !== "DELETE_MY_ACCOUNT"}
								>
									<Trash2 className="h-4 w-4 mr-2" />
									{isDeleting ? "Deleting..." : "Permanently Delete Account"}
								</Button>
								
								<Button 
									variant="outline" 
									onClick={() => {
										setShowDeleteForm(false);
										setDeleteConfirmation("");
										setDeleteReason("");
									}}
								>
									Cancel
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
