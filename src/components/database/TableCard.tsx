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
		<Card className='table-card group border border-border/50 bg-card shadow-md hover:shadow-lg rounded-2xl overflow-hidden transition-all duration-200 h-full flex flex-col hover:border-primary/50'>
			<CardHeader className='pb-3 flex-shrink-0 bg-muted/30 border-b border-border/50'>
				<div className='w-full flex items-start justify-between gap-3'>
					<div className='flex-1 min-w-0'>
						<div className="flex items-center gap-2 mb-2">
							<div className="p-1.5 rounded-lg bg-primary/10 shadow-sm">
								<Database className="w-4 h-4 text-primary" />
							</div>
							<h2 className='text-base font-semibold text-foreground truncate'>
								{table.name}
							</h2>
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							{table.isProtected && (
								<Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/30">
									<Lock className="w-3 h-3 mr-1" />
									Protected
								</Badge>
							)}
							{table.isModuleTable && (
								<Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30">
									<Sparkles className="w-3 h-3 mr-1" />
									Module
								</Badge>
							)}
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className='flex-1 pt-4 pb-4 space-y-4'>
				<p className='text-sm text-muted-foreground line-clamp-2 min-h-[40px]'>
					{table.description || "No description provided"}
				</p>
				
				{/* Stats Grid */}
				<div className='grid grid-cols-2 gap-3'>
					<div className="bg-muted/30 border border-border/30 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-1">
							<Columns className="w-3.5 h-3.5 text-muted-foreground" />
							<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
								Columns
							</span>
						</div>
						<p className="text-2xl font-bold text-foreground">
							{columnsCount}
						</p>
					</div>
					<div className="bg-muted/30 border border-border/30 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-1">
							<BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
							<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
								Rows
							</span>
						</div>
						<p className="text-2xl font-bold text-foreground">
							{rowsCount}
						</p>
					</div>
				</div>
			</CardContent>

			<CardFooter className='flex justify-between items-center pt-3 pb-4 flex-shrink-0 border-t border-border/30 bg-muted/20'>
				<Button
					onClick={handleEditTable}
					className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200'
					size='sm'
				>
					<Edit className='w-4 h-4' />
					<span className="font-semibold">Edit</span>
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
