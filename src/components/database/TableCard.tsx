/** @format */

import { Database, Edit, Lock, Sparkles, Columns, BarChart3 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { useDatabase } from "@/contexts/DatabaseContext";
import Link from "next/link";
import { Table } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { DeleteTableDialog } from "./DeleteTableDialog";
import { useRouter } from "next/navigation";

export function TableCard({ table }: { table: Table }) {
	const { handleDeleteTable } = useDatabase();
	const { user } = useApp();
	const router = useRouter();

	const handleEditTable = () => {
		router.push(`/home/database/table/${table.id}/edit`);
	};

	const columnsCount = table.columnsCount ?? (Array.isArray(table.columns) ? table.columns.length : 0);
	const rowsCount = table.rowsCount ?? (Array.isArray(table.rows) ? table.rows.length : 0);

	return (
		<Card className='table-card group border border-border bg-card hover:border-primary/50 rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col'>
			<CardHeader className='pb-3 flex-shrink-0'>
				<div className='w-full'>
					<div className="flex items-center justify-between gap-2 mb-2">
						<div className="flex items-center gap-2 min-w-0 flex-1">
							<Database className="w-4 h-4 text-primary flex-shrink-0" />
							<h2 className='text-sm font-semibold text-foreground truncate'>
								{table.name}
							</h2>
						</div>
						<div className="flex items-center gap-1 flex-shrink-0">
							{table.isProtected && (
								<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/30">
									<Lock className="w-2.5 h-2.5 mr-0.5" />
									Protected
								</Badge>
							)}
							{table.isModuleTable && (
								<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30">
									<Sparkles className="w-2.5 h-2.5 mr-0.5" />
									Module
								</Badge>
							)}
						</div>
					</div>
					<p className='text-xs text-muted-foreground line-clamp-2'>
						{table.description || "No description"}
					</p>
				</div>
			</CardHeader>

			<CardContent className='flex-1 pt-2 pb-3'>
				<div className='flex items-center gap-4 text-xs text-muted-foreground'>
					<div className="flex items-center gap-1.5">
						<Columns className="w-3 h-3" />
						<span>{columnsCount} cols</span>
					</div>
					<div className="flex items-center gap-1.5">
						<BarChart3 className="w-3 h-3" />
						<span>{rowsCount} rows</span>
					</div>
				</div>
			</CardContent>

			<CardFooter className='flex justify-between items-center pt-2 pb-3 flex-shrink-0 border-t border-border'>
				<Button
					onClick={handleEditTable}
					className='flex items-center gap-1.5'
					size='sm'
					variant='default'
				>
					<Edit className='w-3.5 h-3.5' />
					Edit
				</Button>
				
			{user?.role !== "VIEWER" && (
				<DeleteTableDialog
					tableName={table.name}
					tableId={table.id.toString()}
					onConfirm={handleDeleteTable}
					isProtected={table.isPredefined}
					isModuleTable={table.isModuleTable}
					rowsCount={rowsCount}
					columnsCount={columnsCount}
				/>
			)}
			</CardFooter>
		</Card>
	);
}
