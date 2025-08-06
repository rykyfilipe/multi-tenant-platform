/** @format */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
	emailSchema,
	passwordSchema,
	nameSchema,
	phoneSchema,
	databaseNameSchema,
	tableNameSchema,
	columnNameSchema,
	descriptionSchema,
	tokenNameSchema,
	scopesSchema,
	tenantNameSchema,
	stringValueSchema,
	numberValueSchema,
	booleanValueSchema,
	dateValueSchema,
	emailValueSchema,
	urlValueSchema,
	sanitizeString,
	sanitizeHtml,
	validateAndSanitizeInput,
	containsSqlInjection,
	containsXSS,
	validateInput,
} from "../validation";

describe("validation", () => {
	describe("emailSchema", () => {
		it("should validate correct email addresses", async () => {
			const validEmails = [
				"test@example.com",
				"user.name@domain.co.uk",
				"user+tag@example.org",
			];

			for (const email of validEmails) {
				const result = await emailSchema.parseAsync(email);
				expect(result).toBe(email.toLowerCase().trim());
			}
		});

		it("should reject invalid email addresses", async () => {
			const invalidEmails = [
				"invalid-email",
				"@example.com",
				"user@",
				"user@.com",
				"",
				"   ",
			];

			for (const email of invalidEmails) {
				await expect(emailSchema.parseAsync(email)).rejects.toThrow();
			}
		});

		it("should transform email to lowercase and trim", async () => {
			const result = await emailSchema.parseAsync("test@example.com");
			expect(result).toBe("test@example.com");
		});

		it("should reject emails that are too long", async () => {
			const longEmail = "a".repeat(250) + "@example.com";
			await expect(emailSchema.parseAsync(longEmail)).rejects.toThrow(
				"Email too long",
			);
		});
	});

	describe("passwordSchema", () => {
		it("should validate correct passwords", async () => {
			const validPasswords = [
				"Password123!",
				"MySecurePass1@",
				"ComplexP@ssw0rd",
			];

			for (const password of validPasswords) {
				await expect(passwordSchema.parseAsync(password)).resolves.toBe(
					password,
				);
			}
		});

		it("should reject passwords that are too short", async () => {
			await expect(passwordSchema.parseAsync("Pass1!")).rejects.toThrow(
				"Password must be at least 8 characters",
			);
		});

		it("should reject passwords that are too long", async () => {
			const longPassword = "A".repeat(129) + "1!";
			await expect(passwordSchema.parseAsync(longPassword)).rejects.toThrow(
				"Password too long",
			);
		});

		it("should reject passwords without lowercase letters", async () => {
			await expect(passwordSchema.parseAsync("PASSWORD123!")).rejects.toThrow(
				"Password must contain at least one lowercase letter",
			);
		});

		it("should reject passwords without uppercase letters", async () => {
			await expect(passwordSchema.parseAsync("password123!")).rejects.toThrow(
				"Password must contain at least one uppercase letter",
			);
		});

		it("should reject passwords without numbers", async () => {
			await expect(passwordSchema.parseAsync("Password!")).rejects.toThrow(
				"Password must contain at least one number",
			);
		});

		it("should reject passwords without special characters", async () => {
			await expect(passwordSchema.parseAsync("Password123")).rejects.toThrow(
				"Password must contain at least one special character",
			);
		});
	});

	describe("nameSchema", () => {
		it("should validate correct names", async () => {
			const validNames = ["John", "Mary Jane", "O'Connor", "Jean-Pierre"];

			for (const name of validNames) {
				const result = await nameSchema.parseAsync(name);
				expect(result).toBe(name.trim());
			}
		});

		it("should reject names that are too short", async () => {
			await expect(nameSchema.parseAsync("A")).rejects.toThrow(
				"Name must be at least 2 characters",
			);
		});

		it("should reject names that are too long", async () => {
			const longName = "A".repeat(51);
			await expect(nameSchema.parseAsync(longName)).rejects.toThrow(
				"Name too long",
			);
		});

		it("should reject names with invalid characters", async () => {
			const invalidNames = ["John123", "Mary@Jane", "Test#Name", "User$Name"];

			for (const name of invalidNames) {
				await expect(nameSchema.parseAsync(name)).rejects.toThrow(
					"Name can only contain letters, spaces, hyphens, and apostrophes",
				);
			}
		});

		it("should trim whitespace", async () => {
			const result = await nameSchema.parseAsync("  John Doe  ");
			expect(result).toBe("John Doe");
		});
	});

	describe("phoneSchema", () => {
		it("should validate correct phone numbers", async () => {
			const validPhones = ["+1234567890", "1234567890", "+44123456789"];

			for (const phone of validPhones) {
				await expect(phoneSchema.parseAsync(phone)).resolves.toBe(phone);
			}
		});

		it("should reject invalid phone numbers", async () => {
			const invalidPhones = [
				"abc123",
				"123-456-7890",
				"+12345678901234567", // too long
				"0123456789", // starts with 0
			];

			for (const phone of invalidPhones) {
				await expect(phoneSchema.parseAsync(phone)).rejects.toThrow(
					"Invalid phone number format",
				);
			}
		});

		it("should allow undefined", async () => {
			await expect(phoneSchema.parseAsync(undefined)).resolves.toBeUndefined();
		});
	});

	describe("databaseNameSchema", () => {
		it("should validate correct database names", async () => {
			const validNames = [
				"my_database",
				"My Database",
				"database-123",
				"test_db",
			];

			for (const name of validNames) {
				const result = await databaseNameSchema.parseAsync(name);
				expect(result).toBe(name.trim());
			}
		});

		it("should reject empty names", async () => {
			await expect(databaseNameSchema.parseAsync("")).rejects.toThrow(
				"Database name is required",
			);
		});

		it("should reject names that are too long", async () => {
			const longName = "A".repeat(101);
			await expect(databaseNameSchema.parseAsync(longName)).rejects.toThrow(
				"Database name too long",
			);
		});

		it("should reject names with invalid characters", async () => {
			const invalidNames = [
				"database@name",
				"test#db",
				"my$database",
				"db.name",
			];

			for (const name of invalidNames) {
				await expect(databaseNameSchema.parseAsync(name)).rejects.toThrow(
					"Database name can only contain letters, numbers, spaces, hyphens, and underscores",
				);
			}
		});
	});

	describe("tableNameSchema", () => {
		it("should validate correct table names", async () => {
			const validNames = ["users", "User Table", "table_123", "my-table"];

			for (const name of validNames) {
				const result = await tableNameSchema.parseAsync(name);
				expect(result).toBe(name.trim());
			}
		});

		it("should reject empty names", async () => {
			await expect(tableNameSchema.parseAsync("")).rejects.toThrow(
				"Table name is required",
			);
		});

		it("should reject names that are too long", async () => {
			const longName = "A".repeat(101);
			await expect(tableNameSchema.parseAsync(longName)).rejects.toThrow(
				"Table name too long",
			);
		});
	});

	describe("columnNameSchema", () => {
		it("should validate correct column names", async () => {
			const validNames = ["name", "User Name", "column_123", "my-column"];

			for (const name of validNames) {
				const result = await columnNameSchema.parseAsync(name);
				expect(result).toBe(name.trim());
			}
		});

		it("should reject empty names", async () => {
			await expect(columnNameSchema.parseAsync("")).rejects.toThrow(
				"Column name is required",
			);
		});

		it("should reject names that are too long", async () => {
			const longName = "A".repeat(101);
			await expect(columnNameSchema.parseAsync(longName)).rejects.toThrow(
				"Column name too long",
			);
		});
	});

	describe("descriptionSchema", () => {
		it("should validate correct descriptions", async () => {
			const validDescriptions = [
				"A test description",
				"",
				undefined,
				"   trimmed   ",
			];

			for (const desc of validDescriptions) {
				const result = await descriptionSchema.parseAsync(desc);
				if (desc) {
					expect(result).toBe(desc.trim());
				} else {
					expect(result).toBe("");
				}
			}
		});

		it("should reject descriptions that are too long", async () => {
			const longDesc = "A".repeat(501);
			await expect(descriptionSchema.parseAsync(longDesc)).rejects.toThrow(
				"Description too long",
			);
		});
	});

	describe("tokenNameSchema", () => {
		it("should validate correct token names", async () => {
			const validNames = ["my_token", "API Token", "token-123", "test_token"];

			for (const name of validNames) {
				const result = await tokenNameSchema.parseAsync(name);
				expect(result).toBe(name.trim());
			}
		});

		it("should reject empty names", async () => {
			await expect(tokenNameSchema.parseAsync("")).rejects.toThrow(
				"Token name is required",
			);
		});

		it("should reject names that are too long", async () => {
			const longName = "A".repeat(101);
			await expect(tokenNameSchema.parseAsync(longName)).rejects.toThrow(
				"Token name too long",
			);
		});
	});

	describe("scopesSchema", () => {
		it("should validate correct scopes", async () => {
			const validScopes = [
				["read"],
				["read", "write"],
				["read", "write", "delete", "admin"],
			];

			for (const scopes of validScopes) {
				await expect(scopesSchema.parseAsync(scopes)).resolves.toEqual(scopes);
			}
		});

		it("should reject empty scopes array", async () => {
			await expect(scopesSchema.parseAsync([])).rejects.toThrow(
				"At least one scope is required",
			);
		});

		it("should reject invalid scopes", async () => {
			await expect(scopesSchema.parseAsync(["invalid"])).rejects.toThrow();
		});

		it("should default to read scope", async () => {
			const result = scopesSchema.parse(undefined);
			expect(result).toEqual(["read"]);
		});
	});

	describe("tenantNameSchema", () => {
		it("should validate correct tenant names", async () => {
			const validNames = [
				"my_tenant",
				"Tenant Name",
				"tenant-123",
				"test_tenant",
			];

			for (const name of validNames) {
				const result = await tenantNameSchema.parseAsync(name);
				expect(result).toBe(name.trim());
			}
		});

		it("should reject empty names", async () => {
			await expect(tenantNameSchema.parseAsync("")).rejects.toThrow(
				"Tenant name is required",
			);
		});

		it("should reject names that are too long", async () => {
			const longName = "A".repeat(101);
			await expect(tenantNameSchema.parseAsync(longName)).rejects.toThrow(
				"Tenant name too long",
			);
		});
	});

	describe("stringValueSchema", () => {
		it("should validate correct string values", async () => {
			const validStrings = ["test string", "A".repeat(1000), "   trimmed   "];

			for (const str of validStrings) {
				const result = await stringValueSchema.parseAsync(str);
				expect(result).toBe(str.trim());
			}
		});

		it("should reject strings that are too long", async () => {
			const longString = "A".repeat(1001);
			await expect(stringValueSchema.parseAsync(longString)).rejects.toThrow(
				"String value too long",
			);
		});
	});

	describe("numberValueSchema", () => {
		it("should validate correct number values", async () => {
			const validNumbers = [0, 123, -456, 999999999, -999999999];

			for (const num of validNumbers) {
				await expect(numberValueSchema.parseAsync(num)).resolves.toBe(num);
			}
		});

		it("should reject numbers that are too small", async () => {
			await expect(numberValueSchema.parseAsync(-1000000000)).rejects.toThrow(
				"Number too small",
			);
		});

		it("should reject numbers that are too large", async () => {
			await expect(numberValueSchema.parseAsync(1000000000)).rejects.toThrow(
				"Number too large",
			);
		});
	});

	describe("booleanValueSchema", () => {
		it("should validate boolean values", async () => {
			await expect(booleanValueSchema.parseAsync(true)).resolves.toBe(true);
			await expect(booleanValueSchema.parseAsync(false)).resolves.toBe(false);
		});
	});

	describe("dateValueSchema", () => {
		it("should validate correct date strings", async () => {
			const validDates = [
				"2023-01-01T00:00:00.000Z",
				"2023-12-31T23:59:59.999Z",
			];

			for (const date of validDates) {
				const result = await dateValueSchema.parseAsync(date);
				expect(result).toBeInstanceOf(Date);
			}
		});

		it("should reject invalid date strings", async () => {
			const invalidDates = [
				"invalid-date",
				"2023-13-01T00:00:00.000Z",
				"2023-01-32T00:00:00.000Z",
			];

			for (const date of invalidDates) {
				await expect(dateValueSchema.parseAsync(date)).rejects.toThrow(
					"Invalid date format",
				);
			}
		});
	});

	describe("emailValueSchema", () => {
		it("should validate correct email values", async () => {
			const validEmails = ["test@example.com", "user@domain.org"];

			for (const email of validEmails) {
				await expect(emailValueSchema.parseAsync(email)).resolves.toBe(email);
			}
		});

		it("should reject invalid email values", async () => {
			const invalidEmails = [
				"invalid-email",
				"user@",
				"a".repeat(256) + "@example.com",
			];

			for (const email of invalidEmails) {
				await expect(emailValueSchema.parseAsync(email)).rejects.toThrow();
			}
		});
	});

	describe("urlValueSchema", () => {
		it("should validate correct URL values", async () => {
			const validUrls = [
				"https://example.com",
				"http://test.org/path",
				"https://sub.domain.co.uk/path?param=value",
			];

			for (const url of validUrls) {
				await expect(urlValueSchema.parseAsync(url)).resolves.toBe(url);
			}
		});

		it("should reject invalid URL values", async () => {
			const invalidUrls = ["not-a-url", "https://" + "a".repeat(501)];

			for (const url of invalidUrls) {
				await expect(urlValueSchema.parseAsync(url)).rejects.toThrow();
			}
		});
	});

	describe("sanitizeString", () => {
		it("should remove HTML tags", () => {
			expect(sanitizeString('<script>alert("xss")</script>')).toBe(
				'scriptalert("xss")/script',
			);
			expect(sanitizeString("<div>content</div>")).toBe("divcontent/div");
		});

		it("should remove javascript protocol", () => {
			expect(sanitizeString('javascript:alert("xss")')).toBe('alert("xss")');
			expect(sanitizeString('JAVASCRIPT:alert("xss")')).toBe('alert("xss")');
		});

		it("should remove event handlers", () => {
			expect(sanitizeString('onclick=alert("xss")')).toBe('alert("xss")');
			expect(sanitizeString('onload=alert("xss")')).toBe('alert("xss")');
		});

		it("should trim whitespace", () => {
			expect(sanitizeString("  test  ")).toBe("test");
		});

		it("should handle normal text", () => {
			expect(sanitizeString("normal text")).toBe("normal text");
		});
	});

	describe("sanitizeHtml", () => {
		it("should remove script tags", () => {
			expect(sanitizeHtml('<script>alert("xss")</script>')).toBe("");
			expect(sanitizeHtml('<script src="malicious.js"></script>')).toBe("");
		});

		it("should remove iframe tags", () => {
			expect(sanitizeHtml('<iframe src="malicious.html"></iframe>')).toBe("");
		});

		it("should remove object tags", () => {
			expect(sanitizeHtml('<object data="malicious.swf"></object>')).toBe("");
		});

		it("should remove embed tags", () => {
			expect(sanitizeHtml('<embed src="malicious.swf"></embed>')).toBe("");
		});

		it("should preserve safe HTML", () => {
			const safeHtml = "<div>Safe content</div><p>More content</p>";
			expect(sanitizeHtml(safeHtml)).toBe(safeHtml);
		});
	});

	describe("validateAndSanitizeInput", () => {
		it("should validate and return sanitized input", () => {
			const schema = z.string().min(1);
			const result = validateAndSanitizeInput("test", schema);
			expect(result).toBe("test");
		});

		it("should throw error for invalid input", () => {
			const schema = z.string().min(5);
			expect(() => validateAndSanitizeInput("test", schema)).toThrow(
				"String must contain at least 5 character(s)",
			);
		});

		it("should throw generic error for non-zod errors", () => {
			const schema = {
				parse: () => {
					throw new Error("Custom error");
				},
			} as unknown as z.ZodSchema;

			expect(() => validateAndSanitizeInput("test", schema)).toThrow(
				"Custom error",
			);
		});
	});

	describe("containsSqlInjection", () => {
		it("should detect SQL injection patterns", () => {
			const sqlInjectionPatterns = [
				"SELECT * FROM users",
				"INSERT INTO users VALUES",
				"UPDATE users SET",
				"DELETE FROM users",
				"DROP TABLE users",
				"CREATE TABLE users",
				"ALTER TABLE users",
				"EXEC sp_help",
				"TRUNCATE TABLE users",
				"MERGE INTO users",
				"'; DROP TABLE users; --",
				"' OR 1=1 --",
				"' AND 1=1 --",
				"' OR 'a'='a'",
				"UNION SELECT",
				"JOIN users",
				"WHERE id=1",
				"FROM users",
				"INTO users",
				"VALUES (1,2,3)",
				'SET name="test"',
				"OR 1=1",
				"AND 1=1",
				"HAVING COUNT(*) > 0",
				"GROUP BY id",
				"ORDER BY name",
				"INFORMATION_SCHEMA.TABLES",
				"sys.tables",
				"pg_tables",
				"mysql.user",
			];

			for (const pattern of sqlInjectionPatterns) {
				expect(containsSqlInjection(pattern)).toBe(true);
			}
		});

		it("should not detect safe input", () => {
			const safeInputs = [
				"normal text",
				"user@example.com",
				"John Doe",
				"123 Main St",
			];

			for (const input of safeInputs) {
				expect(containsSqlInjection(input)).toBe(false);
			}
		});
	});

	describe("containsXSS", () => {
		it("should detect XSS patterns", () => {
			const xssPatterns = [
				'<script>alert("xss")</script>',
				'javascript:alert("xss")',
				'onclick=alert("xss")',
				'onload=alert("xss")',
				'<iframe src="malicious.html"></iframe>',
				'<object data="malicious.swf"></object>',
				'<embed src="malicious.swf">',
				'<form action="malicious.php"></form>',
				'<input type="text" onchange="alert(\'xss\')">',
				"<textarea onblur=\"alert('xss')\"></textarea>",
				"<select onfocus=\"alert('xss')\"></select>",
				"<button onclick=\"alert('xss')\"></button>",
				'<link rel="stylesheet" href="malicious.css">',
				'<meta http-equiv="refresh" content="0;url=malicious.html">',
				'<style>body{background:url(javascript:alert("xss"))}</style>',
				'expression(alert("xss"))',
				'url(javascript:alert("xss"))',
				'eval(alert("xss"))',
				'setTimeout(alert("xss"), 1000)',
				'setInterval(alert("xss"), 1000)',
			];

			for (const pattern of xssPatterns) {
				expect(containsXSS(pattern)).toBe(true);
			}
		});

		it("should not detect safe input", () => {
			const safeInputs = [
				"normal text",
				"<div>Safe content</div>",
				"<p>Paragraph</p>",
				"<span>Text</span>",
				"<strong>Bold</strong>",
				"<em>Italic</em>",
			];

			for (const input of safeInputs) {
				expect(containsXSS(input)).toBe(false);
			}
		});
	});

	describe("validateInput", () => {
		it("should validate email input", () => {
			const result = validateInput("test@example.com", "email");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe("test@example.com");
		});

		it("should validate password input", () => {
			const result = validateInput("Password123!", "password");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe("Password123!");
		});

		it("should validate name input", () => {
			const result = validateInput("John Doe", "name");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe("John Doe");
		});

		it("should validate database name input", () => {
			const result = validateInput("my_database", "database_name");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe("my_database");
		});

		it("should validate table name input", () => {
			const result = validateInput("users", "table_name");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe("users");
		});

		it("should validate column name input", () => {
			const result = validateInput("name", "column_name");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe("name");
		});

		it("should validate token name input", () => {
			const result = validateInput("api_token", "token_name");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe("api_token");
		});

		it("should validate tenant name input", () => {
			const result = validateInput("my_tenant", "tenant_name");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe("my_tenant");
		});

		it("should validate string input", () => {
			const result = validateInput("test string", "string");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe("test string");
		});

		it("should validate number input", () => {
			const result = validateInput(123, "number");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(123);
		});

		it("should validate boolean input", () => {
			const result = validateInput(true, "boolean");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(true);
		});

		it("should validate date input", () => {
			const result = validateInput("2023-01-01T00:00:00.000Z", "date");
			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBeInstanceOf(Date);
		});

		it("should reject unknown validation type", () => {
			const result = validateInput("test", "unknown");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("Unknown validation type");
		});

		it("should reject SQL injection attempts", () => {
			const result = validateInput("'; DROP TABLE users; --", "string");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("Invalid input detected");
		});

		it("should reject XSS attempts", () => {
			const result = validateInput('<script>alert("xss")</script>', "string");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("Invalid input detected");
		});

		it("should handle validation errors", () => {
			const result = validateInput("", "email");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("Invalid email format");
		});

		it("should handle non-zod errors", () => {
			const result = validateInput("invalid", "date");
			expect(result.isValid).toBe(false);
			expect(result.error).toBe("Invalid date format");
		});
	});
});
