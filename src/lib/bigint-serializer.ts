/**
 * BigInt Serialization Utilities
 * Handles safe serialization of objects containing BigInt values
 */

/**
 * Safely stringify an object that may contain BigInt values
 */
export function safeJsonStringify(obj: any): string {
	return JSON.stringify(obj, (key, value) => {
		if (typeof value === "bigint") {
			return value.toString();
		}
		return value;
	});
}

/**
 * Create a NextResponse with safe BigInt serialization
 */
export function createSafeJsonResponse(data: any, status: number = 200) {
	return new Response(safeJsonStringify(data), {
		status,
		headers: {
			"Content-Type": "application/json",
		},
	});
}

/**
 * Replacer function for JSON.stringify that handles BigInt
 */
export function bigIntReplacer(key: string, value: any): any {
	if (typeof value === "bigint") {
		return value.toString();
	}
	return value;
}

