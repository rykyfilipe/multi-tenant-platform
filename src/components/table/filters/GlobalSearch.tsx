/** @format */

import React, { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalSearchProps {
	value: string;
	onChange: (value: string) => void;
	onClear: () => void;
	onSubmit?: () => void;
	matchCount?: number;
	placeholder?: string;
	className?: string;
	autoFocus?: boolean;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
	value,
	onChange,
	onClear,
	onSubmit,
	matchCount,
	placeholder = "Search across all fields... (⌘K)",
	className,
	autoFocus = false,
}) => {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (autoFocus && inputRef.current) {
			inputRef.current.focus();
		}
	}, [autoFocus]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && onSubmit) {
			onSubmit();
		}
		if (e.key === "Escape") {
			inputRef.current?.blur();
			onClear();
		}
	};

	return (
		<div className={cn("relative group", className)}>
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
			<Input
				ref={inputRef}
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={handleKeyDown}
				className="pl-10 pr-24 h-10 bg-background"
			/>
			{value && (
				<>
					{matchCount !== undefined && (
						<Badge
							variant="secondary"
							className="absolute right-14 top-1/2 -translate-y-1/2 bg-muted text-xs"
						>
							{matchCount} {matchCount === 1 ? "match" : "matches"}
						</Badge>
					)}
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted"
						onClick={onClear}
					>
						<X className="w-3.5 h-3.5" />
					</Button>
				</>
			)}
		</div>
	);
};

