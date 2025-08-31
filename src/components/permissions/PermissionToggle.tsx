/** @format */

// components/PermissionToggle.tsx
import React from "react";
import { PermissionToggleProps, PermissionVariant } from "@/types/permissions";

export const PermissionToggle: React.FC<PermissionToggleProps> = ({
	enabled,
	onChange,
	label,
	variant = "default",
}) => {
	const baseClasses =
		"relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

	const variantClasses: Record<PermissionVariant, string> = {
		read: enabled
			? "bg-blue-600 dark:bg-blue-500 focus:ring-blue-500/30"
			: "bg-muted",
		edit: enabled
			? "bg-amber-600 dark:bg-amber-500 focus:ring-amber-500/30"
			: "bg-muted",
		delete: enabled
			? "bg-red-600 dark:bg-red-500 focus:ring-red-500/30"
			: "bg-muted",
		default: enabled
			? "bg-green-600 dark:bg-green-500 focus:ring-green-500/30"
			: "bg-muted",
	};

	return (
		<div className='flex items-center space-x-2'>
			<button
				type='button'
				className={`${baseClasses} ${variantClasses[variant]}`}
				onClick={() => onChange(!enabled)}
				aria-label={`Toggle ${label}`}>
				<span
					className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
						enabled ? "translate-x-6" : "translate-x-1"
					}`}
				/>
			</button>
			<span className='text-sm font-medium text-foreground'>{label}</span>
		</div>
	);
};
