/** @format */

/**
 * Centralized security validation module
 * Consolidates all input validation, sanitization, and security checks
 */

// Enhanced SQL injection prevention
export function containsSqlInjection(input: string): boolean {
	const sqlPatterns = [
		/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|TRUNCATE|MERGE|UNION|JOIN|WHERE|FROM|INTO|VALUES|SET|HAVING|GROUP BY|ORDER BY)\b/i,
		/['";]/, // Single quotes, double quotes, semicolons
		/--/, // SQL comments
		/\/\*.*?\*\//g, // Multi-line SQL comments
		/\b(OR|AND)\s+\d+\s*=\s*\d+/i, // OR 1=1, AND 1=1 patterns
		/\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"]/i, // OR 'a'='a' patterns
		/\b(OR|AND)\s+\w+\s*=\s*\w+/i, // OR column=value patterns
		/\b(INFORMATION_SCHEMA|sys\.|pg_|mysql\.|sqlite_)\b/i, // Database system tables
		/\b(WAITFOR|DELAY|SLEEP|BENCHMARK)\b/i, // Time-based attacks
		/\b(LOAD_FILE|INTO OUTFILE|DUMPFILE)\b/i, // File operations
		/\b(USER|VERSION|DATABASE|SCHEMA)\b/i, // System functions
		/\b(CHAR|ASCII|HEX|UNHEX|CONCAT|SUBSTRING)\b/i, // String manipulation functions
		/\b(CAST|CONVERT|EXTRACT)\b/i, // Type conversion functions
		/\\\x[0-9A-Fa-f]{2}/, // Hex encoding
		/\\\d{1,3}/, // Octal encoding
		/%[0-9A-Fa-f]{2}/, // URL encoding
	];

	return sqlPatterns.some((pattern) => pattern.test(input));
}

