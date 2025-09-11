/** @format */

import { Database, Edit } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
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

	return (
		<Card className='table-card border border-border/20 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-border/40 transition-all duration-300 h-full flex flex-col hover:shadow-md'>
			<CardHeader className='pb-3 sm:pb-4 flex-shrink-0'>
				<div className='w-full flex items-start justify-between gap-2'>
					<div className='flex-1 min-w-0'>
						<h2 className='text-base sm:text-lg font-semibold text-foreground truncate'>
							{table.name}
						</h2>
					</div>
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

			<CardFooter className='flex justify-between items-center pt-3 sm:pt-4 flex-shrink-0'>
				<Button
					onClick={handleEditTable}
					className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200'
					size='sm'
				>
					<Edit className='w-4 h-4' />
					Edit Table
				</Button>
				
				<DeleteTableDialog
					tableName={table.name}
					tableId={table.id.toString()}
					onConfirm={handleDeleteTable}
					isProtected={table.isPredefined}
					isModuleTable={table.isModuleTable}
					rowsCount={table.rowsCount ?? (Array.isArray(table.rows) ? table.rows.length : 0)}
					columnsCount={table.columnsCount ?? (Array.isArray(table.columns) ? table.columns.length : 0)}
					disabled={user?.role === "VIEWER"}
				/>
			</CardFooter>
		</Card>
	);
}
