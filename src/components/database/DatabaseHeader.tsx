/** @format */

import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useTourControls } from "@/hooks/useTourControls";
import { Plus, Database } from "lucide-react";

interface DatabaseHeaderProps {
	onAddTable: () => void;
}

export function DatabaseHeader({ onAddTable }: DatabaseHeaderProps) {
	const { user } = useApp();

	return (
		<div className='max-w-full flex flex-col sm:flex-row gap-5  items-center justify-between py-8 px-6  bg-black/5 rounded-2xl mb-8 border'>
			<div className='flex items-center space-x-4 database-header'>
				<div className='p-3 bg-black/5 rounded-xl hidden xs:block'>
					<Database className='h-8 w-8 text-black ' />
				</div>
				<div>
					<h1 className='text-4xl font-bold text-gray-900'>Database</h1>
					<p className='text-gray-600 mt-1'>
						Manage your database tables and schemas
					</p>
				</div>
			</div>
			{user?.role !== "VIEWER" && (
				<Button onClick={onAddTable} className='add-table-button'>
					{" "}
					<Plus className='h-5 w-5 ' />
					<span>Add Table</span>
				</Button>
			)}
		</div>
	);
}
