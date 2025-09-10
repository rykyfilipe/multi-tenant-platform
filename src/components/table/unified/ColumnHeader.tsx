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
			return <Type className="w-3 h-3 sm:w-4 sm:h-4" />;
		case "integer":
		case "bigint":
		case "smallint":
		case "decimal":
		case "numeric":
		case "float":
		case "double":
			return <Hash className="w-3 h-3 sm:w-4 sm:h-4" />;
		case "date":
		case "datetime":
		case "timestamp":
		case "time":
			return <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />;
		case "reference":
			return <Link className="w-3 h-3 sm:w-4 sm:h-4" />;
		case "boolean":
			return <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />;
		case "json":
		case "jsonb":
			return <FileText className="w-3 h-3 sm:w-4 sm:h-4" />;
		default:
			return <Type className="w-3 h-3 sm:w-4 sm:h-4" />;
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
				"flex-1 min-w-[100px] sm:min-w-[120px] border-r border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-all duration-200 group relative",
				column.primary && "bg-blue-50 border-blue-200",
				column.required && "border-l-2 border-l-orange-500",
				canEdit && "cursor-pointer hover:bg-neutral-100"
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleColumnClick}
			title={canEdit ? "Click to edit column" : "Column"}
		>
			<div className="flex items-center px-2 sm:px-4 py-2 h-full">
				{/* Column Name - Clean and Simple - Mobile Optimized */}
				<div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
					{/* Type Icon - Subtle */}
					<div className="text-neutral-500 flex-shrink-0">
						{getColumnIcon(column.type)}
					</div>
					
					{/* Column Name */}
					<div className="flex-1 min-w-0">
						<div className="font-semibold text-xs sm:text-sm truncate text-neutral-700" title={column.name}>
							{column.name}
						</div>
					</div>

					{/* Badges - Only show when relevant - Mobile Optimized */}
					<div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
						{column.primary && (
							<span className="text-xs font-semibold text-blue-600 bg-blue-100 px-1 sm:px-1.5 py-0.5 rounded">PK</span>
						)}
						{column.required && (
							<span className="text-xs font-semibold text-orange-600 bg-orange-100 px-1 sm:px-1.5 py-0.5 rounded">*</span>
						)}
						{column.unique && (
							<span className="text-xs font-semibold text-green-600 bg-green-100 px-1 sm:px-1.5 py-0.5 rounded">U</span>
						)}
						{column.isModuleColumn && (
							<span className="text-xs font-semibold text-purple-600 bg-purple-100 px-1 sm:px-1.5 py-0.5 rounded" title="Module column - cannot be deleted">M</span>
						)}
						{column.isPredefined && (
							<span className="text-xs font-semibold text-amber-600 bg-amber-100 px-1 sm:px-1.5 py-0.5 rounded" title="Predefined column - cannot be deleted">P</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
