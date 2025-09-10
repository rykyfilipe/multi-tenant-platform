/** @format */
"use client";

import { useState } from "react";
import { Column } from "@/types/database";
import { Button } from "@/components/ui/button";
import { 
	MoreHorizontal, 
	Edit, 
	Trash2, 
	Move, 
	Eye, 
	EyeOff,
	Type,
	Hash,
	Calendar,
	Link,
	CheckSquare,
	Image,
	FileText
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props {
	column: Column;
	onEdit: (column: Column) => void;
	onDelete: (columnId: string) => void;
	canEdit: boolean;
}

const getColumnIcon = (type: string) => {
	switch (type) {
		case "text":
		case "varchar":
		case "char":
			return <Type className="w-4 h-4" />;
		case "integer":
		case "bigint":
		case "smallint":
		case "decimal":
		case "numeric":
		case "float":
		case "double":
			return <Hash className="w-4 h-4" />;
		case "date":
		case "datetime":
		case "timestamp":
		case "time":
			return <Calendar className="w-4 h-4" />;
		case "reference":
			return <Link className="w-4 h-4" />;
		case "boolean":
			return <CheckSquare className="w-4 h-4" />;
		case "json":
		case "jsonb":
			return <FileText className="w-4 h-4" />;
		default:
			return <Type className="w-4 h-4" />;
	}
};

export function ColumnHeader({ column, onEdit, onDelete, canEdit }: Props) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			className={cn(
				"flex-1 min-w-[120px] border-r border-border/20 bg-muted/30 hover:bg-muted/50 transition-colors duration-200 group relative",
				column.primary && "bg-primary/10 border-primary/20",
				column.required && "border-l-2 border-l-orange-500"
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="flex items-center justify-between p-3 h-full">
				{/* Column Info */}
				<div className="flex items-center gap-2 flex-1 min-w-0">
					<div className="flex items-center gap-1 text-muted-foreground">
						{getColumnIcon(column.type)}
						{column.primary && (
							<span className="text-xs font-bold text-primary">PK</span>
						)}
						{column.required && (
							<span className="text-xs font-bold text-orange-500">*</span>
						)}
					</div>
					
					<div className="flex-1 min-w-0">
						<div className="font-medium text-sm truncate" title={column.name}>
							{column.name}
						</div>
						<div className="text-xs text-muted-foreground truncate">
							{column.type}
							{column.semanticType && ` • ${column.semanticType}`}
						</div>
					</div>
				</div>

				{/* Actions */}
				{canEdit && (isHovered || column.primary || column.required) && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted-foreground/10"
							>
								<MoreHorizontal className="w-3 h-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem onClick={() => onEdit(column)}>
								<Edit className="w-4 h-4 mr-2" />
								Edit Column
							</DropdownMenuItem>
							
							<DropdownMenuItem disabled>
								<Move className="w-4 h-4 mr-2" />
								Reorder
							</DropdownMenuItem>
							
							<DropdownMenuItem disabled>
								<Eye className="w-4 h-4 mr-2" />
								Hide Column
							</DropdownMenuItem>
							
							<DropdownMenuSeparator />
							
							<DropdownMenuItem 
								onClick={() => onDelete(column.id.toString())}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Delete Column
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
}
