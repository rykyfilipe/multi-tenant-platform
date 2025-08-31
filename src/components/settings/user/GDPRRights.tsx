/** @format */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Download,
	Trash2,
	Edit,
	User,
	Shield,
	Database,
	FileText,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function GDPRRights() {
	const [loading, setLoading] = useState<string | null>(null);
	const { showAlert } = useApp();
	const { t } = useLanguage();

	const handleExportData = async () => {
		setLoading("export");
		try {
			const response = await fetch("/api/user/gdpr", {
				method: "GET",
			});

			if (response.ok) {
				const data = await response.json();

				// Create and download JSON file
				const blob = new Blob([JSON.stringify(data.data, null, 2)], {
					type: "application/json",
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `ydv-data-export-${
					new Date().toISOString().split("T")[0]
				}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

				showAlert(t("settings.gdpr.alerts.dataExported"), "success");
			} else {
				const error = await response.json();
				showAlert(
					error.error || t("settings.gdpr.alerts.exportFailed"),
					"error",
				);
			}
		} catch (error) {
			console.error("Error exporting data:", error);
			showAlert(t("settings.gdpr.alerts.exportFailed"), "error");
		} finally {
			setLoading(null);
		}
	};

	const handleDeleteAccount = async () => {
		setLoading("delete");
		try {
			const response = await fetch("/api/user/gdpr", {
				method: "DELETE",
			});

			if (response.ok) {
				showAlert(t("settings.gdpr.alerts.accountDeleted"), "success");
				// Redirect to home page after a short delay
				setTimeout(() => {
					window.location.href = "/";
				}, 2000);
			} else {
				const error = await response.json();
				showAlert(
					error.error || t("settings.gdpr.alerts.deleteFailed"),
					"error",
				);
			}
		} catch (error) {
			console.error("Error deleting account:", error);
			showAlert(t("settings.gdpr.alerts.deleteFailed"), "error");
		} finally {
			setLoading(null);
		}
	};

	const handleUpdateData = async () => {
		setLoading("update");
		try {
			// This would typically open a form to update user data
			// For now, we'll just show a message
			showAlert(t("settings.gdpr.alerts.updateInfo"), "info");
		} catch (error) {
			console.error("Error updating data:", error);
			showAlert(t("settings.gdpr.alerts.updateFailed"), "error");
		} finally {
			setLoading(null);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Shield className='w-5 h-5' />
					{t("settings.gdpr.rights")}
				</CardTitle>
				<CardDescription>{t("settings.gdpr.description")}</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				{/* Right to Access (Data Export) */}
				<div className='flex items-center justify-between p-4 border rounded-lg'>
					<div className='flex items-center gap-3'>
						<Download className='w-5 h-5 text-primary' />
						<div>
							<h4 className='font-medium text-foreground'>
								{t("settings.gdpr.rightToAccess.title")}
							</h4>
							<p className='text-sm text-muted-foreground'>
								{t("settings.gdpr.rightToAccess.description")}
							</p>
						</div>
					</div>
					<Button
						onClick={handleExportData}
						disabled={loading !== null}
						variant='outline'
						size='sm'>
						{loading === "export"
							? t("settings.gdpr.exporting")
							: t("settings.gdpr.exportData")}
					</Button>
				</div>

				{/* Right to Rectification */}
				<div className='flex items-center justify-between p-4 border rounded-lg'>
					<div className='flex items-center gap-3'>
						<Edit className='w-5 h-5 text-green-600 dark:text-green-400' />
						<div>
							<h4 className='font-medium text-foreground'>
								{t("settings.gdpr.rightToRectification.title")}
							</h4>
							<p className='text-sm text-muted-foreground'>
								{t("settings.gdpr.rightToRectification.description")}
							</p>
						</div>
					</div>
					<Button
						onClick={handleUpdateData}
						disabled={loading !== null}
						variant='outline'
						size='sm'>
						{loading === "update"
							? t("settings.gdpr.updating")
							: t("settings.gdpr.updateData")}
					</Button>
				</div>

				{/* Right to Erasure */}
				<div className='flex items-center justify-between p-4 border rounded-lg'>
					<div className='flex items-center gap-3'>
						<Trash2 className='w-5 h-5  text-red-500' />
						<div>
							<h4 className='font-medium text-foreground'>
								{t("settings.gdpr.rightToErasure.title")}
							</h4>
							<p className='text-sm text-muted-foreground'>
								{t("settings.gdpr.rightToErasure.description")}
							</p>
						</div>
					</div>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								disabled={loading !== null}
								variant='destructive'
								size='sm'>
								{loading === "delete"
									? t("settings.gdpr.deleting")
									: t("settings.gdpr.deleteAccount")}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									{t("settings.gdpr.deleteConfirm.title")}
								</AlertDialogTitle>
								<AlertDialogDescription>
									{t("settings.gdpr.deleteConfirm.description")}
									<ul className='list-disc list-inside mt-2 space-y-1'>
										<li>
											{t("settings.gdpr.deleteConfirm.items.personalInfo")}
										</li>
										<li>{t("settings.gdpr.deleteConfirm.items.databases")}</li>
										<li>{t("settings.gdpr.deleteConfirm.items.accounts")}</li>
										<li>{t("settings.gdpr.deleteConfirm.items.sessions")}</li>
										<li>{t("settings.gdpr.deleteConfirm.items.permissions")}</li>
										<li>
											{t("settings.gdpr.deleteConfirm.items.subscription")}
										</li>
										<li>
											{t("settings.gdpr.deleteConfirm.items.usageHistory")}
										</li>
									</ul>
									<br />
									<strong className='text-destructive'>
										{t("settings.gdpr.deleteConfirm.adminWarning")}
									</strong>
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>
									{t("settings.gdpr.deleteConfirm.cancel")}
								</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeleteAccount}
									className='bg-destructive hover:bg-destructive/90'>
									{t("settings.gdpr.deleteAccount")}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>

				{/* Information about other rights */}
				<div className='mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20'>
					<h4 className='font-medium text-foreground mb-2'>
						{t("settings.gdpr.otherRights.title")}
					</h4>
					<div className='space-y-2 text-sm text-foreground'>
						<p>{t("settings.gdpr.otherRights.portability")}</p>
						<p>{t("settings.gdpr.otherRights.restriction")}</p>
						<p>{t("settings.gdpr.otherRights.object")}</p>
						<p>{t("settings.gdpr.otherRights.complain")}</p>
					</div>
				</div>

				{/* Contact Information */}
				<div className='mt-4 p-4 bg-muted/30 rounded-lg border border-border'>
					<h4 className='font-medium text-foreground mb-2'>
						{t("settings.gdpr.needHelp.title")}
					</h4>
					<p className='text-sm text-muted-foreground mb-2'>
						{t("settings.gdpr.needHelp.description")}
					</p>
					<div className='space-y-1 text-sm'>
						<p>
							📧{" "}
							<a
								href='mailto:contact@ydv.digital'
								className='text-primary hover:underline'>
								contact@ydv.digital
							</a>
						</p>
						<p>
							📧{" "}
							<a
								href='mailto:support@ydv.digital'
								className='text-primary hover:underline'>
								support@ydv.digital
							</a>
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
