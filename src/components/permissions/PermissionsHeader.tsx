/** @format */

// components/PermissionsHeader.tsx
import React from "react";
import { Save, User } from "lucide-react";

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
	return (
		<div className='mb-8'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-3'>
					<div className='p-3 bg-card border border-border rounded-lg shadow-sm'>
						<User className='h-6 w-6 text-primary' />
					</div>
					<div>
						<h1 className='text-3xl font-bold text-foreground'>
							User Permissions
						</h1>
						<p className='text-muted-foreground mt-1'>
							Manage table and column access permissions
						</p>
					</div>
				</div>

				{hasChanges && (
					<button
						onClick={onSave}
						disabled={loading}
						className='flex items-center space-x-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors shadow-sm'>
						<Save className='h-4 w-4' />
						<span>{loading ? "Saving..." : "Save Changes"}</span>
					</button>
				)}
			</div>
		</div>
	);
};
