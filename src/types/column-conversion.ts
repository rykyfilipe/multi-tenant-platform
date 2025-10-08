/** @format */

/**
 * Types for Column Type Conversion System
 * Handles safe migration of column types with data validation
 */

export type ColumnType = 'string' | 'text' | 'number' | 'boolean' | 'date' | 'reference' | 'customArray';

export interface ConversionResult {
	success: boolean;
	newValue: any;
	dataLoss?: boolean;
	warning?: string;
	error?: string;
}

export interface ConversionExample {
	original: any;
	converted?: any;
	error?: string;
	warning?: string;
}

export interface TypeChangeAnalysis {
	columnId: number;
	columnName: string;
	oldType: ColumnType;
	newType: ColumnType;
	totalCells: number;
	convertible: number;
	lossyConversion: number;
	willFail: number;
	examples: {
		success: ConversionExample[];
		lossy: ConversionExample[];
		fail: ConversionExample[];
	};
	safe: boolean; // true if all can be converted without loss
	warnings: string[];
}

export interface TypeChangeOptions {
	deleteIncompatible?: boolean; // Delete cells that can't be converted
	convertToNull?: boolean; // Convert failed cells to NULL
	acceptLoss?: boolean; // Accept lossy conversions
	userId: number; // Who initiated the change
	confirmed?: boolean; // User has confirmed the change
}

export interface CellConversionLog {
	cellId: number;
	rowId: number;
	oldValue: any;
	newValue?: any;
	status: 'success' | 'lossy' | 'deleted' | 'nullified' | 'failed';
	warning?: string;
	error?: string;
}

export interface TypeChangeResult {
	success: boolean;
	column: any;
	stats: {
		total: number;
		converted: number;
		deleted: number;
		nullified: number;
		lossy: number;
		failed: number;
	};
	log: CellConversionLog[];
	duration: number; // milliseconds
}

export interface TypeChangeError {
	code: 'UNSAFE_CONVERSION' | 'TRANSACTION_FAILED' | 'VALIDATION_FAILED' | 'PERMISSION_DENIED';
	message: string;
	analysis?: TypeChangeAnalysis;
	details?: any;
}

