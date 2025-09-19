'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AggregationType } from '@/lib/aggregation-utils';

export interface AggregationConfig {
	primary: AggregationType;
	showMultiple?: boolean;
	selected?: AggregationType[];
	compareWithPrevious?: boolean;
}

export interface AggregationOption {
	type: AggregationType;
	label: string;
	description: string;
	icon: string;
	suitableFor: ('number' | 'text' | 'date' | 'boolean')[];
}

const AGGREGATION_OPTIONS: AggregationOption[] = [
	{
		type: 'sum',
		label: 'Sum',
		description: 'Add all values together',
		icon: '∑',
		suitableFor: ['number']
	},
	{
		type: 'count',
		label: 'Count',
		description: 'Count total number of records',
		icon: '#',
		suitableFor: ['number', 'text', 'date', 'boolean']
	},
	{
		type: 'average',
		label: 'Average',
		description: 'Calculate the mean value',
		icon: 'μ',
		suitableFor: ['number']
	},
	{
		type: 'min',
		label: 'Minimum',
		description: 'Find the smallest value',
		icon: '↓',
		suitableFor: ['number', 'date']
	},
	{
		type: 'max',
		label: 'Maximum',
		description: 'Find the largest value',
		icon: '↑',
		suitableFor: ['number', 'date']
	},
	{
		type: 'median',
		label: 'Median',
		description: 'Find the middle value',
		icon: '◊',
		suitableFor: ['number']
	},
	{
		type: 'std_dev',
		label: 'Standard Deviation',
		description: 'Measure of data spread',
		icon: 'σ',
		suitableFor: ['number']
	},
	{
		type: 'count_distinct',
		label: 'Distinct Count',
		description: 'Count unique values',
		icon: '≠',
		suitableFor: ['number', 'text', 'date', 'boolean']
	}
];

interface AggregationSelectorProps {
	config: AggregationConfig;
	onConfigChange: (config: AggregationConfig) => void;
	columnType?: 'number' | 'text' | 'date' | 'boolean';
	disabled?: boolean;
}

