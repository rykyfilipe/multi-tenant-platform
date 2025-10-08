/** @format */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Database, Plus, Upload, Type, Link, Shield } from "lucide-react";

interface FeatureCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
	return (
		<div className='text-left space-y-1'>
			<div className='flex items-center gap-2'>
				<div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary'>
					{icon}
				</div>
				<h4 className='font-medium text-sm'>{title}</h4>
			</div>
			<p className='text-xs text-muted-foreground ml-10'>{description}</p>
		</div>
	);
}

interface NoColumnsEmptyStateProps {
	onAddColumn: () => void;
	onUseTemplate?: () => void;
}

export function NoColumnsEmptyState({ onAddColumn, onUseTemplate }: NoColumnsEmptyStateProps) {
	return (
		<div className='flex items-center justify-center py-12 sm:py-16'>
			<div className='text-center max-w-md px-4'>
				<div className='w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center'>
					<Table className='w-8 h-8 sm:w-10 sm:h-10 text-primary' />
				</div>
				<h3 className='text-lg sm:text-xl font-semibold mb-2'>Define Your Table Structure</h3>
				<p className='text-sm text-muted-foreground mb-4 sm:mb-6'>
					Add columns to specify what data this table will store. You can always modify the schema
					later.
				</p>
				<div className='flex items-center justify-center gap-3 flex-wrap'>
					<Button onClick={onAddColumn} size='lg' className='gap-2'>
						<Plus className='w-5 h-5' />
						Add First Column
					</Button>
					{onUseTemplate && (
						<Button variant='outline' size='lg' onClick={onUseTemplate}>
							Use Template
						</Button>
					)}
				</div>
				<div className='mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left'>
					<FeatureCard
						icon={<Type className='w-4 h-4' />}
						title='Multiple Types'
						description='Text, numbers, dates, references, and more'
					/>
					<FeatureCard
						icon={<Link className='w-4 h-4' />}
						title='Relationships'
						description='Connect tables with foreign keys'
					/>
					<FeatureCard
						icon={<Shield className='w-4 h-4' />}
						title='Validation'
						description='Add constraints and rules'
					/>
				</div>
			</div>
		</div>
	);
}

interface NoDataEmptyStateProps {
	onAddRow: () => void;
}

export function NoDataEmptyState({ onAddRow }: NoDataEmptyStateProps) {
	return (
		<div className='flex items-center justify-center py-12 sm:py-16'>
			<div className='text-center max-w-md px-4'>
				<Database className='w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground/50' />
				<h3 className='text-base sm:text-lg font-semibold mb-2'>No Data Yet</h3>
				<p className='text-sm text-muted-foreground mb-4 sm:mb-6'>
					This table is empty. Use the inline form above to add your first row.
				</p>
			</div>
		</div>
	);
}

interface NoResultsEmptyStateProps {
	onClearFilters: () => void;
}

export function NoResultsEmptyState({ onClearFilters }: NoResultsEmptyStateProps) {
	return (
		<div className='flex items-center justify-center py-12 sm:py-16'>
			<div className='text-center max-w-md px-4'>
				<div className='w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-muted flex items-center justify-center'>
					<Database className='w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground' />
				</div>
				<h3 className='text-base sm:text-lg font-semibold mb-2'>No Results Found</h3>
				<p className='text-sm text-muted-foreground mb-4 sm:mb-6'>
					No rows match your current filters or search query. Try adjusting your filters or
					clearing them.
				</p>
				<Button variant='outline' onClick={onClearFilters}>
					Clear All Filters
				</Button>
			</div>
		</div>
	);
}

