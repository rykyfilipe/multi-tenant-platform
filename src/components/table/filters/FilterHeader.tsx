/** @format */

import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Zap, Settings2, Save, Bookmark, PlusCircle, Download, Upload } from "lucide-react";
import { FilterPreset } from "./utils/filterPresets";

export type FilterMode = "simple" | "advanced";

interface FilterHeaderProps {
	mode: FilterMode;
	onModeChange: (mode: FilterMode) => void;
	presets: FilterPreset[];
	onLoadPreset: (preset: FilterPreset) => void;
	onSavePreset: () => void;
	onExportPresets?: () => void;
	onImportPresets?: () => void;
	className?: string;
}

export const FilterHeader: React.FC<FilterHeaderProps> = ({
	mode,
	onModeChange,
	presets,
	onLoadPreset,
	onSavePreset,
	onExportPresets,
	onImportPresets,
	className,
}) => {
	return (
		<div className={className}>
			<div className="flex items-center justify-between gap-3">
				{/* Mode Toggle */}
				<Tabs value={mode} onValueChange={(v) => onModeChange(v as FilterMode)}>
					<TabsList className="grid w-[240px] grid-cols-2">
						<TabsTrigger value="simple" className="text-xs">
							<Zap className="w-3.5 h-3.5 mr-1.5" />
							Simple
						</TabsTrigger>
						<TabsTrigger value="advanced" className="text-xs">
							<Settings2 className="w-3.5 h-3.5 mr-1.5" />
							Advanced
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{/* Preset Selector */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<Save className="w-4 h-4 mr-2" />
							Presets
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-64">
						<DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide">
							Saved Filters
						</DropdownMenuLabel>
						<DropdownMenuSeparator />

						{presets.length === 0 ? (
							<div className="px-2 py-6 text-center text-sm text-muted-foreground">
								No saved presets yet
							</div>
						) : (
							presets.map((preset) => (
								<DropdownMenuItem
									key={preset.id}
									onSelect={() => onLoadPreset(preset)}
									className="cursor-pointer"
								>
									<Bookmark className="w-4 h-4 mr-2 text-primary" />
									<div className="flex-1">
										<div className="text-sm font-medium">{preset.name}</div>
										{preset.description && (
											<div className="text-xs text-muted-foreground">
												{preset.description}
											</div>
										)}
									</div>
								</DropdownMenuItem>
							))
						)}

						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={onSavePreset} className="cursor-pointer">
							<PlusCircle className="w-4 h-4 mr-2" />
							Save Current as Preset
						</DropdownMenuItem>

						{(onExportPresets || onImportPresets) && (
							<>
								<DropdownMenuSeparator />
								{onExportPresets && (
									<DropdownMenuItem onSelect={onExportPresets} className="cursor-pointer">
										<Download className="w-4 h-4 mr-2" />
										Export Presets
									</DropdownMenuItem>
								)}
								{onImportPresets && (
									<DropdownMenuItem onSelect={onImportPresets} className="cursor-pointer">
										<Upload className="w-4 h-4 mr-2" />
										Import Presets
									</DropdownMenuItem>
								)}
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
};

