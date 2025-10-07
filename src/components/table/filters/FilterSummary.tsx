/** @format */

import React from "react";
import { FilterConfig } from "@/types/filtering";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { TypeIcon } from "./utils/filterIcons";
import { cn } from "@/lib/utils";

interface FilterSummaryProps {
	filters: FilterConfig[];
	globalSearch?: string;
	onRemoveFilter: (filterId: string) => void;
	onClearGlobalSearch?: () => void;
	className?: string;
}

export const FilterSummary: React.FC<FilterSummaryProps> = ({
	filters,
	globalSearch,
	onRemoveFilter,
	onClearGlobalSearch,
	className,
}) => {
	if (filters.length === 0 && !globalSearch) {
		return null;
	}

	return (
		<div className={cn("flex flex-wrap gap-1.5", className)}>
			{/* Global Search Badge */}
			{globalSearch && (
				<Badge
					variant="secondary"
					className="group relative pl-2 pr-7 py-1.5 hover:pr-2 transition-all bg-primary/10 text-primary border-primary/20"
				>
					<span className="text-xs font-medium">Search: "{globalSearch}"</span>
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
						onClick={onClearGlobalSearch}
					>
						<X className="w-3 h-3" />
					</Button>
				</Badge>
			)}

			{/* Filter Badges */}
			{filters.map((filter) => (
				<Badge
					key={filter.id}
					variant="secondary"
					className="group relative pl-2 pr-7 py-1.5 hover:pr-2 transition-all"
				>
					<div className="flex items-center gap-1.5">
						<TypeIcon type={filter.columnType} className="w-3 h-3" />
						<span className="text-xs">
							<span className="font-semibold">{filter.columnName}</span>
							<span className="text-muted-foreground mx-1">
								{filter.operator.replace(/_/g, " ")}
							</span>
							{filter.value && <span className="font-medium">{String(filter.value)}</span>}
						</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
						onClick={() => onRemoveFilter(filter.id)}
					>
						<X className="w-3 h-3" />
					</Button>
				</Badge>
			))}
		</div>
	);
};

