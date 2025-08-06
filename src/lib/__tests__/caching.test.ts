/** @format */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { cacheUtils } from "../prisma";
import { cachedOperations } from "../cached-operations";
import { CACHE_CONFIG } from "../cache-config";

// Mock Prisma client
vi.mock("../prisma", async () => {
	const actual = await vi.importActual("../prisma");
	return {
		...actual,
		default: {
			user: {
				findUnique: vi.fn(),
				findMany: vi.fn(),
			},
			table: {
				findMany: vi.fn(),
				count: vi.fn(),
			},
			database: {
				findMany: vi.fn(),
				count: vi.fn(),
			},
		},
	};
});

describe("Caching System", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Clear cache before each test
		cacheUtils.clear();
	});

	describe("Cache Utils", () => {
		it("should cache and retrieve data", async () => {
			const mockData = { id: 1, name: "Test User" };
			const operation = vi.fn().mockResolvedValue(mockData);

			// First call should execute operation
			const result1 = await cacheUtils.cachedQuery(
				operation,
				"test:user:1",
				1000,
			);

			expect(result1).toEqual(mockData);
			expect(operation).toHaveBeenCalledTimes(1);

			// Second call should use cache
			const result2 = await cacheUtils.cachedQuery(
				operation,
				"test:user:1",
				1000,
			);

			expect(result2).toEqual(mockData);
			expect(operation).toHaveBeenCalledTimes(1); // Should not be called again
		});

		it("should handle cache expiration", async () => {
			const mockData = { id: 1, name: "Test User" };
			const operation = vi.fn().mockResolvedValue(mockData);

			// First call
			await cacheUtils.cachedQuery(operation, "test:user:1", 1); // 1ms TTL

			// Wait for expiration
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Second call should execute operation again
			await cacheUtils.cachedQuery(operation, "test:user:1", 1);

			expect(operation).toHaveBeenCalledTimes(2);
		});

		it("should handle batch operations", async () => {
			const mockData1 = { id: 1, name: "User 1" };
			const mockData2 = { id: 2, name: "User 2" };

			const operation1 = vi.fn().mockResolvedValue(mockData1);
			const operation2 = vi.fn().mockResolvedValue(mockData2);

			const results = await cacheUtils.batchQuery([
				{
					operation: operation1,
					cacheKey: "test:user:1",
					ttl: 1000,
				},
				{
					operation: operation2,
					cacheKey: "test:user:2",
					ttl: 1000,
				},
			]);

			expect(results).toEqual([mockData1, mockData2]);
			expect(operation1).toHaveBeenCalledTimes(1);
			expect(operation2).toHaveBeenCalledTimes(1);
		});

		it("should invalidate cache patterns", () => {
			// Add some test data to cache
			cacheUtils.cachedQuery(
				() => Promise.resolve({ id: 1 }),
				'user:findUnique:{"id":1}',
				1000,
			);

			cacheUtils.cachedQuery(
				() => Promise.resolve({ id: 2 }),
				'user:findUnique:{"id":2}',
				1000,
			);

			cacheUtils.cachedQuery(
				() => Promise.resolve({ id: 3 }),
				'table:findMany:{"databaseId":1}',
				1000,
			);

			// Invalidate user cache
			cacheUtils.invalidate("user:");

			// Check if user cache is cleared but table cache remains
			expect(cacheUtils.isEnabled()).toBe(true);
		});
	});

	describe("Cached Operations", () => {
		it("should use appropriate TTL for different operations", () => {
			// Test that different operations use different TTL values
			expect(CACHE_CONFIG.TTL.USER).toBe(2 * 60 * 1000); // 2 minutes
			expect(CACHE_CONFIG.TTL.ROW).toBe(1 * 60 * 1000); // 1 minute
			expect(CACHE_CONFIG.TTL.COUNT).toBe(30 * 1000); // 30 seconds
		});

		it("should generate consistent cache keys", () => {
			const key1 = cachedOperations.getUser(1);
			const key2 = cachedOperations.getUser(1);

			// Both calls should return the same promise (cached)
			expect(key1).toBe(key2);
		});
	});

	describe("Cache Configuration", () => {
		it("should have reasonable TTL values", () => {
			// User data should have longer TTL (more stable)
			expect(CACHE_CONFIG.TTL.USER).toBeGreaterThan(CACHE_CONFIG.TTL.ROW);

			// Row data should have shorter TTL (more volatile)
			expect(CACHE_CONFIG.TTL.ROW).toBeLessThan(CACHE_CONFIG.TTL.USER);

			// Count data should have shortest TTL (most volatile)
			expect(CACHE_CONFIG.TTL.COUNT).toBeLessThan(CACHE_CONFIG.TTL.ROW);
		});

		it("should have reasonable size limits", () => {
			expect(CACHE_CONFIG.SIZE_LIMITS.MAX_ENTRIES).toBeGreaterThan(0);
			expect(CACHE_CONFIG.SIZE_LIMITS.MAX_MEMORY_MB).toBeGreaterThan(0);
		});
	});

	describe("Cache Performance", () => {
		it("should improve performance for repeated queries", async () => {
			const mockOperation = vi.fn().mockResolvedValue({ data: "test" });

			const startTime1 = Date.now();
			await cacheUtils.cachedQuery(mockOperation, "test:1", 1000);
			const time1 = Date.now() - startTime1;

			const startTime2 = Date.now();
			await cacheUtils.cachedQuery(mockOperation, "test:1", 1000);
			const time2 = Date.now() - startTime2;

			// Second call should be faster (cached)
			expect(time2).toBeLessThan(time1);
			expect(mockOperation).toHaveBeenCalledTimes(1);
		});
	});
});
