/** @format */

import { describe, it, expect } from '@jest/globals';
import {
	validateTableForInvoices,
	getValidationMessage,
	extractProductDetails,
} from '@/lib/semantic-helpers';
import { SemanticColumnType } from '@/lib/semantic-types';

describe('Semantic Helpers', () => {
	describe('validateTableForInvoices', () => {
		it('should validate table with all required semantic types', () => {
			const columns = [
				{ id: 1, name: 'name', semanticType: SemanticColumnType.PRODUCT_NAME },
				{ id: 2, name: 'price', semanticType: SemanticColumnType.PRODUCT_PRICE },
				{ id: 3, name: 'currency', semanticType: SemanticColumnType.CURRENCY },
				{ id: 4, name: 'vat', semanticType: SemanticColumnType.PRODUCT_VAT },
				{ id: 5, name: 'unit', semanticType: SemanticColumnType.UNIT_OF_MEASURE },
			];

			const result = validateTableForInvoices(columns, 'products');

			expect(result.isValid).toBe(true);
			expect(result.warnings.length).toBeGreaterThan(0); // Should have warnings for missing optional types
			expect(result.missingTypes).toHaveLength(0);
		});

		it('should identify missing required semantic types', () => {
			const columns = [
				{ id: 1, name: 'name', semanticType: SemanticColumnType.PRODUCT_NAME },
				{ id: 2, name: 'price', semanticType: SemanticColumnType.PRODUCT_PRICE },
				// Missing currency, vat, unit_of_measure
			];

			const result = validateTableForInvoices(columns, 'products');

			expect(result.isValid).toBe(false);
			expect(result.missingTypes).toContain(SemanticColumnType.CURRENCY);
			expect(result.missingTypes).toContain(SemanticColumnType.PRODUCT_VAT);
			expect(result.missingTypes).toContain(SemanticColumnType.UNIT_OF_MEASURE);
		});

		it('should provide warnings for missing optional types', () => {
			const columns = [
				{ id: 1, name: 'name', semanticType: SemanticColumnType.PRODUCT_NAME },
				{ id: 2, name: 'price', semanticType: SemanticColumnType.PRODUCT_PRICE },
				{ id: 3, name: 'currency', semanticType: SemanticColumnType.CURRENCY },
				{ id: 4, name: 'vat', semanticType: SemanticColumnType.PRODUCT_VAT },
				{ id: 5, name: 'unit', semanticType: SemanticColumnType.UNIT_OF_MEASURE },
				// Missing optional types
			];

			const result = validateTableForInvoices(columns, 'products');

			expect(result.isValid).toBe(true);
			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.warnings.some((w) => w.includes('description'))).toBe(true);
		});

		it('should handle empty columns array', () => {
			const result = validateTableForInvoices([], 'products');

			expect(result.isValid).toBe(false);
			expect(result.missingTypes.length).toBeGreaterThan(0);
		});
	});

	describe('getValidationMessage', () => {
		it('should return success message for valid table', () => {
			const validation = {
				isValid: true,
				warnings: [],
				missingTypes: [],
			};

			const message = getValidationMessage(validation, 'products');

			expect(message).toContain('products');
			expect(message).toContain('valid');
		});

		it('should return error message for invalid table', () => {
			const validation = {
				isValid: false,
				warnings: [],
				missingTypes: [SemanticColumnType.CURRENCY, SemanticColumnType.PRODUCT_VAT],
			};

			const message = getValidationMessage(validation, 'products');

			expect(message).toContain('products');
			expect(message).toContain('Missing');
			expect(message).toContain('currency');
			expect(message).toContain('vat');
		});

		it('should include warnings in message', () => {
			const validation = {
				isValid: true,
				warnings: ['Missing description field', 'Missing category field'],
				missingTypes: [],
			};

			const message = getValidationMessage(validation, 'products');

			expect(message).toContain('valid');
			expect(message).toContain('products');
		});
	});

	describe('extractProductDetails', () => {
		it('should extract product details from cells', () => {
			const tableColumns = [
				{ id: 1, name: 'name', semanticType: SemanticColumnType.PRODUCT_NAME },
				{ id: 2, name: 'price', semanticType: SemanticColumnType.PRODUCT_PRICE },
				{ id: 3, name: 'currency', semanticType: SemanticColumnType.CURRENCY },
				{ id: 4, name: 'vat', semanticType: SemanticColumnType.PRODUCT_VAT },
				{ id: 5, name: 'sku', semanticType: SemanticColumnType.PRODUCT_SKU },
				{ id: 6, name: 'description', semanticType: SemanticColumnType.PRODUCT_DESCRIPTION },
				{ id: 7, name: 'category', semanticType: SemanticColumnType.PRODUCT_CATEGORY },
				{ id: 8, name: 'brand', semanticType: SemanticColumnType.PRODUCT_BRAND },
			];

			const rowCells = [
				{ columnId: 1, value: 'Test Product' },
				{ columnId: 2, value: 100.50 },
				{ columnId: 3, value: 'USD' },
				{ columnId: 4, value: 20 },
				{ columnId: 5, value: 'SKU-001' },
				{ columnId: 6, value: 'Test Description' },
				{ columnId: 7, value: 'Electronics' },
				{ columnId: 8, value: 'Test Brand' },
			];

			const result = extractProductDetails(tableColumns, rowCells);

			expect(result.name).toBe('Test Product');
			expect(result.price).toBe(100.50);
			expect(result.currency).toBe('USD');
			expect(result.vat).toBe(20);
			expect(result.sku).toBe('SKU-001');
			expect(result.description).toBe('Test Description');
			expect(result.category).toBe('Electronics');
			expect(result.brand).toBe('Test Brand');
		});

		it('should handle missing fields gracefully', () => {
			const tableColumns = [
				{ id: 1, name: 'name', semanticType: SemanticColumnType.PRODUCT_NAME },
				{ id: 2, name: 'price', semanticType: SemanticColumnType.PRODUCT_PRICE },
			];

			const rowCells = [
				{ columnId: 1, value: 'Test Product' },
				{ columnId: 2, value: 100 },
			];

			const result = extractProductDetails(tableColumns, rowCells);

			expect(result.name).toBe('Test Product');
			expect(result.price).toBe(100);
			expect(result.currency).toBeNull();
			expect(result.vat).toBe(0);
			expect(result.sku).toBeNull();
			expect(result.description).toBeNull();
			expect(result.category).toBeNull();
			expect(result.brand).toBeNull();
		});

		it('should handle empty cells array', () => {
			const result = extractProductDetails([], []);

			expect(result.name).toBeNull();
			expect(result.price).toBeNull();
			expect(result.currency).toBeNull();
			expect(result.vat).toBe(0);
		});

		it('should handle null/undefined values', () => {
			const tableColumns = [
				{ id: 1, name: 'name', semanticType: SemanticColumnType.PRODUCT_NAME },
				{ id: 2, name: 'price', semanticType: SemanticColumnType.PRODUCT_PRICE },
				{ id: 3, name: 'vat', semanticType: SemanticColumnType.PRODUCT_VAT },
			];

			const rowCells = [
				{ columnId: 1, value: null },
				{ columnId: 2, value: undefined },
				{ columnId: 3, value: null },
			];

			const result = extractProductDetails(tableColumns, rowCells);

			expect(result.name).toBeNull();
			expect(result.price).toBeNull();
			expect(result.vat).toBe(0);
		});
	});
});
