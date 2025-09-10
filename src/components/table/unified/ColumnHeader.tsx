/** @format */
"use client";

import { useState } from "react";
import { Column } from "@/types/database";
import { 
	Type,
	Hash,
	Calendar,
	Link,
	CheckSquare,
	Image,
	FileText
} from "lucide-react";
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

	const handleColumnClick = () => {
		if (canEdit) {
			onEdit(column);
		}
	};

	return (
		<div
			className={cn(
				"flex-1 min-w-[120px] border-r border-border/20 bg-background hover:bg-muted/30 transition-all duration-200 group relative",
				column.primary && "bg-primary/5 border-primary/30",
				column.required && "border-l-2 border-l-orange-500",
				canEdit && "cursor-pointer hover:bg-muted/40"
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleColumnClick}
			title={canEdit ? "Click to edit column" : "Column"}
		>
			<div className="flex items-center px-4 py-3 h-full">
				{/* Column Name - Clean and Simple */}
				<div className="flex items-center gap-2 flex-1 min-w-0">
					{/* Type Icon - Subtle */}
					<div className="text-muted-foreground/60">
						{getColumnIcon(column.type)}
					</div>
					
					{/* Column Name */}
					<div className="flex-1 min-w-0">
						<div className="font-medium text-sm truncate text-foreground" title={column.name}>
							{column.name}
						</div>
					</div>

					{/* Badges - Only show when relevant */}
					<div className="flex items-center gap-1">
						{column.primary && (
							<span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">PK</span>
						)}
						{column.required && (
							<span className="text-xs font-medium text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">*</span>
						)}
						{column.unique && (
							<span className="text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">U</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
