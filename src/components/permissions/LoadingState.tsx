/** @format */

// components/LoadingState.tsx
import React from "react";

export const LoadingState: React.FC = () => {
	return (
		<div className='space-y-6'>
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className='bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse'>
					<div className='p-6'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center space-x-3'>
								<div className='p-2 rounded-lg bg-gray-200 w-10 h-10'></div>
								<div>
									<div className='h-5 bg-gray-200 rounded w-32 mb-2'></div>
									<div className='h-4 bg-gray-200 rounded w-48'></div>
								</div>
							</div>
							<div className='flex items-center space-x-4'>
								<div className='h-4 bg-gray-200 rounded w-20'></div>
							</div>
						</div>
						<div className='mt-6 grid grid-cols-3 gap-4'>
							<div className='h-6 bg-gray-200 rounded'></div>
							<div className='h-6 bg-gray-200 rounded'></div>
							<div className='h-6 bg-gray-200 rounded'></div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};
