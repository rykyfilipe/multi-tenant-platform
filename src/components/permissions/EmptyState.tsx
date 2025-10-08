/** @format */

import React from "react";
import { Database, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const EmptyState: React.FC = () => {
	return (
		<Card className='bg-card border-border shadow-sm'>
			<CardContent className='py-16 text-center'>
				<div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-6'>
					<Database className='h-8 w-8 text-muted-foreground' />
				</div>
				<h3 className='text-xl font-bold text-foreground mb-2'>
					No Tables Available
				</h3>
				<p className='text-muted-foreground max-w-md mx-auto'>
					There are no tables available to manage permissions for. Create tables in the Database section to start managing access controls.
				</p>
			</CardContent>
		</Card>
	);
};
