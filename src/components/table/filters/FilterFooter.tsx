/** @format */

import React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, RotateCcw, History, Clock, Loader2 } from "lucide-react";
import { FilterHistory } from "./utils/filterPresets";
import { cn } from "@/lib/utils";

interface FilterFooterProps {
	filteredCount: number;
	totalCount: number;
	isFiltering: boolean;
	hasChanges: boolean;
	canApply: boolean;
	onApply: () => void;
	onClear: () => void;
	recentFilters?: FilterHistory[];
	onLoadRecent?: (recent: FilterHistory) => void;
	className?: string;
}

export const FilterFooter: React.FC<FilterFooterProps> = ({
	filteredCount,
	totalCount,
	isFiltering,
	hasChanges,
	canApply,
	onApply,
	onClear,
	recentFilters = [],
	onLoadRecent,
	className,
}) => {
	return (
		<div
			className={cn(
				"sticky bottom-0 z-10 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-3 px-4 border-t",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-3 mb-3">
				{/* Results Preview */}
				<div className="text-sm text-muted-foreground">
					{isFiltering ? (
						<span className="flex items-center gap-2">
							<Loader2 className="w-4 h-4 animate-spin" />
							Filtering...
						</span>
					) : (
						<span>
							Showing <strong className="text-foreground font-semibold">{filteredCount}</strong> of{" "}
							{totalCount} rows
						</span>
					)}
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					{/* Recent Filters */}
					{onLoadRecent && recentFilters.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<History className="w-4 h-4 mr-2" />
									Recent
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-80">
								<DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide">
									Filter History
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{recentFilters.map((recent) => (
									<DropdownMenuItem
										key={recent.id}
										onSelect={() => onLoadRecent(recent)}
										className="cursor-pointer"
									>
										<Clock className="w-4 h-4 mr-2 text-muted-foreground" />
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium truncate">
												{recent.description}
											</div>
											<div className="text-xs text-muted-foreground">
												{recent.resultCount} results •{" "}
												{new Date(recent.timestamp).toLocaleDateString()}
											</div>
										</div>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}

					{/* Clear All */}
					<Button
						variant="outline"
						size="sm"
						onClick={onClear}
						disabled={!canApply && !isFiltering}
					>
						<RotateCcw className="w-4 h-4 mr-2" />
						Clear
					</Button>

					{/* Apply Filters */}
					<Button
						size="sm"
						onClick={onApply}
						disabled={!canApply || isFiltering}
						className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30"
					>
						{isFiltering ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Applying...
							</>
						) : (
							<>
								<Filter className="w-4 h-4 mr-2" />
								Apply Filters
							</>
						)}
					</Button>
				</div>
			</div>

			{/* Keyboard Shortcuts Hint */}
			<div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
				<div className="flex items-center gap-1.5">
					<kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">⌘K</kbd>
					<span>Quick search</span>
				</div>
				<div className="flex items-center gap-1.5">
					<kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">⌘↵</kbd>
					<span>Apply</span>
				</div>
				<div className="flex items-center gap-1.5">
					<kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd>
					<span>Close</span>
				</div>
			</div>
		</div>
	);
};

