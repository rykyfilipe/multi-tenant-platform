/** @format */

import React from "react";
import { Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PermissionsHeaderProps {
	hasChanges: boolean;
	onSave: () => void;
	loading?: boolean;
}

export const PermissionsHeader: React.FC<PermissionsHeaderProps> = ({
	hasChanges,
	onSave,
	loading = false,
}) => {
	if (!hasChanges) return null;

	return (
		<div className='flex items-center gap-3'>
			<Badge variant="outline" className='bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-semibold px-3 py-1.5'>
				<AlertCircle className='w-3 h-3 mr-1.5' />
				Unsaved Changes
			</Badge>
			<Button
				onClick={onSave}
				disabled={loading}
				className='gap-2 shadow-sm'
			>
				<Save className='h-4 w-4' />
				<span>{loading ? "Saving..." : "Save Changes"}</span>
			</Button>
		</div>
	);
};
