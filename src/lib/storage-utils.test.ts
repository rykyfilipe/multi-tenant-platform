/** @format */

/**
 * Test file for storage utilities
 * Run with: npx jest src/lib/storage-utils.test.ts
 */

import {
	convertMBToBytes,
	convertMBToKB,
	convertBytesToMB,
	convertBytesToKB,
	formatStorageSize,
	getStorageLimitBytes,
	checkStorageLimit,
} from "./storage-utils";

describe("Storage Utilities", () => {
	describe("convertMBToBytes", () => {
		it("should convert 1 MB to 1,048,576 bytes", () => {
			expect(convertMBToBytes(1)).toBe(1024 * 1024);
		});

		it("should convert 10 MB to 10,485,760 bytes", () => {
			expect(convertMBToBytes(10)).toBe(10 * 1024 * 1024);
		});

		it("should convert 1 GB (1024 MB) to 1,073,741,824 bytes", () => {
			expect(convertMBToBytes(1024)).toBe(1024 * 1024 * 1024);
		});
	});

	describe("convertMBToKB", () => {
		it("should convert 1 MB to 1,024 KB", () => {
			expect(convertMBToKB(1)).toBe(1024);
		});

		it("should convert 10 MB to 10,240 KB", () => {
			expect(convertMBToKB(10)).toBe(10 * 1024);
		});
	});

	describe("convertBytesToMB", () => {
		it("should convert 1,048,576 bytes to 1 MB", () => {
			expect(convertBytesToMB(1024 * 1024)).toBe(1);
		});

		it("should convert 10,485,760 bytes to 10 MB", () => {
			expect(convertBytesToMB(10 * 1024 * 1024)).toBe(10);
		});
	});

	describe("convertBytesToKB", () => {
		it("should convert 1,024 bytes to 1 KB", () => {
			expect(convertBytesToKB(1024)).toBe(1);
		});

		it("should convert 10,240 bytes to 10 KB", () => {
			expect(convertBytesToKB(10 * 1024)).toBe(10);
		});
	});

	describe("formatStorageSize", () => {
		it("should format bytes correctly", () => {
			expect(formatStorageSize(1024)).toBe("1.00 KB");
			expect(formatStorageSize(1024 * 1024)).toBe("1.00 MB");
			expect(formatStorageSize(1024 * 1024 * 1024)).toBe("1.00 GB");
		});

		it("should format small sizes correctly", () => {
			expect(formatStorageSize(512)).toBe("0.50 KB");
			expect(formatStorageSize(512 * 1024)).toBe("0.50 MB");
		});
	});

	describe("getStorageLimitBytes", () => {
		it("should return correct limits for each plan", () => {
			expect(getStorageLimitBytes("Free")).toBe(10 * 1024 * 1024); // 10 MB
			expect(getStorageLimitBytes("Pro")).toBe(1024 * 1024 * 1024); // 1 GB
			expect(getStorageLimitBytes("Enterprise")).toBe(10 * 1024 * 1024 * 1024); // 10 GB
		});

		it("should default to Free plan for unknown plans", () => {
			expect(getStorageLimitBytes("Unknown")).toBe(10 * 1024 * 1024);
			expect(getStorageLimitBytes(null)).toBe(10 * 1024 * 1024);
		});
	});

	describe("checkStorageLimit", () => {
		it("should correctly identify when storage is over limit", () => {
			const result = checkStorageLimit(11 * 1024 * 1024, "Free"); // 11 MB > 10 MB limit
			expect(result.isOverLimit).toBe(true);
			expect(result.usedMB).toBe(11);
			expect(result.limitMB).toBe(10);
		});

		it("should correctly identify when storage is near limit", () => {
			const result = checkStorageLimit(8 * 1024 * 1024, "Free"); // 8 MB = 80% of 10 MB
			expect(result.isNearLimit).toBe(true);
			expect(result.isOverLimit).toBe(false);
		});

		it("should correctly identify when storage is under limit", () => {
			const result = checkStorageLimit(5 * 1024 * 1024, "Free"); // 5 MB < 10 MB limit
			expect(result.isOverLimit).toBe(false);
			expect(result.isNearLimit).toBe(false);
		});
	});
});
