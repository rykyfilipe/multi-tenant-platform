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

export const ApiHeader = ({ onCreateToken, loading, tokenCount }: ApiHeaderProps) => {
	return (
		<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
			<div className='flex items-center justify-between px-6 py-4'>
				<div className='flex items-center space-x-4'>
					<div className='p-3 bg-primary/10 rounded-xl'>
						<Shield className='w-6 h-6 text-primary' />
					</div>
					<div>
						<h1 className='text-xl font-semibold text-foreground'>
							API Token Management
						</h1>
						<p className='text-sm text-muted-foreground'>
							Manage your API tokens for secure access to public endpoints
						</p>
					</div>
				</div>
				<div className='flex items-center space-x-3'>
					<div className='text-sm text-muted-foreground'>
						{tokenCount} token{tokenCount !== 1 && "s"}
					</div>
					<Button
						onClick={onCreateToken}
						disabled={loading}
						className='flex items-center space-x-2'>
						<Plus className='w-4 h-4' />
						<span>Create Token</span>
					</Button>
				</div>
			</div>
		</div>
	);
}; 