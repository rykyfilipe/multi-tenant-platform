/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
	X,
	Settings,
	Palette,
	Zap,
	Database,
	Eye,
	Lock,
	RefreshCw,
	Filter,
	TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { Badge } from "@/components/ui/badge";
import { Widget, WidgetConfig } from "@/types/dashboard";

// Extended config interface for the modal that includes all possible properties
interface ExtendedWidgetConfig {
	// Base properties from WidgetConfig
	title?: string;
	padding?: number;
	background?: string;
	border?: {
		width: number;
		color: string;
		radius: number;
	};

	// Extended styling properties
	backgroundColor?: string;
	borderColor?: string;
	borderWidth?: number;
	borderRadius?: number;
	margin?: number;

	// Behavior properties
	isDraggable?: boolean;
	isResizable?: boolean;
	isCollapsible?: boolean;
	refreshInterval?: number;

	// Data properties
	dataSource?: string;
	filters?: string[];
	showDataLabels?: boolean;

	// Permission properties
	isPublic?: boolean;
	permissions?: string[];
	allowedRoles?: string;

	// Advanced properties
	customCSS?: string;

	// Widget-specific properties (union type properties)
	text?: string;
	fontSize?: number;
	fontWeight?: number;
	color?: string;
	alignment?: "left" | "center" | "right";
	lineHeight?: number;
	items?: string[];
	showBullets?: boolean;
	maxItems?: number;
	tableName?: string;
	columns?: string[];
	pageSize?: number;
	showHeader?: boolean;
	showPagination?: boolean;
	sortable?: boolean;
	x?: string;
	y?: string;
	chartType?: "line" | "bar" | "pie" | "area";
	aggregate?: "sum" | "count" | "avg" | "min" | "max";
	showLegend?: boolean;
	height?: number;
	events?: Array<{
		date: string;
		title: string;
		color: string;
	}>;
	showToday?: boolean;
	tasks?: Array<{
		id: string;
		title: string;
		completed: boolean;
		priority: "low" | "medium" | "high";
	}>;
	showCompleted?: boolean;
	allowAdd?: boolean;
	src?: string;
	alt?: string;
	width?: number;
	objectFit?: "cover" | "contain" | "fill";
	value?: number;
	max?: number;
	showPercentage?: boolean;
	label?: string;
}

interface WidgetSettingsModalProps {
	widget: Widget | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: (widgetId: string, updates: Partial<Widget>) => void;
}

