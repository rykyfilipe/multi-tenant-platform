/** @format */

import { describe, it, expect } from "vitest";
import {
	USER_FRIENDLY_COLUMN_TYPES,
	COLUMN_TYPE_LABELS,
	USER_FRIENDLY_PROPERTIES,
	PROPERTY_LABELS,
	COLUMN_TYPE_DESCRIPTIONS,
	PROPERTY_DESCRIPTIONS,
	getColumnTypeLabel,
	getPropertyLabel,
	getColumnTypeDescription,
	getPropertyDescription,
} from "../columnTypes";

describe("columnTypes", () => {
	describe("USER_FRIENDLY_COLUMN_TYPES", () => {
		it("should have all expected column types", () => {
			expect(USER_FRIENDLY_COLUMN_TYPES).toEqual({
				text: "text",
				number: "number",
				yesNo: "boolean",
				date: "date",
				link: "reference",
				customArray: "customArray",
			});
		});

		it("should have correct values for each type", () => {
			expect(USER_FRIENDLY_COLUMN_TYPES.text).toBe("text");
			expect(USER_FRIENDLY_COLUMN_TYPES.number).toBe("number");
			expect(USER_FRIENDLY_COLUMN_TYPES.yesNo).toBe("boolean");
			expect(USER_FRIENDLY_COLUMN_TYPES.date).toBe("date");
			expect(USER_FRIENDLY_COLUMN_TYPES.link).toBe("reference");
			expect(USER_FRIENDLY_COLUMN_TYPES.customArray).toBe("customArray");
		});
	});

	describe("COLUMN_TYPE_LABELS", () => {
		it("should have correct labels for all column types", () => {
			expect(COLUMN_TYPE_LABELS).toEqual({
				text: "Text",
				number: "Number",
				boolean: "Yes/No",
				date: "Date",
				reference: "Link to another table",
				customArray: "Custom Dropdown",
			});
		});

		it("should have user-friendly labels", () => {
			expect(COLUMN_TYPE_LABELS.text).toBe("Text");
			expect(COLUMN_TYPE_LABELS.number).toBe("Number");
			expect(COLUMN_TYPE_LABELS.boolean).toBe("Yes/No");
			expect(COLUMN_TYPE_LABELS.date).toBe("Date");
			expect(COLUMN_TYPE_LABELS.reference).toBe("Link to another table");
			expect(COLUMN_TYPE_LABELS.customArray).toBe("Custom Dropdown");
		});
	});

	describe("USER_FRIENDLY_PROPERTIES", () => {
		it("should have all expected properties", () => {
			expect(USER_FRIENDLY_PROPERTIES).toEqual({
				required: "required",
				primary: "primary",
			});
		});

		it("should have correct values for each property", () => {
			expect(USER_FRIENDLY_PROPERTIES.required).toBe("required");
			expect(USER_FRIENDLY_PROPERTIES.primary).toBe("primary");
		});
	});

	describe("PROPERTY_LABELS", () => {
		it("should have correct labels for all properties", () => {
			expect(PROPERTY_LABELS).toEqual({
				required: "Required",
				primary: "Primary Key",
			});
		});

		it("should have user-friendly labels", () => {
			expect(PROPERTY_LABELS.required).toBe("Required");
			expect(PROPERTY_LABELS.primary).toBe("Primary Key");
		});
	});

	describe("COLUMN_TYPE_DESCRIPTIONS", () => {
		it("should have descriptions for all column types", () => {
			expect(COLUMN_TYPE_DESCRIPTIONS).toEqual({
				text: "Free text input (names, descriptions, notes)",
				number: "Numbers only (prices, quantities, scores)",
				boolean: "Simple Yes or No answers",
				date: "Calendar date selection",
				reference: "Connect to data from another table",
				customArray: "Dropdown with custom options you define",
			});
		});

		it("should have helpful descriptions", () => {
			expect(COLUMN_TYPE_DESCRIPTIONS.text).toContain("Free text input");
			expect(COLUMN_TYPE_DESCRIPTIONS.number).toContain("Numbers only");
			expect(COLUMN_TYPE_DESCRIPTIONS.boolean).toContain("Yes or No");
			expect(COLUMN_TYPE_DESCRIPTIONS.date).toContain("Calendar date");
			expect(COLUMN_TYPE_DESCRIPTIONS.reference).toContain("Connect to data");
			expect(COLUMN_TYPE_DESCRIPTIONS.customArray).toContain("Dropdown");
		});
	});

	describe("PROPERTY_DESCRIPTIONS", () => {
		it("should have descriptions for all properties", () => {
			expect(PROPERTY_DESCRIPTIONS).toEqual({
				required: "This field must be filled in",
				primary: "Unique identifier for this table (like an ID)",
			});
		});

		it("should have helpful descriptions", () => {
			expect(PROPERTY_DESCRIPTIONS.required).toContain("must be filled in");
			expect(PROPERTY_DESCRIPTIONS.primary).toContain("Unique identifier");
		});
	});

	describe("getColumnTypeLabel", () => {
		it("should return correct label for valid column type", () => {
			expect(getColumnTypeLabel("text")).toBe("Text");
			expect(getColumnTypeLabel("number")).toBe("Number");
			expect(getColumnTypeLabel("boolean")).toBe("Yes/No");
			expect(getColumnTypeLabel("date")).toBe("Date");
			expect(getColumnTypeLabel("reference")).toBe("Link to another table");
			expect(getColumnTypeLabel("customArray")).toBe("Custom Dropdown");
		});

		it("should return the original type for unknown column type", () => {
			expect(getColumnTypeLabel("unknown")).toBe("unknown");
			expect(getColumnTypeLabel("invalid")).toBe("invalid");
			expect(getColumnTypeLabel("")).toBe("");
		});

		  it("should handle null and undefined inputs", () => {
    expect(getColumnTypeLabel(null as any)).toBe(null);
    expect(getColumnTypeLabel(undefined as any)).toBe(undefined);
  });

		it("should handle case-sensitive matching", () => {
			expect(getColumnTypeLabel("TEXT")).toBe("TEXT");
			expect(getColumnTypeLabel("Text")).toBe("Text");
		});
	});

	describe("getPropertyLabel", () => {
		it("should return correct label for valid property", () => {
			expect(getPropertyLabel("required")).toBe("Required");
			expect(getPropertyLabel("primary")).toBe("Primary Key");
		});

		it("should return the original property for unknown property", () => {
			expect(getPropertyLabel("unknown")).toBe("unknown");
			expect(getPropertyLabel("invalid")).toBe("invalid");
			expect(getPropertyLabel("")).toBe("");
		});

		  it("should handle null and undefined inputs", () => {
    expect(getPropertyLabel(null as any)).toBe(null);
    expect(getPropertyLabel(undefined as any)).toBe(undefined);
  });

		it("should handle case-sensitive matching", () => {
			expect(getPropertyLabel("REQUIRED")).toBe("REQUIRED");
			expect(getPropertyLabel("Required")).toBe("Required");
		});
	});

	describe("getColumnTypeDescription", () => {
		it("should return correct description for valid column type", () => {
			expect(getColumnTypeDescription("text")).toBe(
				"Free text input (names, descriptions, notes)",
			);
			expect(getColumnTypeDescription("number")).toBe(
				"Numbers only (prices, quantities, scores)",
			);
			expect(getColumnTypeDescription("boolean")).toBe(
				"Simple Yes or No answers",
			);
			expect(getColumnTypeDescription("date")).toBe("Calendar date selection");
			expect(getColumnTypeDescription("reference")).toBe(
				"Connect to data from another table",
			);
			expect(getColumnTypeDescription("customArray")).toBe(
				"Dropdown with custom options you define",
			);
		});

		it("should return empty string for unknown column type", () => {
			expect(getColumnTypeDescription("unknown")).toBe("");
			expect(getColumnTypeDescription("invalid")).toBe("");
			expect(getColumnTypeDescription("")).toBe("");
		});

		it("should handle null and undefined inputs", () => {
			expect(getColumnTypeDescription(null as any)).toBe("");
			expect(getColumnTypeDescription(undefined as any)).toBe("");
		});

		it("should handle case-sensitive matching", () => {
			expect(getColumnTypeDescription("TEXT")).toBe("");
			expect(getColumnTypeDescription("Text")).toBe("");
		});
	});

	describe("getPropertyDescription", () => {
		it("should return correct description for valid property", () => {
			expect(getPropertyDescription("required")).toBe(
				"This field must be filled in",
			);
			expect(getPropertyDescription("primary")).toBe(
				"Unique identifier for this table (like an ID)",
			);
		});

		it("should return empty string for unknown property", () => {
			expect(getPropertyDescription("unknown")).toBe("");
			expect(getPropertyDescription("invalid")).toBe("");
			expect(getPropertyDescription("")).toBe("");
		});

		it("should handle null and undefined inputs", () => {
			expect(getPropertyDescription(null as any)).toBe("");
			expect(getPropertyDescription(undefined as any)).toBe("");
		});

		it("should handle case-sensitive matching", () => {
			expect(getPropertyDescription("REQUIRED")).toBe("");
			expect(getPropertyDescription("Required")).toBe("");
		});
	});
});
