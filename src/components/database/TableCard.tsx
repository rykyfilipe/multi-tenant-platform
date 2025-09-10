/** @format */

import { Edit, Database } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { useDatabase } from "@/contexts/DatabaseContext";
import Link from "next/link";
import { Table } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { DeleteTableDialog } from "./DeleteTableDialog";

export function TableCard({ table }: { table: Table }) {
	const { handleDeleteTable } = useDatabase();
	const { user } = useApp();

	return (
		<Card className='table-card border border-border/20 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-border/40 transition-all duration-300 h-full flex flex-col'>
			<CardHeader className='pb-3 sm:pb-4 flex-shrink-0'>
				<div className='w-full flex items-start justify-between gap-2'>
					<div className='flex-1 min-w-0'>
						<h2 className='text-base sm:text-lg font-semibold text-foreground truncate'>
							{table.name}
						</h2>
					</div>
					<Link href={`/home/database/table/${table.id}/edit`}>
						{/* Allow table actions based on permissions rather than hard-coded role check */}
						{user?.role === "ADMIN" && (
							<Button
								variant='ghost'
								size='icon'
								className='hover:bg-muted/50 text-muted-foreground hover:text-foreground unified-editor-button flex-shrink-0'>
								<Edit className='w-4 h-4' />
							</Button>
						)}
					</Link>
				</div>
			</CardHeader>

			<CardContent className='space-y-3 text-sm flex-1'>
				<div className='space-y-2'>
					<p className='text-muted-foreground line-clamp-2 text-xs sm:text-sm'>
						{table.description || "No description provided"}
					</p>
					<div className='flex items-center justify-between text-xs'>
						<span className='text-muted-foreground'>
							{table.columnsCount ??
								(Array.isArray(table.columns) ? table.columns.length : 0)}{" "}
							columns
						</span>
						<span className='text-muted-foreground'>
							{table.rowsCount ??
								(Array.isArray(table.rows) ? table.rows.length : 0)}{" "}
							rows
						</span>
					</div>
				</div>
			</CardContent>

			<CardFooter className='flex flex-col sm:flex-row justify-between pt-3 sm:pt-4 gap-2 sm:gap-2 flex-shrink-0'>
				<div className='flex gap-2 w-full sm:w-auto'>
					<Link href={`/home/database/table/${table.id}/edit`} className='flex-1 sm:flex-none'>
						<Button variant='outline' size='sm' className='unified-editor-button text-xs w-full sm:w-auto'>
							{user?.role === "VIEWER" ? "View" : "Edit"} Table
						</Button>
					</Link>
				</div>
				<div className='flex items-center justify-end gap-2'>
					<DeleteTableDialog
						tableName={table.name}
						tableId={table.id.toString()}
						onConfirm={handleDeleteTable}
						isProtected={table.isPredefined}
						rowsCount={table.rowsCount ?? (Array.isArray(table.rows) ? table.rows.length : 0)}
						columnsCount={table.columnsCount ?? (Array.isArray(table.columns) ? table.columns.length : 0)}
						disabled={user?.role === "VIEWER"}
					/>
				</div>
			</CardFooter>
		</Card>
	);
}
