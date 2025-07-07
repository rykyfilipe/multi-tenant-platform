/** @format */

import { Button } from "@/components/ui/button";
import { Plus, Database } from "lucide-react";

interface DatabaseHeaderProps {
	onAddTable: () => void;
}

export function DatabaseHeader({ onAddTable }: DatabaseHeaderProps) {
	return (
		<div className='flex items-center justify-between py-8 px-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-8 border border-blue-100'>
			<div className='flex items-center space-x-4'>
				<div className='p-3 bg-blue-100 rounded-xl'>
					<Database className='h-8 w-8 text-blue-600' />
				</div>
				<div>
					<h1 className='text-4xl font-bold text-gray-900'>Database</h1>
					<p className='text-gray-600 mt-1'>
						Manage your database tables and schemas
					</p>
				</div>
			</div>
			<Button
				onClick={onAddTable}
				className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2'>
				<Plus className='h-5 w-5' />
				<span>Add Table</span>
			</Button>
		</div>
	);
}
