/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Calendar,
	Filter,
	RefreshCw,
	Download,
	Settings,
} from "lucide-react";

interface FilterOption {
	value: string;
	label: string;
}

interface AnalyticsFiltersProps {
	timeFilter: string;
	onTimeFilterChange: (value: string) => void;
	onExport: () => void;
	onRefresh: () => void;
	timeOptions?: FilterOption[];
	showAdvancedFilters?: boolean;
	onAdvancedFilters?: () => void;
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
	timeFilter,
	onTimeFilterChange,
	onExport,
	onRefresh,
	timeOptions = [
		{ value: "7d", label: "Last 7 days" },
		{ value: "30d", label: "Last 30 days" },
		{ value: "90d", label: "Last 90 days" },
		{ value: "1y", label: "Last year" },
	],
	showAdvancedFilters = false,
	onAdvancedFilters,
}) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
			{/* Time Filter */}
			<div className='flex items-center gap-3'>
				<Label className='text-sm font-medium text-muted-foreground whitespace-nowrap'>
					Time Range
				</Label>
				<Select value={timeFilter} onValueChange={onTimeFilterChange}>
					<SelectTrigger className='w-40 h-10 bg-background/50 border-border/50 hover:border-border transition-colors'>
						<Calendar className='w-4 h-4 mr-2 text-muted-foreground' />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{timeOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Advanced Filters */}
			{showAdvancedFilters && onAdvancedFilters && (
				<Button
					variant='outline'
					size='sm'
					onClick={onAdvancedFilters}
					className='h-10 px-4 bg-background/50 border-border/50 hover:bg-background hover:border-border transition-all duration-200'>
					<Filter className='w-4 h-4 mr-2' />
					Advanced Filters
				</Button>
			)}

			{/* Action Buttons */}
			<div className='flex items-center gap-2'>
				<Button
					variant='outline'
					size='sm'
					onClick={onExport}
					className='h-10 px-4 bg-background/50 border-border/50 hover:bg-background hover:border-border transition-all duration-200'>
					<Download className='w-4 h-4 mr-2' />
					Export Data
				</Button>

				<Button
					variant='outline'
					size='sm'
					onClick={onRefresh}
					className='h-10 px-4 bg-background/50 border-border/50 hover:bg-background hover:border-border transition-all duration-200'>
					<RefreshCw className='w-4 h-4 mr-2' />
					Refresh
				</Button>
			</div>
		</motion.div>
	);
};
