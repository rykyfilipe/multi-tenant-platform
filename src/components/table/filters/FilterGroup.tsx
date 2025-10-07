/** @format */

import React from "react";
import { FilterConfig } from "@/types/filtering";
import { Column } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Plus, Layers } from "lucide-react";
import { FilterItem } from "./FilterItem";
import { cn } from "@/lib/utils";

export interface FilterGroupData {
	id: string;
	logicOperator: "AND" | "OR";
	filters: FilterConfig[];
	expanded: boolean;
}

interface FilterGroupProps {
	group: FilterGroupData;
	columns: Column[];
	onUpdateGroup: (groupId: string, updates: Partial<FilterGroupData>) => void;
	onUpdateFilter: (filterId: string, updates: Partial<FilterConfig>) => void;
	onRemoveFilter: (filterId: string) => void;
	onDuplicateFilter: (filter: FilterConfig) => void;
	onAddFilter: (groupId: string) => void;
	referenceData?: Record<number, any[]>;
	showLogicToggle?: boolean;
	className?: string;
}

export const FilterGroup: React.FC<FilterGroupProps> = ({
	group,
	columns,
	onUpdateGroup,
	onUpdateFilter,
	onRemoveFilter,
	onDuplicateFilter,
	onAddFilter,
	referenceData,
	showLogicToggle = true,
	className,
}) => {
	const toggleExpanded = () => {
		onUpdateGroup(group.id, { expanded: !group.expanded });
	};

	const updateLogic = (value: string) => {
		if (value === "AND" || value === "OR") {
			onUpdateGroup(group.id, { logicOperator: value });
		}
	};

	return (
		<div className={cn("relative", className)}>
			{/* AND/OR Toggle - shown above group */}
			{showLogicToggle && (
				<div className="absolute -top-4 left-8 z-10">
					<ToggleGroup
						type="single"
						value={group.logicOperator}
						onValueChange={updateLogic}
						className="gap-1"
					>
						<ToggleGroupItem
							value="AND"
							className="h-7 px-3 text-xs font-semibold data-[state=on]:bg-blue-500 data-[state=on]:text-white"
						>
							AND
						</ToggleGroupItem>
						<ToggleGroupItem
							value="OR"
							className="h-7 px-3 text-xs font-semibold data-[state=on]:bg-purple-500 data-[state=on]:text-white"
						>
							OR
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
			)}

			{/* Group Container */}
			<Collapsible open={group.expanded} onOpenChange={toggleExpanded}>
				<div
					className={cn(
						"rounded-lg border-2 transition-all",
						group.logicOperator === "AND"
							? "border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/20"
							: "border-purple-200 bg-purple-50/30 dark:border-purple-900 dark:bg-purple-950/20",
					)}
				>
					{/* Group Header */}
					<CollapsibleTrigger asChild>
						<div className="flex items-center justify-between p-3 cursor-pointer hover:bg-background/50 rounded-t-lg transition-colors">
							<div className="flex items-center gap-2">
								<Badge
									variant={group.logicOperator === "AND" ? "default" : "secondary"}
									className={cn(
										"text-xs font-semibold",
										group.logicOperator === "AND"
											? "bg-blue-500 hover:bg-blue-600"
											: "bg-purple-500 hover:bg-purple-600 text-white",
									)}
								>
									{group.logicOperator}
								</Badge>
								<span className="text-sm font-medium text-foreground">
									{group.filters.length} {group.filters.length === 1 ? "filter" : "filters"}
								</span>
							</div>
							<ChevronDown
								className={cn(
									"w-4 h-4 text-muted-foreground transition-transform duration-200",
									group.expanded && "rotate-180",
								)}
							/>
						</div>
					</CollapsibleTrigger>

					{/* Group Content */}
					<CollapsibleContent className="p-3 pt-0 space-y-3">
						{group.filters.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
								<p className="text-sm">No filters in this group</p>
								<p className="text-xs mt-1">Click "Add Filter" to get started</p>
							</div>
						) : (
							group.filters.map((filter) => (
								<FilterItem
									key={filter.id}
									filter={filter}
									columns={columns}
									onUpdate={onUpdateFilter}
									onRemove={onRemoveFilter}
									onDuplicate={onDuplicateFilter}
									referenceData={referenceData}
								/>
							))
						)}

						{/* Add Filter Button */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => onAddFilter(group.id)}
							className="w-full border-dashed hover:border-primary hover:bg-primary/5"
						>
							<Plus className="w-4 h-4 mr-2" />
							Add Filter to Group
						</Button>
					</CollapsibleContent>
				</div>
			</Collapsible>
		</div>
	);
};

