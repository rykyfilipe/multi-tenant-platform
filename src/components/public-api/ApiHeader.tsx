/** @format */

"use client";

import React from "react";
import { Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApiHeaderProps {
	onCreateToken: () => void;
	loading: boolean;
	tokenCount: number;
}

export const ApiHeader = ({
	onCreateToken,
	loading,
	tokenCount,
}: ApiHeaderProps) => {
	return (
		<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-4'>
				<div className='flex items-center space-x-3 sm:space-x-4'>
					<div className='p-2 sm:p-3 bg-primary/10 rounded-lg sm:rounded-xl'>
						<Shield className='w-5 h-5 sm:w-6 sm:h-6 text-primary' />
					</div>
					<div className='min-w-0 flex-1'>
						<h1 className='text-lg sm:text-xl font-semibold text-foreground truncate'>
							API Token Management
						</h1>
						<p className='text-xs sm:text-sm text-muted-foreground truncate'>
							Manage your API tokens for secure access to public endpoints
						</p>
					</div>
				</div>
				<div className='flex items-center justify-between sm:justify-end space-x-3'>
					<div className='text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md'>
						{tokenCount} token{tokenCount !== 1 && "s"}
					</div>
					<Button
						onClick={onCreateToken}
						disabled={loading}
						size='sm'
						className='flex items-center space-x-2 w-full sm:w-auto'>
						<Plus className='w-4 h-4' />
						<span className='hidden sm:inline'>Create Token</span>
						<span className='sm:hidden'>Create</span>
					</Button>
				</div>
			</div>
		</div>
	);
};
