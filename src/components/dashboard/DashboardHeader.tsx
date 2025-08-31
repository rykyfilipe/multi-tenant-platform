/** @format */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Plus,
	Trash2,
	Edit2,
	Check,
	X,
	LayoutDashboard,
	Download,
	Users,
} from "lucide-react";
import { Dashboard } from "@/types/dashboard";

interface DashboardHeaderProps {
	dashboards: Dashboard[];
	currentDashboard: Dashboard | null;
	onDashboardSelect: (dashboard: Dashboard) => void;
	onDashboardCreate: (name: string) => void;
	onDashboardDelete: (id: string) => void;
	onDashboardNameUpdate: (id: string, name: string) => void;
	onShowTemplates?: () => void;
	onShowExportImport?: () => void;
	onShowCollaboration?: () => void;
}

export function DashboardHeader({
	dashboards,
	currentDashboard,
	onDashboardSelect,
	onDashboardCreate,
	onDashboardDelete,
	onDashboardNameUpdate,
	onShowTemplates,
	onShowExportImport,
	onShowCollaboration,
}: DashboardHeaderProps) {
	const [isCreating, setIsCreating] = useState(false);
	const [newDashboardName, setNewDashboardName] = useState("");
	const [editingDashboardId, setEditingDashboardId] = useState<string | null>(
		null,
	);
	const [editingName, setEditingName] = useState("");

	const handleCreateDashboard = () => {
		if (newDashboardName.trim()) {
			onDashboardCreate(newDashboardName.trim());
			setNewDashboardName("");
			setIsCreating(false);
		}
	};

	const handleStartEdit = (dashboard: Dashboard) => {
		setEditingDashboardId(dashboard.id);
		setEditingName(dashboard.name);
	};

	const handleSaveEdit = () => {
		if (editingDashboardId && editingName.trim()) {
			onDashboardNameUpdate(editingDashboardId, editingName.trim());
			setEditingDashboardId(null);
			setEditingName("");
		}
	};

	const handleCancelEdit = () => {
		setEditingDashboardId(null);
		setEditingName("");
	};

	return (
		<div className='flex items-center justify-between p-4 border-b bg-card'>
			<div className='flex items-center space-x-4'>
				{/* Dashboard Selector */}
				<div className='flex items-center space-x-2'>
					<select
						value={currentDashboard?.id || ""}
						onChange={(e) => {
							const dashboard = dashboards.find((d) => d.id === e.target.value);
							if (dashboard) onDashboardSelect(dashboard);
						}}
						className='px-3 py-2 border rounded-md bg-background text-foreground'>
						{dashboards.map((dashboard) => (
							<option key={dashboard.id} value={dashboard.id}>
								{dashboard.name}
							</option>
						))}
					</select>

					{/* Edit Dashboard Name */}
					{currentDashboard && (
						<Button
							variant='ghost'
							size='sm'
							onClick={() => handleStartEdit(currentDashboard)}
							className='h-8 w-8 p-0'>
							<Edit2 className='h-4 w-4' />
						</Button>
					)}
				</div>

				{/* Create New Dashboard */}
				{!isCreating ? (
					<Button
						variant='outline'
						size='sm'
						onClick={() => setIsCreating(true)}
						className='flex items-center space-x-2'>
						<Plus className='h-4 w-4' />
						<span>New Dashboard</span>
					</Button>
				) : (
					<div className='flex items-center space-x-2'>
						<Input
							value={newDashboardName}
							onChange={(e) => setNewDashboardName(e.target.value)}
							placeholder='Dashboard name'
							className='w-40'
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreateDashboard();
								if (e.key === "Escape") setIsCreating(false);
							}}
						/>
						<Button
							variant='ghost'
							size='sm'
							onClick={handleCreateDashboard}
							className='h-8 w-8 p-0'>
							<Check className='h-4 w-4' />
						</Button>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => setIsCreating(false)}
							className='h-8 w-8 p-0'>
							<X className='h-4 w-4' />
						</Button>
					</div>
				)}
			</div>

			{/* Action Buttons */}
			<div className='flex items-center space-x-2'>
				{/* Templates */}
				{onShowTemplates && (
					<Button
						variant='outline'
						size='sm'
						onClick={onShowTemplates}
						className='flex items-center space-x-2'>
						<LayoutDashboard className='h-4 w-4' />
						<span>Templates</span>
					</Button>
				)}

				{/* Export/Import */}
				{onShowExportImport && (
					<Button
						variant='outline'
						size='sm'
						onClick={onShowExportImport}
						className='flex items-center space-x-2'>
						<Download className='h-4 w-4' />
						<span>Export/Import</span>
					</Button>
				)}

				{/* Collaboration */}
				{onShowCollaboration && (
					<Button
						variant='outline'
						size='sm'
						onClick={onShowCollaboration}
						className='flex items-center space-x-2'>
						<Users className='h-4 w-4' />
						<span>Share</span>
					</Button>
				)}

				{/* Delete Current Dashboard */}
				{currentDashboard && dashboards.length > 1 && (
					<Button
						variant='destructive'
						size='sm'
						onClick={() => onDashboardDelete(currentDashboard.id)}
						className='flex items-center space-x-2'>
						<Trash2 className='h-4 w-4' />
						<span>Delete</span>
					</Button>
				)}
			</div>

			{/* Edit Mode UI */}
			{editingDashboardId && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
					<div className='bg-card p-6 rounded-lg border shadow-lg'>
						<h3 className='text-lg font-semibold mb-4'>Edit Dashboard Name</h3>
						<Input
							value={editingName}
							onChange={(e) => setEditingName(e.target.value)}
							placeholder='Dashboard name'
							className='w-64 mb-4'
							autoFocus
						/>
						<div className='flex justify-end space-x-2'>
							<Button variant='outline' onClick={handleCancelEdit}>
								Cancel
							</Button>
							<Button onClick={handleSaveEdit}>Save</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
