/** @format */

"use client";

import { useState } from "react";
import { Table } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, Save, X, Database } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import { useLanguage } from "@/contexts/LanguageContext";

interface TableHeaderEditorProps {
	table: Table;
	onTableUpdate: (updatedTable: Table) => void;
}

export function TableHeaderEditor({
	table,
	onTableUpdate,
}: TableHeaderEditorProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [name, setName] = useState(table.name);
	const [description, setDescription] = useState(table.description || "");
	const [isLoading, setIsLoading] = useState(false);
	const { showAlert, token, user, tenant } = useApp();
	const { t } = useLanguage();

	// Get user permissions
	const { permissions: userPermissions } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		table.id,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);

	const handleSave = async () => {
		if (!token || !user || !tenant) {
			showAlert(t("table.headerEditor.mustBeLoggedIn"), "error");
			return;
		}

		if (user.role === "VIEWER") {
			showAlert(t("table.headerEditor.noPermission"), "error");
			return;
		}

		if (!name.trim()) {
			showAlert(t("table.headerEditor.tableNameEmpty"), "error");
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch(
				`/api/tenants/${tenant.id}/databases/${table.databaseId}/tables/${table.id}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						name: name.trim(),
						description: description.trim(),
					}),
				},
			);

			if (!response.ok) {
				throw new Error(t("table.headerEditor.failedToUpdate"));
			}

			const updatedTable = await response.json();
			onTableUpdate(updatedTable);
			setIsEditing(false);
			showAlert(t("table.headerEditor.tableUpdatedSuccess"), "success");
		} catch (error) {
			console.error("Error updating table:", error);
			showAlert(t("table.headerEditor.failedToUpdateTable"), "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		setName(table.name);
		setDescription(table.description || "");
		setIsEditing(false);
	};

	if (isEditing) {
		return (
			<Card className='border border-border/20 bg-card/50 backdrop-blur-sm'>
				<CardHeader className='pb-4'>
					<CardTitle className='text-lg flex items-center gap-2'>
						<Database className='h-5 w-5 text-primary' />
						{t("table.headerEditor.editTable")}
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='table-name'>
							{t("table.headerEditor.tableName")}
						</Label>
						<Input
							id='table-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t("table.headerEditor.enterTableName")}
							className='w-full'
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='table-description'>
							{t("table.headerEditor.description")}
						</Label>
						<Textarea
							id='table-description'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t("table.headerEditor.enterTableDescription")}
							className='w-full min-h-[80px]'
						/>
					</div>
					<div className='flex gap-2 pt-2'>
						<Button
							onClick={handleSave}
							disabled={isLoading || !name.trim()}
							className='flex-1'>
							{isLoading ? (
								<div className='flex items-center gap-2'>
									<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
									{t("table.headerEditor.saving")}
								</div>
							) : (
								<>
									<Save className='h-4 w-4 mr-2' />
									{t("table.headerEditor.saveChanges")}
								</>
							)}
						</Button>
						<Button
							variant='outline'
							onClick={handleCancel}
							disabled={isLoading}
							className='flex-1'>
							<X className='h-4 w-4 mr-2' />
							{t("table.headerEditor.cancel")}
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className='border border-border/20 bg-card/50 backdrop-blur-sm'>
			<CardHeader className='pb-4'>
				<div className='flex items-center justify-between'>
					<CardTitle className='text-lg flex items-center gap-2'>
						<Database className='h-5 w-5 text-primary' />
						{table.name}
					</CardTitle>
					{/* Allow table header editing based on permissions rather than hard-coded role check */}
					{tablePermissions?.canEditTable() && (
						<Button
							variant='outline'
							size='sm'
							onClick={() => setIsEditing(true)}
							className='edit-table-button'>
							<Edit2 className='h-4 w-4 mr-2' />
							{t("table.headerEditor.edit")}
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{table.description ? (
					<p className='text-muted-foreground text-sm leading-relaxed'>
						{table.description}
					</p>
				) : (
					<p className='text-muted-foreground text-sm italic'>
						{t("table.headerEditor.noDescriptionProvided")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
