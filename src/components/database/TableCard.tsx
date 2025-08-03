/** @format */

import { Edit, Trash, Globe, Lock } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { useDatabase } from "@/contexts/DatabaseContext";
import { usePlanLimitError } from "@/hooks/usePlanLimitError";
import Link from "next/link";
import { Table } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { useState } from "react";

function TableCard({ table }: { table: Table }) {
	const { handleDeleteTable } = useDatabase();
	const { user, token, tenant, showAlert } = useApp();
	const { handleApiError } = usePlanLimitError();
	const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);

	const handleTogglePublic = async () => {
		if (!token || !tenant) return;

		setIsUpdatingPublic(true);
		try {
			const response = await fetch(
				`/api/tenants/${tenant.id}/database/tables/${table.id}/public`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ isPublic: !table.isPublic }),
				},
			);

			if (!response.ok) {
				handleApiError(response);
				return;
			}

			showAlert(
				table.isPublic ? "Table is now private" : "Table is now public",
				"success",
			);

			// Refresh the page to update the table data
			window.location.reload();
		} catch (error) {
			showAlert("Failed to update table public status", "error");
		} finally {
			setIsUpdatingPublic(false);
		}
	};

	return (
		<Card className='table-card shadow-md hover:shadow-lg transition-shadow rounded-2xl'>
			<CardHeader className='pb-2'>
				<div className='w-full flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<h2 className='text-xl font-semibold text-slate-800'>
							{table.name}
						</h2>
						{table.isPublic && (
							<Badge variant='secondary' className='text-xs'>
								<Globe className='w-3 h-3 mr-1' />
								Public
							</Badge>
						)}
					</div>
					<Link href={`/home/database/table/${table.id}/columns`}>
						{user.role !== "VIEWER" && (
							<Button
								variant='ghost'
								size='icon'
								className='hover:bg-slate-100 text-slate-600 columns-button'>
								<Edit className='w-5 h-5' />
							</Button>
						)}
					</Link>
				</div>
			</CardHeader>

			<CardContent className='space-y-2 text-sm text-slate-600'>
				<p className='max-w-full  break-words'>
					<span className='font-medium text-slate-800'>Description: </span>
					{table.description}
				</p>
				<p>
					<span className='font-medium text-slate-800'>Columns: </span>
					{Array.isArray(table.columns) ? table.columns.length : 0}
				</p>
				<p>
					<span className='font-medium text-slate-800'>Rows: </span>
					{Array.isArray(table.rows) ? table.rows.length : 0}
				</p>
			</CardContent>

			<CardFooter
				className={`flex ${
					user.role === "VIEWER" ? "justify-end" : "justify-between"
				}   pt-4 gap-2`}>
				<div className='flex gap-2'>
					<Link href={`/home/database/table/${table.id}/rows`}>
						<Button variant='outline' size='sm' className='rows-button'>
							{user.role === "VIEWER" ? "View" : "Edit"} rows
						</Button>
					</Link>
					{user.role !== "VIEWER" && (
						<Button
							variant='outline'
							size='sm'
							onClick={handleTogglePublic}
							disabled={isUpdatingPublic}
							className={`${
								table.isPublic
									? "text-orange-600 hover:text-orange-700"
									: "text-blue-600 hover:text-blue-700"
							}`}>
							{table.isPublic ? (
								<Lock className='w-4 h-4' />
							) : (
								<Globe className='w-4 h-4' />
							)}
						</Button>
					)}
				</div>
				{user.role !== "VIEWER" && (
					<Button
						size='sm'
						variant='destructive'
						onClick={() => handleDeleteTable(table?.id.toString())}
						className='bg-red-500 hover:bg-red-600 text-white delete-table-button'>
						<Trash className='w-4 h-4' />
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}

export default TableCard;
