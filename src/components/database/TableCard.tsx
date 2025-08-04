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
				`/api/tenants/${tenant.id}/databases/${table.databaseId}/tables/${table.id}/public`,
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
				table.isPublic
					? "Table is now private and only accessible to your team"
					: "Table is now public and can be accessed via API",
				"success",
			);

			// Refresh the page to update the table data
			window.location.reload();
		} catch (error) {
			showAlert("Failed to update table visibility settings", "error");
		} finally {
			setIsUpdatingPublic(false);
		}
	};

	return (
		<Card className='table-card border border-border/20 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-border/40 transition-all duration-300'>
			<CardHeader className='pb-4'>
				<div className='w-full flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<h2 className='text-lg font-semibold text-foreground'>
							{table.name}
						</h2>
						{table.isPublic && (
							<Badge
								variant='secondary'
								className='text-xs bg-primary/10 text-primary border-primary/20'>
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
								className='hover:bg-muted/50 text-muted-foreground hover:text-foreground columns-button'>
								<Edit className='w-4 h-4' />
							</Button>
						)}
					</Link>
				</div>
			</CardHeader>

			<CardContent className='space-y-3 text-sm'>
				<div className='space-y-2'>
					<p className='text-muted-foreground line-clamp-2'>
						{table.description || "No description provided"}
					</p>
					<div className='flex items-center justify-between text-xs'>
						<span className='text-muted-foreground'>
							{Array.isArray(table.columns) ? table.columns.length : 0} columns
						</span>
						<span className='text-muted-foreground'>
							{Array.isArray(table.rows) ? table.rows.length : 0} rows
						</span>
					</div>
				</div>
			</CardContent>

			<CardFooter className='flex justify-between pt-4 gap-2'>
				<div className='flex gap-2'>
					<Link href={`/home/database/table/${table.id}/rows`}>
						<Button variant='outline' size='sm' className='rows-button text-xs'>
							{user.role === "VIEWER" ? "View" : "Edit"} rows
						</Button>
					</Link>
					{user.role !== "VIEWER" && (
						<Button
							variant='outline'
							size='sm'
							onClick={handleTogglePublic}
							disabled={isUpdatingPublic}
							className={`text-xs ${
								table.isPublic
									? "text-orange-600 hover:text-orange-700 border-orange-200"
									: "text-blue-600 hover:text-blue-700 border-blue-200"
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
						className='delete-table-button text-xs'>
						<Trash className='w-4 h-4' />
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}

export default TableCard;
