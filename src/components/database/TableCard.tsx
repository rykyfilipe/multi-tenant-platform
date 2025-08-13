/** @format */

import { Edit, Trash } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { useDatabase } from "@/contexts/DatabaseContext";
import Link from "next/link";
import { Table } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { memo } from "react";

const TableCard = memo(function TableCard({ table }: { table: Table }) {
	const { handleDeleteTable } = useDatabase();
	const { user } = useApp();

	return (
		<Card className='table-card border border-border/20 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-border/40 transition-all duration-300'>
			<CardHeader className='pb-4'>
				<div className='w-full flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<h2 className='text-lg font-semibold text-foreground'>
							{table.name}
						</h2>
					</div>
					<Link href={`/home/database/table/${table.id}/columns`}>
						{user?.role !== "VIEWER" && (
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

			<CardFooter className='flex justify-between pt-4 gap-2'>
				<div className='flex gap-2'>
					<Link href={`/home/database/table/${table.id}/rows`}>
						<Button variant='outline' size='sm' className='rows-button text-xs'>
							{user?.role === "VIEWER" ? "View" : "Edit"} rows
						</Button>
					</Link>
				</div>
				{user?.role !== "VIEWER" && (
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
});

export default TableCard;
