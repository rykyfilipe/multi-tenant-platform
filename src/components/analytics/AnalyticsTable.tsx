/** @format */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
	LucideIcon, 
	Search, 
	ArrowUpDown, 
	ArrowUp, 
	ArrowDown,
	MoreHorizontal 
} from "lucide-react";

interface TableColumn {
	key: string;
	label: string;
	sortable?: boolean;
	render?: (value: any, item: any) => React.ReactNode;
}

interface AnalyticsTableProps {
	title: string;
	icon: LucideIcon;
	data: any[];
	columns: TableColumn[];
	searchable?: boolean;
	className?: string;
	delay?: number;
	description?: string;
}

export const AnalyticsTable: React.FC<AnalyticsTableProps> = ({
	title,
	icon: Icon,
	data,
	columns,
	searchable = true,
	className = "",
	delay = 0,
	description,
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	const filteredData = data.filter((item) => {
		if (!searchable || !searchTerm) return true;
		return Object.values(item).some((value) =>
			String(value).toLowerCase().includes(searchTerm.toLowerCase())
		);
	});

	const sortedData = [...filteredData].sort((a, b) => {
		if (!sortColumn) return 0;
		
		const aValue = a[sortColumn];
		const bValue = b[sortColumn];
		
		if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
		if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
		return 0;
	});

	const handleSort = (columnKey: string) => {
		if (sortColumn === columnKey) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortColumn(columnKey);
			setSortDirection("asc");
		}
	};

	const getSortIcon = (columnKey: string) => {
		if (sortColumn !== columnKey) return <ArrowUpDown className='w-4 h-4' />;
		return sortDirection === "asc" ? <ArrowUp className='w-4 h-4' /> : <ArrowDown className='w-4 h-4' />;
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
			className={`h-full ${className}`}>
			<Card className='group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/60 border-border/20 hover:border-border/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 backdrop-blur-sm h-full'>
				{/* Subtle gradient overlay */}
				<div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
				
				<CardHeader className='pb-4 relative z-10'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300'>
								<Icon className='w-5 h-5 text-primary' />
							</div>
							<div>
								<CardTitle className='text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200'>
									{title}
								</CardTitle>
								{description && (
									<p className='text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-200'>
										{description}
									</p>
								)}
							</div>
						</div>
						{searchable && (
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
								<Input
									placeholder='Search...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='pl-10 w-64 bg-background/50 border-border/50 focus:border-primary/50 transition-colors'
								/>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent className='relative z-10 h-full'>
					<div className='h-full overflow-hidden'>
						<div className='overflow-x-auto'>
							<table className='w-full'>
								<thead>
									<tr className='border-b border-border/20'>
										{columns.map((column) => (
											<th
												key={column.key}
												className={`px-4 py-3 text-left text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-200 ${
													column.sortable ? 'cursor-pointer hover:text-primary' : ''
												}`}
												onClick={() => column.sortable && handleSort(column.key)}>
												<div className='flex items-center gap-2'>
													{column.label}
													{column.sortable && getSortIcon(column.key)}
												</div>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{sortedData.map((item, index) => (
										<tr
											key={index}
											className='border-b border-border/10 hover:bg-muted/30 transition-colors duration-200'>
											{columns.map((column) => (
												<td key={column.key} className='px-4 py-3 text-sm'>
													{column.render ? column.render(item[column.key], item) : item[column.key]}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{sortedData.length === 0 && (
							<div className='flex items-center justify-center h-32 text-muted-foreground'>
								No data available
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
