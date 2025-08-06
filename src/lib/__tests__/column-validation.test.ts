/** @format */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mock the validation schema from the API route
const ColumnSchema = z.object({
	name: z.string().min(1, "Name is mandatory"),
	type: z.enum([
		"string",
		"text", // Accept both "string" and "text" for compatibility
		"boolean",
		"number",
		"date",
		"reference",
		"customArray",
	]).transform((type) => type === "text" ? "string" : type), // Transform "text" to "string"
	required: z.boolean().optional(),
	primary: z.boolean().optional(),
	autoIncrement: z.boolean().optional(),
	referenceTableId: z.number().optional(),
	customOptions: z.array(z.string()).optional(),
});

const ColumnsSchema = z.object({
	columns: z.array(ColumnSchema),
});

describe('Column Validation', () => {
	it('should accept "text" type and transform it to "string"', () => {
		const validData = {
			columns: [
				{
					name: "Test Column",
					type: "text",
					required: false,
					primary: false,
				}
			]
		};

		const result = ColumnsSchema.parse(validData);
		
		expect(result.columns[0].type).toBe("string");
		expect(result.columns[0].name).toBe("Test Column");
	});

	it('should accept "string" type without transformation', () => {
		const validData = {
			columns: [
				{
					name: "Test Column",
					type: "string",
					required: false,
					primary: false,
				}
			]
		};

		const result = ColumnsSchema.parse(validData);
		
		expect(result.columns[0].type).toBe("string");
		expect(result.columns[0].name).toBe("Test Column");
	});

	it('should accept other valid column types', () => {
		const validData = {
			columns: [
				{
					name: "Number Column",
					type: "number",
					required: true,
				},
				{
					name: "Boolean Column",
					type: "boolean",
					required: false,
				},
				{
					name: "Date Column",
					type: "date",
					required: false,
				}
			]
		};

		const result = ColumnsSchema.parse(validData);
		
		expect(result.columns[0].type).toBe("number");
		expect(result.columns[1].type).toBe("boolean");
		expect(result.columns[2].type).toBe("date");
	});

	it('should reject invalid column types', () => {
		const invalidData = {
			columns: [
				{
					name: "Invalid Column",
					type: "invalid_type",
					required: false,
				}
			]
		};

		expect(() => {
			ColumnsSchema.parse(invalidData);
		}).toThrow();
	});

	it('should handle customArray type with options', () => {
		const validData = {
			columns: [
				{
					name: "Custom Array Column",
					type: "customArray",
					required: false,
					customOptions: ["Option 1", "Option 2", "Option 3"],
				}
			]
		};

		const result = ColumnsSchema.parse(validData);
		
		expect(result.columns[0].type).toBe("customArray");
		expect(result.columns[0].customOptions).toEqual(["Option 1", "Option 2", "Option 3"]);
	});

	it('should handle reference type with referenceTableId', () => {
		const validData = {
			columns: [
				{
					name: "Reference Column",
					type: "reference",
					required: false,
					referenceTableId: 123,
				}
			]
		};

		const result = ColumnsSchema.parse(validData);
		
		expect(result.columns[0].type).toBe("reference");
		expect(result.columns[0].referenceTableId).toBe(123);
	});
}); 