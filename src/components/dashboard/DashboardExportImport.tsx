/** @format */

"use client";

import React, { useState, useRef } from "react";
import {
	Download,
	Upload,
	FileText,
	Copy,
	Check,
	Trash2,
	Eye,
	Calendar,
	User,
	Settings,
	Save,
	FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Dashboard, Widget } from "@/types/dashboard";

interface DashboardExportImportProps {
	isOpen: boolean;
	onClose: () => void;
	currentDashboard: Dashboard | null;
	onImport: (dashboard: Dashboard) => void;
}

interface ExportMetadata {
	version: string;
	exportedAt: string;
	exportedBy: string;
	description?: string;
	tags?: string[];
}

interface DashboardExport {
	metadata: ExportMetadata;
	dashboard: Dashboard;
}

export function DashboardExportImport({
	isOpen,
	onClose,
	currentDashboard,
	onImport,
}: DashboardExportImportProps) {
	const { toast } = useToast();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [exportDescription, setExportDescription] = useState("");
	const [exportTags, setExportTags] = useState("");
	const [importData, setImportData] = useState("");
	const [copied, setCopied] = useState(false);
	const [importPreview, setImportPreview] = useState<Dashboard | null>(null);

	const handleExport = () => {
		if (!currentDashboard) {
			toast({
				title: "Error",
				description: "No dashboard to export",
				variant: "destructive",
			});
			return;
		}

		const exportData: DashboardExport = {
			metadata: {
				version: "1.0.0",
				exportedAt: new Date().toISOString(),
				exportedBy: "Current User", // TODO: Get from auth context
				description: exportDescription || undefined,
				tags: exportTags
					? exportTags.split(",").map((tag) => tag.trim())
					: undefined,
			},
			dashboard: currentDashboard,
		};

		const jsonString = JSON.stringify(exportData, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${currentDashboard.name.replace(
			/\s+/g,
			"_",
		)}_dashboard.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		toast({
			title: "Success",
			description: "Dashboard exported successfully",
		});
	};

	const handleCopyToClipboard = async () => {
		if (!currentDashboard) return;

		const exportData: DashboardExport = {
			metadata: {
				version: "1.0.0",
				exportedAt: new Date().toISOString(),
				exportedBy: "Current User",
				description: exportDescription || undefined,
				tags: exportTags
					? exportTags.split(",").map((tag) => tag.trim())
					: undefined,
			},
			dashboard: currentDashboard,
		};

		try {
			await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast({
				title: "Success",
				description: "Dashboard configuration copied to clipboard",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to copy to clipboard",
				variant: "destructive",
			});
		}
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const parsed = JSON.parse(content);
				setImportData(content);
				setImportPreview(parsed.dashboard || parsed);
			} catch (error) {
				toast({
					title: "Error",
					description: "Invalid JSON file",
					variant: "destructive",
				});
			}
		};
		reader.readAsText(file);
	};

	const handleImport = () => {
		if (!importPreview) {
			toast({
				title: "Error",
				description: "No valid dashboard data to import",
				variant: "destructive",
			});
			return;
		}

		try {
			// Clean up the imported dashboard data
			const cleanDashboard: Dashboard = {
				...importPreview,
				id: "", // Will be assigned by the server
				userId: 0, // Will be assigned by the server
				createdAt: new Date(),
				updatedAt: new Date(),
				widgets: importPreview.widgets.map((widget) => ({
					...widget,
					id: "",
					dashboardId: "",
					createdAt: new Date(),
					updatedAt: new Date(),
				})),
			};

			onImport(cleanDashboard);
			toast({
				title: "Success",
				description: "Dashboard imported successfully",
			});
			onClose();
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to import dashboard",
				variant: "destructive",
			});
		}
	};

	const handlePasteImport = () => {
		try {
			const parsed = JSON.parse(importData);
			setImportPreview(parsed.dashboard || parsed);
		} catch (error) {
			setImportPreview(null);
		}
	};

	const getWidgetTypeIcon = (type: string) => {
		switch (type) {
			case "chart":
				return "📊";
			case "table":
				return "📋";
			case "text":
				return "📝";
			case "progress":
				return "📈";
			case "image":
				return "🖼️";
			case "container":
				return "📦";
			default:
				return "🔧";
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
			<div className='bg-card border rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b'>
					<div className='flex items-center gap-3'>
						<FileText className='w-6 h-6' />
						<div>
							<h2 className='text-xl font-semibold'>
								Export & Import Dashboard
							</h2>
							<p className='text-sm text-muted-foreground'>
								Save and load dashboard configurations
							</p>
						</div>
					</div>
					<Button variant='ghost' size='sm' onClick={onClose}>
						✕
					</Button>
				</div>

				{/* Content */}
				<div className='p-6'>
					<Tabs defaultValue='export' className='w-full'>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='export' className='flex items-center gap-2'>
								<Download className='w-4 h-4' />
								Export
							</TabsTrigger>
							<TabsTrigger value='import' className='flex items-center gap-2'>
								<Upload className='w-4 h-4' />
								Import
							</TabsTrigger>
						</TabsList>

						{/* Export Tab */}
						<TabsContent value='export' className='space-y-6'>
							{currentDashboard ? (
								<>
									<Card>
										<CardHeader>
											<CardTitle>
												Export Dashboard: {currentDashboard.name}
											</CardTitle>
										</CardHeader>
										<CardContent className='space-y-4'>
											<div>
												<Label htmlFor='exportDescription'>
													Description (optional)
												</Label>
												<Textarea
													id='exportDescription'
													value={exportDescription}
													onChange={(e) => setExportDescription(e.target.value)}
													placeholder='Add a description for this export'
													rows={2}
												/>
											</div>
											<div>
												<Label htmlFor='exportTags'>Tags (optional)</Label>
												<Input
													id='exportTags'
													value={exportTags}
													onChange={(e) => setExportTags(e.target.value)}
													placeholder='analytics, kpi, monthly (comma-separated)'
												/>
											</div>
											<div className='flex gap-2'>
												<Button onClick={handleExport} className='flex-1'>
													<Download className='w-4 h-4 mr-2' />
													Download JSON
												</Button>
												<Button
													onClick={handleCopyToClipboard}
													variant='outline'
													className='flex-1'>
													{copied ? (
														<>
															<Check className='w-4 h-4 mr-2' />
															Copied!
														</>
													) : (
														<>
															<Copy className='w-4 h-4 mr-2' />
															Copy to Clipboard
														</>
													)}
												</Button>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle>Export Preview</CardTitle>
										</CardHeader>
										<CardContent>
											<div className='bg-muted p-4 rounded-lg'>
												<div className='grid grid-cols-2 gap-4 text-sm'>
													<div>
														<strong>Dashboard:</strong> {currentDashboard.name}
													</div>
													<div>
														<strong>Widgets:</strong>{" "}
														{currentDashboard.widgets.length}
													</div>
													<div>
														<strong>Created:</strong>{" "}
														{new Date(
															currentDashboard.createdAt,
														).toLocaleDateString()}
													</div>
													<div>
														<strong>Updated:</strong>{" "}
														{new Date(
															currentDashboard.updatedAt,
														).toLocaleDateString()}
													</div>
												</div>
												<Separator className='my-3' />
												<div className='text-sm'>
													<strong>Widget Types:</strong>
													<div className='flex flex-wrap gap-1 mt-2'>
														{Array.from(
															new Set(
																currentDashboard.widgets.map((w) => w.type),
															),
														).map((type) => (
															<Badge key={type} variant='outline'>
																{getWidgetTypeIcon(type)} {type}
															</Badge>
														))}
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</>
							) : (
								<Card>
									<CardContent className='text-center py-8'>
										<FileText className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
										<p className='text-muted-foreground'>
											No dashboard selected for export
										</p>
									</CardContent>
								</Card>
							)}
						</TabsContent>

						{/* Import Tab */}
						<TabsContent value='import' className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Import Dashboard</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<Label>Upload JSON File</Label>
										<div className='flex gap-2'>
											<Button
												onClick={() => fileInputRef.current?.click()}
												variant='outline'
												className='flex-1'>
												<FolderOpen className='w-4 h-4 mr-2' />
												Choose File
											</Button>
											<input
												ref={fileInputRef}
												type='file'
												accept='.json'
												onChange={handleFileUpload}
												className='hidden'
											/>
										</div>
									</div>
									<div>
										<Label htmlFor='importData'>Or Paste JSON Data</Label>
										<Textarea
											id='importData'
											value={importData}
											onChange={(e) => setImportData(e.target.value)}
											placeholder='Paste dashboard JSON configuration here...'
											rows={8}
										/>
										<div className='flex gap-2 mt-2'>
											<Button
												onClick={handlePasteImport}
												variant='outline'
												size='sm'>
												<Eye className='w-4 h-4 mr-2' />
												Preview
											</Button>
											<Button
												onClick={() => setImportData("")}
												variant='outline'
												size='sm'>
												<Trash2 className='w-4 h-4 mr-2' />
												Clear
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Import Preview */}
							{importPreview && (
								<Card>
									<CardHeader>
										<CardTitle>Import Preview</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='bg-muted p-4 rounded-lg'>
											<div className='grid grid-cols-2 gap-4 text-sm mb-3'>
												<div>
													<strong>Dashboard:</strong> {importPreview.name}
												</div>
												<div>
													<strong>Widgets:</strong>{" "}
													{importPreview.widgets.length}
												</div>
											</div>
											<div className='text-sm'>
												<strong>Widgets:</strong>
												<div className='space-y-2 mt-2'>
													{importPreview.widgets.map((widget, index) => (
														<div
															key={index}
															className='flex items-center justify-between bg-background p-2 rounded border'>
															<div className='flex items-center gap-2'>
																<span>{getWidgetTypeIcon(widget.type)}</span>
																<span className='font-medium'>
																	{widget.config?.title ||
																		`Widget ${index + 1}`}
																</span>
																<Badge variant='outline'>{widget.type}</Badge>
															</div>
															<div className='text-xs text-muted-foreground'>
																{widget.position.w}×{widget.position.h}
															</div>
														</div>
													))}
												</div>
											</div>
											<div className='mt-4'>
												<Button onClick={handleImport} className='w-full'>
													<Upload className='w-4 h-4 mr-2' />
													Import Dashboard
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							)}
						</TabsContent>
					</Tabs>
				</div>

				{/* Footer */}
				<div className='flex items-center justify-end gap-3 p-6 border-t'>
					<Button variant='outline' onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
