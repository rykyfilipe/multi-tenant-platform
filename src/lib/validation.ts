/** @format */

import { z } from "zod";

// Base validation schemas
export const emailSchema = z
	.string()
	.email("Invalid email format")
	.min(1, "Email is required")
	.max(255, "Email too long")
	.transform((email) => email.toLowerCase().trim());

export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(128, "Password too long")
	.regex(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter")
	.regex(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
	.regex(/^(?=.*\d)/, "Password must contain at least one number")
	.regex(
		/^(?=.*[@$!%*?&])/,
		"Password must contain at least one special character (@$!%*?&)",
	);

export const nameSchema = z
	.string()
	.min(2, "Name must be at least 2 characters")
	.max(50, "Name too long")
	.regex(
		/^[a-zA-Z\s-']+$/,
		"Name can only contain letters, spaces, hyphens, and apostrophes",
	)
	.transform((name) => name.trim());

export const phoneSchema = z
	.string()
	.regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format")
	.optional();

// Database and table validation schemas
export const databaseNameSchema = z
	.string()
	.min(1, "Database name is required")
	.max(100, "Database name too long")
	.regex(
		/^[a-zA-Z0-9_\-\s]+$/,
		"Database name can only contain letters, numbers, spaces, hyphens, and underscores",
	)
	.transform((name) => name.trim());

export const tableNameSchema = z
	.string()
	.min(1, "Table name is required")
	.max(100, "Table name too long")
	.regex(
		/^[a-zA-Z0-9_\-\s]+$/,
		"Table name can only contain letters, numbers, spaces, hyphens, and underscores",
	)
	.transform((name) => name.trim());

export const columnNameSchema = z
	.string()
	.min(1, "Column name is required")
	.max(100, "Column name too long")
	.regex(
		/^[a-zA-Z0-9_\-\s]+$/,
		"Column name can only contain letters, numbers, spaces, hyphens, and underscores",
	)
	.transform((name) => name.trim());

export const descriptionSchema = z
	.string()
	.max(500, "Description too long")
	.optional()
	.transform((desc) => desc?.trim() || "");

// API token validation
export const tokenNameSchema = z
	.string()
	.min(1, "Token name is required")
	.max(100, "Token name too long")
	.regex(
		/^[a-zA-Z0-9_\-\s]+$/,
		"Token name can only contain letters, numbers, spaces, hyphens, and underscores",
	)
	.transform((name) => name.trim());

export const scopesSchema = z
	.array(z.enum(["read", "write", "delete", "admin"]))
	.min(1, "At least one scope is required")
	.default(["read"]);

// Tenant validation
export const tenantNameSchema = z
	.string()
	.min(1, "Tenant name is required")
	.max(100, "Tenant name too long")
	.regex(
		/^[a-zA-Z0-9_\-\s]+$/,
		"Tenant name can only contain letters, numbers, spaces, hyphens, and underscores",
	)
	.transform((name) => name.trim());

// Data validation schemas
export const stringValueSchema = z
	.string()
	.max(1000, "String value too long")
	.transform((val) => val.trim());

export const numberValueSchema = z
	.number()
	.min(-999999999, "Number too small")
	.max(999999999, "Number too large");

export const booleanValueSchema = z.boolean();

export const dateValueSchema = z
	.string()
	.datetime("Invalid date format")
	.transform((date) => new Date(date));

export const emailValueSchema = z
	.string()
	.email("Invalid email format")
	.max(255, "Email too long");

export const urlValueSchema = z
	.string()
	.url("Invalid URL format")
	.max(500, "URL too long");

// Input sanitization functions
export function sanitizeString(input: string): string {
	return input
		.trim()
		.replace(/[<>]/g, "") // Remove potential HTML tags
		.replace(/javascript:/gi, "") // Remove javascript: protocol
		.replace(/on\w+=/gi, ""); // Remove event handlers
}

export function sanitizeHtml(input: string): string {
	return input
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
		.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
		.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "");
}

export function validateAndSanitizeInput(input: any, schema: z.ZodSchema): any {
	try {
		const validated = schema.parse(input);
		return validated;
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(error.errors[0].message);
		}
		throw error;
	}
}

// SQL injection prevention
export function containsSqlInjection(input: string): boolean {
	const sqlPatterns = [
		/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|TRUNCATE|MERGE)\b/i,
		/['";]/, // Single quotes, double quotes, semicolons
		/--/, // SQL comments
		/\b(UNION|JOIN|WHERE|FROM|INTO|VALUES|SET)\b/i,
		/\b(OR|AND)\s+\d+\s*=\s*\d+/i, // OR 1=1, AND 1=1 patterns
		/\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"]/i, // OR 'a'='a' patterns
		/\b(OR|AND)\s+\w+\s*=\s*\w+/i, // OR column=value patterns
		/\b(HAVING|GROUP BY|ORDER BY)\b/i,
		/\b(INFORMATION_SCHEMA|sys\.|pg_|mysql\.)\b/i, // Database system tables
	];

	return sqlPatterns.some((pattern) => pattern.test(input));
}

// XSS prevention
export function containsXSS(input: string): boolean {
	const xssPatterns = [
		/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		/javascript:/gi,
		/on\w+\s*=/gi,
		/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
		/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
		/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
		/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
		/<input\b[^<]*(?:(?!\/>)<[^<]*)*\/?>/gi,
		/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi,
		/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi,
		/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
		/<link\b[^<]*(?:(?!\/>)<[^<]*)*\/?>/gi,
		/<meta\b[^<]*(?:(?!\/>)<[^<]*)*\/?>/gi,
		/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
		/expression\s*\(/gi,
		/url\s*\(/gi,
		/eval\s*\(/gi,
		/setTimeout\s*\(/gi,
		/setInterval\s*\(/gi,
	];

	return xssPatterns.some((pattern) => pattern.test(input));
}

// Comprehensive input validation
export function validateInput(
	input: any,
	type: string,
): { isValid: boolean; error?: string; sanitized?: any } {
	try {
		let schema: z.ZodSchema;
		let sanitized: any;

		switch (type) {
			case "email":
				schema = emailSchema;
				break;
			case "password":
				schema = passwordSchema;
				break;
			case "name":
				schema = nameSchema;
				break;
			case "database_name":
				schema = databaseNameSchema;
				break;
			case "table_name":
				schema = tableNameSchema;
				break;
			case "column_name":
				schema = columnNameSchema;
				break;
			case "token_name":
				schema = tokenNameSchema;
				break;
			case "tenant_name":
				schema = tenantNameSchema;
				break;
			case "string":
			case "text":
				schema = stringValueSchema;
				break;
			case "number":
				schema = numberValueSchema;
				break;
			case "boolean":
				schema = booleanValueSchema;
				break;
			case "date":
				schema = dateValueSchema;
				break;
			default:
				return { isValid: false, error: "Unknown validation type" };
		}

		// Check for SQL injection and XSS if it's a string
		if (typeof input === "string") {
			if (containsSqlInjection(input)) {
				return { isValid: false, error: "Invalid input detected" };
			}
			if (containsXSS(input)) {
				return { isValid: false, error: "Invalid input detected" };
			}
			sanitized = sanitizeString(input);
		} else {
			sanitized = input;
		}

		const validated = schema.parse(sanitized);
		return { isValid: true, sanitized: validated };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { isValid: false, error: error.errors[0].message };
		}
		return { isValid: false, error: "Validation failed" };
	}
}
