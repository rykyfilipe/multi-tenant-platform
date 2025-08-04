/** @format */

import React from "react";
import { Loader2, Database, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const TableCardSkeleton: React.FC = () => {
	return (
		<Card className='shadow-md hover:shadow-lg transition-shadow rounded-2xl animate-pulse'>
			<CardContent className='p-6'>
				<div className='w-full flex items-center justify-between'>
					{/* Title skeleton */}
					<div className='h-7 bg-gray-200 rounded-md w-40'></div>
					{/* Edit button skeleton */}
					<div className='w-10 h-10 bg-gray-200 rounded-md'></div>
				</div>
			</CardContent>
		</Card>
	);
};

export const TableCardSkeletonAdaptive: React.FC = () => {
	return (
		<div className='text-center py-16'>
			<div className='max-w-md mx-auto'>
				{/* Animated spinner */}
				<div className='w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse'>
					<Loader2 className='w-10 h-10 text-white animate-spin' />
				</div>

				{/* Loading message */}
				<h3 className='text-xl font-semibold text-foreground mb-3'>
					Loading your database...
				</h3>
				<p className='text-muted-foreground mb-6'>
					We're fetching your tables and data. This will just take a moment.
				</p>

				{/* Progress dots */}
				<div className='flex justify-center space-x-2'>
					<div className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'></div>
					<div
						className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
						style={{ animationDelay: "0.1s" }}></div>
					<div
						className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
						style={{ animationDelay: "0.2s" }}></div>
				</div>
			</div>
		</div>
	);
};

// Alternative loading state with database icon
export const DatabaseLoadingState: React.FC = () => {
	return (
		<div className='text-center py-20'>
			<div className='max-w-lg mx-auto'>
				{/* Database icon with pulse effect */}
				<div className='relative w-24 h-24 mx-auto mb-8'>
					<div className='absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-2xl opacity-20 animate-pulse'></div>
					<div className='relative w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg'>
						<Database className='w-12 h-12 text-white' />
					</div>
				</div>

				{/* Loading text */}
				<h3 className='text-2xl font-bold text-foreground mb-4'>
					Preparing your workspace
				</h3>
				<p className='text-muted-foreground text-lg mb-8'>
					Setting up your database environment...
				</p>

				{/* Animated progress bar */}
				<div className='w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden'>
					<div
						className='h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse'
						style={{ width: "60%" }}></div>
				</div>
			</div>
		</div>
	);
};

// Minimalist loading state
export const MinimalistLoadingState: React.FC = () => {
	return (
		<div className='flex items-center justify-center py-32'>
			<div className='text-center'>
				{/* Simple spinning loader */}
				<div className='inline-flex items-center justify-center w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6'>
					<span className='sr-only'>Loading...</span>
				</div>

				{/* Simple text */}
				<p className='text-lg text-muted-foreground font-medium'>
					Loading database...
				</p>
			</div>
		</div>
	);
};

// Elegant loading state with sparkles
export const ElegantLoadingState: React.FC = () => {
	return (
		<div className='text-center py-24'>
			<div className='max-w-md mx-auto'>
				{/* Sparkles animation */}
				<div className='relative mb-8'>
					<div className='absolute -top-2 -left-2'>
						<Sparkles className='w-6 h-6 text-yellow-400 animate-pulse' />
					</div>
					<div className='absolute -top-2 -right-2'>
						<Sparkles
							className='w-4 h-4 text-blue-400 animate-pulse'
							style={{ animationDelay: "0.5s" }}
						/>
					</div>
					<div className='absolute -bottom-2 -left-4'>
						<Sparkles
							className='w-5 h-5 text-purple-400 animate-pulse'
							style={{ animationDelay: "1s" }}
						/>
					</div>
					<div className='absolute -bottom-2 -right-4'>
						<Sparkles
							className='w-3 h-3 text-green-400 animate-pulse'
							style={{ animationDelay: "1.5s" }}
						/>
					</div>

					{/* Main loader */}
					<div className='w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg'>
						<Loader2 className='w-10 h-10 text-white animate-spin' />
					</div>
				</div>

				{/* Text */}
				<h3 className='text-xl font-semibold text-foreground mb-2'>
					Loading your data
				</h3>
				<p className='text-muted-foreground'>
					Please wait while we prepare everything for you
				</p>
			</div>
		</div>
	);
};
