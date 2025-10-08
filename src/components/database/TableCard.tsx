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
		<Card className='table-card group border-0 bg-white dark:bg-card shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col hover:scale-[1.02]'>
			<CardHeader className='pb-4 flex-shrink-0 bg-gradient-to-r from-gray-50 to-white dark:from-card dark:to-card/50 border-b border-gray-100 dark:border-border'>
				<div className='w-full flex items-start justify-between gap-3'>
					<div className='flex-1 min-w-0'>
						<div className="flex items-center gap-2 mb-2">
							<div className="p-2 rounded-lg bg-white dark:bg-card shadow-sm">
								<Database className="w-4 h-4 text-gray-700 dark:text-foreground" />
							</div>
							<h2 className='text-lg font-bold text-gray-900 dark:text-foreground truncate'>
								{table.name}
							</h2>
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							{table.isProtected && (
								<Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
									<Lock className="w-3 h-3 mr-1" />
									Protected
								</Badge>
							)}
							{table.isModuleTable && (
								<Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
									<Sparkles className="w-3 h-3 mr-1" />
									Module
								</Badge>
							)}
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className='flex-1 pt-4 pb-4 space-y-4'>
				<p className='text-sm text-gray-600 dark:text-muted-foreground line-clamp-2 min-h-[40px]'>
					{table.description || "No description provided"}
				</p>
				
				{/* Stats Grid */}
				<div className='grid grid-cols-2 gap-3'>
					<div className="bg-gray-50 dark:bg-card/50 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-1">
							<Columns className="w-3.5 h-3.5 text-gray-500" />
							<span className='text-xs font-semibold text-gray-600 dark:text-muted-foreground uppercase tracking-wide'>
								Columns
							</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 dark:text-foreground">
							{columnsCount}
						</p>
					</div>
					<div className="bg-gray-50 dark:bg-card/50 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-1">
							<BarChart3 className="w-3.5 h-3.5 text-gray-500" />
							<span className='text-xs font-semibold text-gray-600 dark:text-muted-foreground uppercase tracking-wide'>
								Rows
							</span>
						</div>
						<p className="text-2xl font-bold text-gray-900 dark:text-foreground">
							{rowsCount}
						</p>
					</div>
				</div>
			</CardContent>

			<CardFooter className='flex justify-between items-center pt-4 flex-shrink-0 border-t border-gray-100 dark:border-border bg-gray-50/50 dark:bg-card/30'>
				<Button
					onClick={handleEditTable}
					className='flex items-center gap-2 bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200'
					size='sm'
				>
					<Edit className='w-4 h-4' />
					<span className="font-semibold">Edit Table</span>
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
