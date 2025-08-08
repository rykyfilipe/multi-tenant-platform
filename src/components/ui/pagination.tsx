/** @format */

"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	pageSize: number;
	totalItems: number;
	onPageSizeChange?: (pageSize: number) => void;
	pageSizeOptions?: number[];
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	pageSize,
	totalItems,
	onPageSizeChange,
	pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
	const startItem = (currentPage - 1) * pageSize + 1;
	const endItem = Math.min(currentPage * pageSize, totalItems);

	const getVisiblePages = () => {
		const delta = 2;
		const range = [];
		const rangeWithDots = [];

		for (
			let i = Math.max(2, currentPage - delta);
			i <= Math.min(totalPages - 1, currentPage + delta);
			i++
		) {
			range.push(i);
		}

		if (currentPage - delta > 2) {
			rangeWithDots.push(1, "...");
		} else {
			rangeWithDots.push(1);
		}

		rangeWithDots.push(...range);

		if (currentPage + delta < totalPages - 1) {
			rangeWithDots.push("...", totalPages);
		} else {
			rangeWithDots.push(totalPages);
		}

		return rangeWithDots;
	};

	if (totalPages <= 1) return null;

	return (
		<div className='flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4'>
			<div className='flex items-center gap-2 text-sm text-muted-foreground'>
				<span>
					Showing {startItem} to {endItem} of {totalItems} results
				</span>
				{onPageSizeChange && (
					<div className='flex items-center gap-2 ml-4'>
						<span>Show:</span>
						<select
							value={pageSize}
							onChange={(e) => onPageSizeChange(Number(e.target.value))}
							className='border border-input rounded px-2 py-1 text-sm bg-background'>
							{pageSizeOptions.map((size) => (
								<option key={size} value={size}>
									{size}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			<div className='flex items-center gap-1'>
				<Button
					variant='outline'
					size='sm'
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					className='h-8 w-8 p-0'>
					<ChevronLeft className='h-4 w-4' />
				</Button>

				{getVisiblePages().map((page, index) => (
					<div key={index}>
						{page === "..." ? (
							<span className='px-2 py-1 text-sm text-muted-foreground'>
								<MoreHorizontal className='h-4 w-4' />
							</span>
						) : (
							<Button
								variant={currentPage === page ? "default" : "outline"}
								size='sm'
								onClick={() => onPageChange(page as number)}
								className={cn(
									"h-8 w-8 p-0",
									currentPage === page && "bg-primary text-primary-foreground",
								)}>
								{page}
							</Button>
						)}
					</div>
				))}

				<Button
					variant='outline'
					size='sm'
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
					className='h-8 w-8 p-0'>
					<ChevronRight className='h-4 w-4' />
				</Button>
			</div>
		</div>
	);
}
