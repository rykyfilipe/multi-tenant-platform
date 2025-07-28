/** @format */

import React from "react";
import {
	Card,
	CardHeader,
	CardContent,
	CardFooter,
} from "@/components/ui/card";

export const TableCardSkeleton: React.FC = () => {
	return (
		<Card className='shadow-md hover:shadow-lg transition-shadow rounded-2xl animate-pulse'>
			<CardHeader className='pb-2'>
				<div className='w-full flex items-center justify-between'>
					{/* Title skeleton */}
					<div className='h-7 bg-gray-200 rounded-md w-40'></div>
					{/* Edit button skeleton */}
					<div className='w-10 h-10 bg-gray-200 rounded-md'></div>
				</div>
			</CardHeader>

			<CardContent className='space-y-2 text-sm'>
				{/* Description skeleton */}
				<div className='flex items-start space-x-2'>
					<div className='h-4 bg-gray-300 rounded w-20 flex-shrink-0'></div>
					<div className='h-4 bg-gray-200 rounded w-full max-w-xs'></div>
				</div>

				{/* Columns skeleton */}
				<div className='flex items-center space-x-2'>
					<div className='h-4 bg-gray-300 rounded w-16 flex-shrink-0'></div>
					<div className='h-4 bg-gray-200 rounded w-8'></div>
				</div>

				{/* Rows skeleton */}
				<div className='flex items-center space-x-2'>
					<div className='h-4 bg-gray-300 rounded w-12 flex-shrink-0'></div>
					<div className='h-4 bg-gray-200 rounded w-12'></div>
				</div>
			</CardContent>

			<CardFooter className='flex justify-between pt-4'>
				{/* Edit/View rows button skeleton */}
				<div className='h-8 bg-gray-200 rounded w-20'></div>
				{/* Delete button skeleton */}
				<div className='h-8 w-8 bg-gray-200 rounded'></div>
			</CardFooter>
		</Card>
	);
};

export const TableCardSkeletonAdaptive: React.FC = () => {
	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
			<TableCardSkeleton key={crypto.randomUUID()} />
			<TableCardSkeleton key={crypto.randomUUID()} />
			<TableCardSkeleton key={crypto.randomUUID()} />
		</div>
	);
};
