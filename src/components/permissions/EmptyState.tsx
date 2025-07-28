/** @format */

// components/EmptyState.tsx
import React from "react";
import { Table } from "lucide-react";

export const EmptyState: React.FC = () => {
	return (
		<div className='text-center py-12'>
			<Table className='h-12 w-12 text-gray-400 mx-auto mb-4' />
			<h3 className='text-lg font-medium text-gray-900 mb-2'>
				No tables found
			</h3>
			<p className='text-gray-500'>
				There are no tables available to manage permissions for.
			</p>
		</div>
	);
};