export function AggregationSelector({
	config,
	onConfigChange,
	columnType = 'number',
	disabled = false
}: AggregationSelectorProps) {
	const [showMultiple, setShowMultiple] = useState(config.showMultiple || false);
	const [selectedAggregations, setSelectedAggregations] = useState<AggregationType[]>(
		config.selected || [config.primary]
	);

	// Get suitable aggregations for the column type
	const suitableAggregations = AGGREGATION_OPTIONS.filter(option =>
		option.suitableFor.includes(columnType)
	);

	// Ensure primary aggregation is suitable for column type
	const validPrimary = suitableAggregations.find(opt => opt.type === config.primary)?.type || suitableAggregations[0]?.type || 'count';

	const handlePrimaryChange = (aggregation: AggregationType) => {
		console.log('[AggregationSelector] Primary change:', { aggregation, currentConfig: config });
		const newConfig: AggregationConfig = {
			...config,
			primary: aggregation
		};
		console.log('[AggregationSelector] New config:', newConfig);
		onConfigChange(newConfig);
	};

	const handleMultipleToggle = (enabled: boolean) => {
		setShowMultiple(enabled);
		const newConfig: AggregationConfig = {
			...config,
			showMultiple: enabled,
			selected: enabled ? selectedAggregations : undefined
		};
		onConfigChange(newConfig);
	};

	const handleAggregationToggle = (aggregation: AggregationType, selected: boolean) => {
		let newSelected: AggregationType[];
		if (selected) {
			newSelected = [...selectedAggregations, aggregation];
		} else {
			newSelected = selectedAggregations.filter(agg => agg !== aggregation);
		}
		setSelectedAggregations(newSelected);

		const newConfig: AggregationConfig = {
			...config,
			selected: newSelected
		};
		onConfigChange(newConfig);
	};

	const handleCompareToggle = (enabled: boolean) => {
		const newConfig: AggregationConfig = {
			...config,
			compareWithPrevious: enabled
		};
		onConfigChange(newConfig);
	};

	const getAggregationIcon = (type: AggregationType) => {
		const option = AGGREGATION_OPTIONS.find(opt => opt.type === type);
		return option?.icon || '?';
	};

	const getAggregationLabel = (type: AggregationType) => {
		const option = AGGREGATION_OPTIONS.find(opt => opt.type === type);
		return option?.label || type;
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-medium flex items-center">
					<Calculator className="h-4 w-4 mr-2" />
					Aggregation Function
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Primary Aggregation */}
				<div>
					<Label htmlFor="primaryAggregation">Primary Aggregation</Label>
					<Select
						value={validPrimary}
						onValueChange={handlePrimaryChange}
						disabled={disabled}
					>
						<SelectTrigger className="h-8">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{suitableAggregations.map((option) => (
								<SelectItem key={option.type} value={option.type}>
									<div className="flex items-center space-x-2">
										<span className="text-lg font-bold w-6 text-center">{option.icon}</span>
										<div>
											<div className="font-medium">{option.label}</div>
											<div className="text-xs text-gray-500">{option.description}</div>
										</div>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<p className="text-xs text-gray-500 mt-1">
						{AGGREGATION_OPTIONS.find(opt => opt.type === validPrimary)?.description}
					</p>
				</div>

				{/* Multiple Aggregations Toggle */}
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<Label htmlFor="showMultiple" className="text-sm font-medium">
							Show Multiple Aggregations
						</Label>
						<p className="text-xs text-gray-500">
							Display multiple aggregation results in the KPI widget
						</p>
					</div>
					<Switch
						id="showMultiple"
						checked={showMultiple}
						onCheckedChange={handleMultipleToggle}
						disabled={disabled}
					/>
				</div>

				{/* Multiple Aggregations Selection */}
				{showMultiple && (
					<div className="space-y-2">
						<Label className="text-sm font-medium">Additional Aggregations</Label>
						<div className="grid grid-cols-1 gap-2">
							{suitableAggregations
								.filter(option => option.type !== validPrimary)
								.map((option) => {
									const isSelected = selectedAggregations.includes(option.type);
									return (
										<div key={option.type} className="flex items-center space-x-3">
											<input
												type="checkbox"
												id={`agg-${option.type}`}
												checked={isSelected}
												onChange={(e) => handleAggregationToggle(option.type, e.target.checked)}
												className="h-4 w-4"
												disabled={disabled}
											/>
											<label htmlFor={`agg-${option.type}`} className="flex items-center space-x-2 flex-1 cursor-pointer">
												<span className="text-lg font-bold w-6 text-center">{option.icon}</span>
												<div>
													<div className="font-medium text-sm">{option.label}</div>
													<div className="text-xs text-gray-500">{option.description}</div>
												</div>
											</label>
										</div>
									);
								})}
						</div>
						
						{/* Selected Aggregations Summary */}
						{selectedAggregations.length > 0 && (
							<div className="flex flex-wrap gap-1 pt-2 border-t">
								{selectedAggregations.map((agg) => (
									<Badge key={agg} variant="secondary" className="text-xs">
										<span className="mr-1">{getAggregationIcon(agg)}</span>
										{getAggregationLabel(agg)}
									</Badge>
								))}
							</div>
						)}
					</div>
				)}

				{/* Compare with Previous Period */}
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<Label htmlFor="comparePrevious" className="text-sm font-medium flex items-center">
							<TrendingUp className="h-4 w-4 mr-1" />
							Compare with Previous Period
						</Label>
						<p className="text-xs text-gray-500">
							Show trend indicators and percentage changes
						</p>
					</div>
					<Switch
						id="comparePrevious"
						checked={config.compareWithPrevious || false}
						onCheckedChange={handleCompareToggle}
						disabled={disabled}
					/>
				</div>

				{/* Aggregation Summary */}
				<div className="bg-gray-50 rounded-lg p-3 space-y-2">
					<div className="flex items-center space-x-2">
						<BarChart3 className="h-4 w-4 text-gray-600" />
						<span className="text-sm font-medium text-gray-700">Configuration Summary</span>
					</div>
					<div className="space-y-1 text-xs text-gray-600">
						<p>• Primary: <span className="font-medium">{getAggregationLabel(validPrimary)}</span></p>
						{showMultiple && selectedAggregations.length > 1 && (
							<p>• Additional: <span className="font-medium">{selectedAggregations.length - 1} more</span></p>
						)}
						{config.compareWithPrevious && (
							<p>• Trend comparison: <span className="font-medium">Enabled</span></p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