export function WidgetSettingsModal({
	widget,
	isOpen,
	onClose,
	onSave,
}: WidgetSettingsModalProps) {
	const [config, setConfig] = useState<ExtendedWidgetConfig>({});
	const [refreshInterval, setRefreshInterval] = useState(0);
	const [isPublic, setIsPublic] = useState(false);
	const [permissions, setPermissions] = useState<string[]>([]);
	const [dataSource, setDataSource] = useState("");
	const [filters, setFilters] = useState<string[]>([]);

	useEffect(() => {
		if (widget) {
			const baseConfig = widget.config || {};
			setConfig(baseConfig as ExtendedWidgetConfig);
			setRefreshInterval((baseConfig as any).refreshInterval || 0);
			setIsPublic((baseConfig as any).isPublic || false);
			setPermissions((baseConfig as any).permissions || []);
			setDataSource((baseConfig as any).dataSource || "");
			setFilters((baseConfig as any).filters || []);
		}
	}, [widget]);

	const updateConfig = (key: string, value: any) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
	};

	const addFilter = () => {
		setFilters((prev) => [...prev, ""]);
	};

	const removeFilter = (index: number) => {
		setFilters((prev) => prev.filter((_, i) => i !== index));
	};

	const updateFilter = (index: number, value: string) => {
		setFilters((prev) => prev.map((f, i) => (i === index ? value : f)));
	};

	const addPermission = (permission: string) => {
		if (!permissions.includes(permission)) {
			setPermissions((prev) => [...prev, permission]);
		}
	};

	const removePermission = (permission: string) => {
		setPermissions((prev) => prev.filter((p) => p !== permission));
	};

	const handleSave = () => {
		if (widget) {
			// Create a base config that matches the original widget type
			const baseConfig = { ...widget.config };

			// Merge with extended properties
			const updatedConfig = {
				...baseConfig,
				...config,
				refreshInterval,
				isPublic,
				permissions,
				dataSource,
				filters: filters.filter((f) => f.trim()),
			};

			const updates: Partial<Widget> = {
				config: updatedConfig as WidgetConfig,
			};
			onSave(widget.id, updates);
			onClose();
		}
	};

	if (!isOpen || !widget) return null;

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
			<div className='bg-card border rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b'>
					<div className='flex items-center gap-3'>
						<Settings className='w-5 h-5' />
						<div>
							<h2 className='text-xl font-semibold'>Widget Settings</h2>
							<p className='text-sm text-muted-foreground'>
								Advanced configuration for {widget.config?.title || "Widget"}
							</p>
						</div>
					</div>
					<Button variant='ghost' size='sm' onClick={onClose}>
						<X className='w-4 h-4' />
					</Button>
				</div>

				{/* Content */}
				<div className='p-6'>
					<Tabs defaultValue='styling' className='w-full'>
						<TabsList className='grid w-full grid-cols-5'>
							<TabsTrigger value='styling' className='flex items-center gap-2'>
								<Palette className='w-4 h-4' />
								Styling
							</TabsTrigger>
							<TabsTrigger value='behavior' className='flex items-center gap-2'>
								<Zap className='w-4 h-4' />
								Behavior
							</TabsTrigger>
							<TabsTrigger value='data' className='flex items-center gap-2'>
								<Database className='w-4 h-4' />
								Data
							</TabsTrigger>
							<TabsTrigger
								value='permissions'
								className='flex items-center gap-2'>
								<Lock className='w-4 h-4' />
								Access
							</TabsTrigger>
							<TabsTrigger value='advanced' className='flex items-center gap-2'>
								<Settings className='w-4 h-4' />
								Advanced
							</TabsTrigger>
						</TabsList>

						{/* Styling Tab */}
						<TabsContent value='styling' className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Visual Appearance</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='grid grid-cols-2 gap-4'>
										<div>
											<Label htmlFor='backgroundColor'>Background Color</Label>
											<ColorPicker
												value={config.backgroundColor || "#ffffff"}
												onChange={(color: string) =>
													updateConfig("backgroundColor", color)
												}
											/>
										</div>
										<div>
											<Label htmlFor='borderColor'>Border Color</Label>
											<ColorPicker
												value={config.borderColor || "#e2e8f0"}
												onChange={(color: string) =>
													updateConfig("borderColor", color)
												}
											/>
										</div>
									</div>
									<div className='grid grid-cols-2 gap-4'>
										<div>
											<Label htmlFor='borderWidth'>Border Width</Label>
											<Slider
												value={[config.borderWidth || 1]}
												onValueChange={([value]) =>
													updateConfig("borderWidth", value)
												}
												min={0}
												max={10}
												step={1}
												className='w-full'
											/>
											<span className='text-sm text-muted-foreground'>
												{config.borderWidth || 1}px
											</span>
										</div>
										<div>
											<Label htmlFor='borderRadius'>Border Radius</Label>
											<Slider
												value={[config.borderRadius || 8]}
												onValueChange={([value]) =>
													updateConfig("borderRadius", value)
												}
												min={0}
												max={20}
												step={1}
												className='w-full'
											/>
											<span className='text-sm text-muted-foreground'>
												{config.borderRadius || 8}px
											</span>
										</div>
									</div>
									<div className='grid grid-cols-2 gap-4'>
										<div>
											<Label htmlFor='padding'>Padding</Label>
											<Slider
												value={[config.padding || 16]}
												onValueChange={([value]) =>
													updateConfig("padding", value)
												}
												min={0}
												max={32}
												step={4}
												className='w-full'
											/>
											<span className='text-sm text-muted-foreground'>
												{config.padding || 16}px
											</span>
										</div>
										<div>
											<Label htmlFor='margin'>Margin</Label>
											<Slider
												value={[config.margin || 8]}
												onValueChange={([value]) =>
													updateConfig("margin", value)
												}
												min={0}
												max={24}
												step={4}
												className='w-full'
											/>
											<span className='text-sm text-muted-foreground'>
												{config.margin || 8}px
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Behavior Tab */}
						<TabsContent value='behavior' className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Widget Behavior</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='isDraggable'>Draggable</Label>
											<p className='text-sm text-muted-foreground'>
												Allow users to move this widget
											</p>
										</div>
										<Switch
											id='isDraggable'
											checked={config.isDraggable !== false}
											onCheckedChange={(checked) =>
												updateConfig("isDraggable", checked)
											}
										/>
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='isResizable'>Resizable</Label>
											<p className='text-sm text-muted-foreground'>
												Allow users to resize this widget
											</p>
										</div>
										<Switch
											id='isResizable'
											checked={config.isResizable !== false}
											onCheckedChange={(checked) =>
												updateConfig("isResizable", checked)
											}
										/>
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='isCollapsible'>Collapsible</Label>
											<p className='text-sm text-muted-foreground'>
												Allow users to collapse this widget
											</p>
										</div>
										<Switch
											id='isCollapsible'
											checked={config.isCollapsible || false}
											onCheckedChange={(checked) =>
												updateConfig("isCollapsible", checked)
											}
										/>
									</div>
									<div>
										<Label htmlFor='refreshInterval'>
											Auto-refresh Interval (seconds)
										</Label>
										<Select
											value={refreshInterval.toString()}
											onValueChange={(value) =>
												setRefreshInterval(parseInt(value))
											}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='0'>No auto-refresh</SelectItem>
												<SelectItem value='30'>30 seconds</SelectItem>
												<SelectItem value='60'>1 minute</SelectItem>
												<SelectItem value='300'>5 minutes</SelectItem>
												<SelectItem value='900'>15 minutes</SelectItem>
												<SelectItem value='3600'>1 hour</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Data Tab */}
						<TabsContent value='data' className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Data Configuration</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<Label htmlFor='dataSource'>Data Source</Label>
										<Input
											id='dataSource'
											value={dataSource}
											onChange={(e) => setDataSource(e.target.value)}
											placeholder='API endpoint, database query, or file path'
										/>
									</div>
									<div>
										<Label>Data Filters</Label>
										<div className='space-y-2'>
											{filters.map((filter, index) => (
												<div key={index} className='flex gap-2'>
													<Input
														value={filter}
														onChange={(e) =>
															updateFilter(index, e.target.value)
														}
														placeholder='Filter condition'
													/>
													<Button
														variant='outline'
														size='sm'
														onClick={() => removeFilter(index)}>
														<X className='w-4 h-4' />
													</Button>
												</div>
											))}
											<Button variant='outline' size='sm' onClick={addFilter}>
												<Filter className='w-4 h-4 mr-2' />
												Add Filter
											</Button>
										</div>
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='showDataLabels'>Show Data Labels</Label>
											<p className='text-sm text-muted-foreground'>
												Display data values on charts
											</p>
										</div>
										<Switch
											id='showDataLabels'
											checked={config.showDataLabels || false}
											onCheckedChange={(checked) =>
												updateConfig("showDataLabels", checked)
											}
										/>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Permissions Tab */}
						<TabsContent value='permissions' className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Access Control</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='isPublic'>Public Widget</Label>
											<p className='text-sm text-muted-foreground'>
												Visible to all users
											</p>
										</div>
										<Switch
											id='isPublic'
											checked={isPublic}
											onCheckedChange={setIsPublic}
										/>
									</div>
									<div>
										<Label>Required Permissions</Label>
										<div className='flex flex-wrap gap-2 mt-2'>
											{["read", "write", "delete", "admin"].map(
												(permission) => (
													<Badge
														key={permission}
														variant={
															permissions.includes(permission)
																? "default"
																: "outline"
														}
														className='cursor-pointer'
														onClick={() => {
															if (permissions.includes(permission)) {
																removePermission(permission);
															} else {
																addPermission(permission);
															}
														}}>
														{permission}
													</Badge>
												),
											)}
										</div>
									</div>
									<div>
										<Label htmlFor='allowedRoles'>Allowed Roles</Label>
										<Input
											id='allowedRoles'
											value={config.allowedRoles || ""}
											onChange={(e) =>
												updateConfig("allowedRoles", e.target.value)
											}
											placeholder='admin,user,manager (comma-separated)'
										/>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Advanced Tab */}
						<TabsContent value='advanced' className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Advanced Settings</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<Label htmlFor='customCSS'>Custom CSS</Label>
										<Textarea
											id='customCSS'
											value={config.customCSS || ""}
											onChange={(e) =>
												updateConfig("customCSS", e.target.value)
											}
											placeholder='Enter custom CSS rules'
											rows={4}
										/>
									</div>
									<div>
										<Label htmlFor='widgetId'>Widget ID</Label>
										<Input
											id='widgetId'
											value={widget.id}
											disabled
											className='bg-muted'
										/>
									</div>
									<div className='grid grid-cols-2 gap-4 text-sm text-muted-foreground'>
										<div>
											<strong>Created:</strong>{" "}
											{new Date(widget.createdAt).toLocaleDateString()}
										</div>
										<div>
											<strong>Updated:</strong>{" "}
											{new Date(widget.updatedAt).toLocaleDateString()}
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>

				{/* Footer */}
				<div className='flex items-center justify-end gap-3 p-6 border-t'>
					<Button variant='outline' onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleSave}>
						<Settings className='w-4 h-4 mr-2' />
						Save Settings
					</Button>
				</div>
			</div>
		</div>
	);
}
