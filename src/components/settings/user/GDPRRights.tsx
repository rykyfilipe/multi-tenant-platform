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

export default function GDPRRights() {
	const [loading, setLoading] = useState<string | null>(null);
	const { showAlert } = useApp();

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

				showAlert("Data exported successfully", "success");
			} else {
				const error = await response.json();
				showAlert(error.error || "Failed to export data", "error");
			}
		} catch (error) {
			console.error("Error exporting data:", error);
			showAlert("Failed to export data", "error");
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
				showAlert("Account deleted successfully", "success");
				// Redirect to home page after a short delay
				setTimeout(() => {
					window.location.href = "/";
				}, 2000);
			} else {
				const error = await response.json();
				showAlert(error.error || "Failed to delete account", "error");
			}
		} catch (error) {
			console.error("Error deleting account:", error);
			showAlert("Failed to delete account", "error");
		} finally {
			setLoading(null);
		}
	};

	const handleUpdateData = async () => {
		setLoading("update");
		try {
			// This would typically open a form to update user data
			// For now, we'll just show a message
			showAlert(
				"Please use the profile settings above to update your data",
				"info",
			);
		} catch (error) {
			console.error("Error updating data:", error);
			showAlert("Failed to update data", "error");
		} finally {
			setLoading(null);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Shield className='w-5 h-5' />
					GDPR Rights
				</CardTitle>
				<CardDescription>
					Manage your data and privacy rights in accordance with GDPR
					regulations.
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				{/* Right to Access (Data Export) */}
				<div className='flex items-center justify-between p-4 border rounded-lg'>
					<div className='flex items-center gap-3'>
						<Download className='w-5 h-5 text-blue-600' />
						<div>
							<h4 className='font-medium'>Right to Access</h4>
							<p className='text-sm text-muted-foreground'>
								Export all your personal data in a machine-readable format
							</p>
						</div>
					</div>
					<Button
						onClick={handleExportData}
						disabled={loading !== null}
						variant='outline'
						size='sm'>
						{loading === "export" ? "Exporting..." : "Export Data"}
					</Button>
				</div>

				{/* Right to Rectification */}
				<div className='flex items-center justify-between p-4 border rounded-lg'>
					<div className='flex items-center gap-3'>
						<Edit className='w-5 h-5 text-green-600' />
						<div>
							<h4 className='font-medium'>Right to Rectification</h4>
							<p className='text-sm text-muted-foreground'>
								Update or correct your personal information
							</p>
						</div>
					</div>
					<Button
						onClick={handleUpdateData}
						disabled={loading !== null}
						variant='outline'
						size='sm'>
						{loading === "update" ? "Updating..." : "Update Data"}
					</Button>
				</div>

				{/* Right to Erasure */}
				<div className='flex items-center justify-between p-4 border rounded-lg'>
					<div className='flex items-center gap-3'>
						<Trash2 className='w-5 h-5 text-red-600' />
						<div>
							<h4 className='font-medium'>Right to Erasure</h4>
							<p className='text-sm text-muted-foreground'>
								Permanently delete your account and all associated data
							</p>
						</div>
					</div>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								disabled={loading !== null}
								variant='destructive'
								size='sm'>
								{loading === "delete" ? "Deleting..." : "Delete Account"}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete
									your account and remove all associated data from our servers,
									including:
									<ul className='list-disc list-inside mt-2 space-y-1'>
										<li>Personal information</li>
										<li>All databases and tables</li>
										<li>API tokens</li>
										<li>Subscription data</li>
										<li>Usage history</li>
									</ul>
									<br />
									<strong className='text-red-600'>
										⚠️ Warning: If you are an admin, this will also delete your
										entire tenant including all databases, tables, and data for
										all users in your organization.
									</strong>
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeleteAccount}
									className='bg-red-600 hover:bg-red-700'>
									Delete Account
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>

				{/* Information about other rights */}
				<div className='mt-6 p-4 bg-blue-50 rounded-lg'>
					<h4 className='font-medium text-blue-900 mb-2'>Other GDPR Rights</h4>
					<div className='space-y-2 text-sm text-blue-800'>
						<p>
							• <strong>Right to Portability:</strong> Your data is exported in
							a machine-readable format
						</p>
						<p>
							• <strong>Right to Restriction:</strong> Contact us to restrict
							processing of your data
						</p>
						<p>
							• <strong>Right to Object:</strong> You can withdraw consent at
							any time
						</p>
						<p>
							• <strong>Right to Complain:</strong> Contact your local data
							protection authority
						</p>
					</div>
				</div>

				{/* Contact Information */}
				<div className='mt-4 p-4 bg-gray-50 rounded-lg'>
					<h4 className='font-medium mb-2'>Need Help?</h4>
					<p className='text-sm text-muted-foreground mb-2'>
						For privacy concerns or to exercise your GDPR rights, contact us:
					</p>
					<div className='space-y-1 text-sm'>
						<p>
							📧{" "}
							<a
								href='mailto:contact@ydv.digital'
								className='text-blue-600 hover:underline'>
								contact@ydv.digital
							</a>
						</p>
						<p>
							📧{" "}
							<a
								href='mailto:support@ydv.digital'
								className='text-blue-600 hover:underline'>
								support@ydv.digital
							</a>
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
