/** @format */

// components/EmptyState.tsx
import React from "react";
import { Table } from "lucide-react";

export const EmptyState: React.FC = () => {
	return (
		<div className='text-center py-12'>
			<Table className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
			<h3 className='text-lg font-medium text-foreground mb-2'>
				No tables found
			</h3>
			<p className='text-muted-foreground'>
				There are no tables available to manage permissions for.
			</p>
		</div>
	);
};