// Enhanced XSS prevention
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
		/Function\s*\(/gi,
		/constructor\s*\(/gi,
		/prototype\s*\./gi,
		/__proto__/gi,
		/constructor\.constructor/gi,
		/document\.(write|writeln|cookie)/gi,
		/window\.(location|open|eval)/gi,
		/alert\s*\(/gi,
		/confirm\s*\(/gi,
		/prompt\s*\(/gi,
		/String\.fromCharCode/gi,
		/unescape\s*\(/gi,
		/decodeURI\s*\(/gi,
		/decodeURIComponent\s*\(/gi,
		/atob\s*\(/gi,
		/btoa\s*\(/gi,
	];

	return xssPatterns.some((pattern) => pattern.test(input));
}

// Path traversal detection
export function containsPathTraversal(input: string): boolean {
	const pathTraversalPatterns = [
		/\.\./g, // Directory traversal
		/\.\.\//, // Unix path traversal
		/\.\.\\/, // Windows path traversal
		/%2e%2e%2f/gi, // URL encoded traversal
		/%2e%2e%5c/gi, // URL encoded Windows traversal
		/\0/g, // Null byte injection
		/\/etc\/passwd/gi, // Common Unix system files
		/\/proc\/self\/environ/gi,
		/\/windows\/system32/gi, // Common Windows system paths
		/\/boot\.ini/gi,
	];

	return pathTraversalPatterns.some((pattern) => pattern.test(input));
}

// Command injection detection
export function containsCommandInjection(input: string): boolean {
	const commandInjectionPatterns = [
		/[;&|`$(){}[\]<>]/g, // Command separators and special chars
		/\b(cat|ls|dir|type|echo|pwd|whoami|id|uname|ps|netstat|ifconfig|ipconfig)\b/gi,
		/\b(rm|del|mkdir|rmdir|mv|cp|copy|wget|curl|nc|netcat)\b/gi,
		/\b(sh|bash|cmd|powershell|python|perl|php|ruby|node)\b/gi,
		/\\\x[0-9A-Fa-f]{2}/, // Hex encoding
		/%[0-9A-Fa-f]{2}/, // URL encoding
	];

	return commandInjectionPatterns.some((pattern) => pattern.test(input));
}

// LDAP injection detection
export function containsLDAPInjection(input: string): boolean {
	const ldapPatterns = [
		/[()&|!*]/g, // LDAP special characters
		/\\\*/, // Escaped asterisk
		/\\\(/, // Escaped parenthesis
		/\\\)/, // Escaped parenthesis
		/\\\&/, // Escaped ampersand
		/\\\|/, // Escaped pipe
		/\\\!/, // Escaped exclamation
	];

	return ldapPatterns.some((pattern) => pattern.test(input));
}

// NoSQL injection detection
export function containsNoSQLInjection(input: string): boolean {
	const nosqlPatterns = [
		/\$where/gi,
		/\$ne/gi,
		/\$gt/gi,
		/\$lt/gi,
		/\$gte/gi,
		/\$lte/gi,
		/\$regex/gi,
		/\$in/gi,
		/\$nin/gi,
		/\$exists/gi,
		/\$type/gi,
		/\$mod/gi,
		/\$all/gi,
		/\$size/gi,
		/\$elemMatch/gi,
		/\$not/gi,
		/\$or/gi,
		/\$and/gi,
		/\$nor/gi,
		/eval\s*\(/gi,
		/sleep\s*\(/gi,
	];

	return nosqlPatterns.some((pattern) => pattern.test(input));
}

// Comprehensive input sanitization
export function sanitizeInput(input: string): string {
	return input
		.replace(/[<>]/g, "") // Remove < and >
		.replace(/javascript:/gi, "") // Remove javascript: protocol
		.replace(/on\w+\s*=/gi, "") // Remove event handlers
		.replace(/data:/gi, "") // Remove data URLs
		.replace(/vbscript:/gi, "") // Remove vbscript
		.replace(/expression\s*\(/gi, "") // Remove CSS expressions
		.trim();
}

// HTML sanitization for rich text content
export function sanitizeHtml(input: string): string {
	return input
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
		.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
		.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
		.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
		.replace(/<input\b[^<]*(?:(?!\/>)<[^<]*)*\/?>/gi, "")
		.replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, "")
		.replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, "")
		.replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, "")
		.replace(/<link\b[^<]*(?:(?!\/>)<[^<]*)*\/?>/gi, "")
		.replace(/<meta\b[^<]*(?:(?!\/>)<[^<]*)*\/?>/gi, "")
		.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
		.replace(/javascript:/gi, "")
		.replace(/on\w+\s*=/gi, "")
		.replace(/expression\s*\(/gi, "")
		.replace(/url\s*\(/gi, "")
		.replace(/eval\s*\(/gi, "")
		.replace(/setTimeout\s*\(/gi, "")
		.replace(/setInterval\s*\(/gi, "");
}

// Comprehensive security validation
export interface SecurityValidationResult {
	isValid: boolean;
	threats: string[];
	sanitized: string;
}

export function validateSecurity(input: string): SecurityValidationResult {
	const threats: string[] = [];

	if (containsSqlInjection(input)) {
		threats.push("SQL_INJECTION");
	}

	if (containsXSS(input)) {
		threats.push("XSS");
	}

	if (containsPathTraversal(input)) {
		threats.push("PATH_TRAVERSAL");
	}

	if (containsCommandInjection(input)) {
		threats.push("COMMAND_INJECTION");
	}

	if (containsLDAPInjection(input)) {
		threats.push("LDAP_INJECTION");
	}

	if (containsNoSQLInjection(input)) {
		threats.push("NOSQL_INJECTION");
	}

	return {
		isValid: threats.length === 0,
		threats,
		sanitized: sanitizeInput(input),
	};
}

// File upload security validation
export function validateFileUpload(
	filename: string,
	content?: Buffer,
): SecurityValidationResult {
	const threats: string[] = [];

	// Check filename for path traversal
	if (containsPathTraversal(filename)) {
		threats.push("PATH_TRAVERSAL");
	}

	// Check for executable extensions
	const dangerousExtensions = [
		".exe",
		".bat",
		".cmd",
		".com",
		".pif",
		".scr",
		".vbs",
		".js",
		".jar",
		".sh",
		".py",
		".pl",
		".php",
		".asp",
		".aspx",
		".jsp",
		".rb",
	];

	if (dangerousExtensions.some((ext) => filename.toLowerCase().endsWith(ext))) {
		threats.push("EXECUTABLE_FILE");
	}

	// Check for double extensions
	if (/\.\w+\.\w+$/.test(filename)) {
		threats.push("DOUBLE_EXTENSION");
	}

	// Check content if provided
	if (content) {
		const contentStr = content.toString(
			"utf8",
			0,
			Math.min(content.length, 1024),
		);
		const securityCheck = validateSecurity(contentStr);
		threats.push(...securityCheck.threats);
	}

	return {
		isValid: threats.length === 0,
		threats,
		sanitized: sanitizeInput(filename),
	};
}

// Rate limiting helper
export interface RateLimitConfig {
	maxRequests: number;
	windowMs: number;
	skipSuccessfulRequests?: boolean;
	skipFailedRequests?: boolean;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
	identifier: string,
	config: RateLimitConfig,
): {
	allowed: boolean;
	remaining: number;
	resetTime: number;
	retryAfter?: number;
} {
	const now = Date.now();
	const key = identifier;
	const windowMs = config.windowMs;

	let entry = rateLimitStore.get(key);

	// Clean up expired entries
	if (entry && now > entry.resetTime) {
		rateLimitStore.delete(key);
		entry = undefined;
	}

	if (!entry) {
		entry = { count: 0, resetTime: now + windowMs };
		rateLimitStore.set(key, entry);
	}

	entry.count++;

	const allowed = entry.count <= config.maxRequests;
	const remaining = Math.max(0, config.maxRequests - entry.count);
	const retryAfter = allowed
		? undefined
		: Math.ceil((entry.resetTime - now) / 1000);

	return {
		allowed,
		remaining,
		resetTime: entry.resetTime,
		retryAfter,
	};
}

// Clean up rate limit store periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of rateLimitStore.entries()) {
		if (now > entry.resetTime) {
			rateLimitStore.delete(key);
		}
	}
}, 60000); // Clean up every minute
