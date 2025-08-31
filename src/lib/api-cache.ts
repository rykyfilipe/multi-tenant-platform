/** @format */

// Prisma Accelerate Cache Integration
// This file now provides utilities for working with Prisma Accelerate cache
// instead of external caching systems

import { DEFAULT_CACHE_STRATEGIES, type CacheStrategy } from "./prisma";

// Cache operation types for Prisma Accelerate
export const CACHE_OPERATIONS = {
	FIND_UNIQUE: "findUnique",
	FIND_MANY: "findMany",
	FIND_FIRST: "findFirst",
	COUNT: "count",
	CREATE: "create",
	UPDATE: "update",
	DELETE: "delete",
	UPSERT: "upsert",
	AGGREGATE: "aggregate",
};

// Cache prefixes for different entity types
export const CACHE_PREFIXES = {
	USER: "user",
	TENANT: "tenant",
	DATABASE: "database",
	TABLE: "table",
	COLUMN: "column",
	ROW: "row",
	CELL: "cell",
	PERMISSION: "permission",
	DASHBOARD: "dashboard",
	WIDGET: "widget",
	INVOICE: "invoice",
	COUNT: "count",
};

// Helper function to get TTL for specific operation
export function getTTL(operation: string, entity: string): number {
	const operationKey = operation.toUpperCase();
	const entityKey = entity.toLowerCase();

	// Get the appropriate cache strategy
	const strategy =
		DEFAULT_CACHE_STRATEGIES[entityKey] ||
		DEFAULT_CACHE_STRATEGIES[entityKey + "List"] ||
		DEFAULT_CACHE_STRATEGIES.rowList;

	return strategy.ttl;
}

// Helper function to get SWR for specific operation
export function getSWR(operation: string, entity: string): number {
	const operationKey = operation.toUpperCase();
	const entityKey = entity.toLowerCase();

	// Get the appropriate cache strategy
	const strategy =
		DEFAULT_CACHE_STRATEGIES[entityKey] ||
		DEFAULT_CACHE_STRATEGIES[entityKey + "List"] ||
		DEFAULT_CACHE_STRATEGIES.rowList;

	return strategy.swr;
}

// Helper function to get cache tags for specific operation
export function getCacheTags(operation: string, entity: string): string[] {
	const operationKey = operation.toUpperCase();
	const entityKey = entity.toLowerCase();

	// Get the appropriate cache strategy
	const strategy =
		DEFAULT_CACHE_STRATEGIES[entityKey] ||
		DEFAULT_CACHE_STRATEGIES[entityKey + "List"] ||
		DEFAULT_CACHE_STRATEGIES.rowList;

	return strategy.tags || [];
}

// Cache key generator for Prisma Accelerate
export function generateCacheKey(
	operation: string,
	entity: string,
	params: any,
): string {
	const paramsHash = Buffer.from(JSON.stringify(params))
		.toString("base64")
		.slice(0, 16);
	return `${operation}:${entity}:${paramsHash}`;
}

// Cache invalidation patterns for Prisma Accelerate
export const CACHE_INVALIDATION_PATTERNS = {
	// User-related patterns
	userCreated: (userId: number) => [`user.${userId}`, `user.list`],
	userUpdated: (userId: number) => [`user.${userId}`, `user.list`],
	userDeleted: (userId: number) => [
		`user.${userId}`,
		`user.list`,
		`user.count`,
	],

	// Tenant-related patterns
	tenantUpdated: (tenantId: number) => [
		`tenant.${tenantId}`,
		`database.${tenantId}`,
		`table.${tenantId}`,
		`user.${tenantId}`,
		`database.count.${tenantId}`,
		`table.count.${tenantId}`,
		`user.count.${tenantId}`,
		`row.count.${tenantId}`,
	],

	// Database-related patterns
	databaseCreated: (databaseId: number, tenantId: number) => [
		`database.${databaseId}`,
		`database.list.${tenantId}`,
		`database.count.${tenantId}`,
	],
	databaseUpdated: (databaseId: number, tenantId: number) => [
		`database.${databaseId}`,
		`database.list.${tenantId}`,
	],
	databaseDeleted: (databaseId: number, tenantId: number) => [
		`database.${databaseId}`,
		`database.list.${tenantId}`,
		`database.count.${tenantId}`,
		`table.${databaseId}`,
		`table.count.${tenantId}`,
	],

	// Table-related patterns
	tableCreated: (tableId: number, databaseId: number) => [
		`table.${tableId}`,
		`table.list.${databaseId}`,
		`table.count.${databaseId}`,
	],
	tableUpdated: (tableId: number, databaseId: number) => [
		`table.${tableId}`,
		`table.list.${databaseId}`,
	],
	tableDeleted: (tableId: number, databaseId: number) => [
		`table.${tableId}`,
		`table.list.${databaseId}`,
		`table.count.${databaseId}`,
		`row.${tableId}`,
		`column.${tableId}`,
	],

	// Row-related patterns
	rowCreated: (tableId: number) => [`row.${tableId}`, `row.count.${tableId}`],
	rowUpdated: (tableId: number) => [`row.${tableId}`],
	rowDeleted: (tableId: number) => [`row.${tableId}`, `row.count.${tableId}`],

	// Column-related patterns
	columnCreated: (tableId: number) => [
		`column.${tableId}`,
		`column.list.${tableId}`,
	],
	columnUpdated: (tableId: number) => [
		`column.${tableId}`,
		`column.list.${tableId}`,
	],
	columnDeleted: (tableId: number) => [
		`column.${tableId}`,
		`column.list.${tableId}`,
	],

	// Cell-related patterns
	cellUpdated: (rowId: number, columnId: number) => [
		`cell.${rowId}.${columnId}`,
	],
	cellDeleted: (rowId: number, columnId: number) => [
		`cell.${rowId}.${columnId}`,
	],
};

// Export the enhanced cached operations that use Prisma Accelerate
export const enhancedCachedOperations = {
	// User operations with Prisma Accelerate cache
	getUser: async (userId: number, prisma: any) => {
		return await prisma.findUniqueWithCache(
			prisma.user,
			{
				where: { id: userId },
				select: {
					id: true,
					email: true,
					name: true,
					role: true,
					tenantId: true,
					createdAt: true,
					updatedAt: true,
				},
			},
			DEFAULT_CACHE_STRATEGIES.user,
		);
	},

	// Table operations with Prisma Accelerate cache
	getTable: async (tableId: number, prisma: any) => {
		return await prisma.findUniqueWithCache(
			prisma.table,
			{
				where: { id: tableId },
				include: {
					columns: {
						orderBy: { order: "asc" },
					},
				},
			},
			DEFAULT_CACHE_STRATEGIES.table,
		);
	},

	// Row operations with Prisma Accelerate cache
	getTableRows: async (
		tableId: number,
		page: number = 1,
		pageSize: number = 25,
		filters?: any,
		prisma: any,
	) => {
		const skip = (page - 1) * pageSize;

		// Get total count and rows in parallel with Prisma Accelerate cache
		const [totalRows, rows] = await Promise.all([
			prisma.countWithCache(
				prisma.row,
				{ where: { tableId } },
				DEFAULT_CACHE_STRATEGIES.count,
			),
			prisma.findManyWithCache(
				prisma.row,
				{
					where: { tableId },
					include: { cells: { include: { column: true } } },
					skip,
					take: pageSize,
					orderBy: { createdAt: "asc" },
				},
				DEFAULT_CACHE_STRATEGIES.rowList,
			),
		]);

		return {
			data: rows,
			pagination: {
				page,
				pageSize,
				totalRows,
				totalPages: Math.ceil(totalRows / pageSize),
				hasNext: page * pageSize < totalRows,
				hasPrev: page > 1,
			},
		};
	},

	// User permissions caching with Prisma Accelerate
	getUserPermissions: async (userId: number, tableId: number, prisma: any) => {
		return await prisma.findUniqueWithCache(
			prisma.tablePermission,
			{
				where: {
					userId_tableId: {
						userId,
						tableId,
					},
				},
			},
			DEFAULT_CACHE_STRATEGIES.permission,
		);
	},

	// Database operations with Prisma Accelerate cache
	getDatabases: async (tenantId: number, prisma: any) => {
		return await prisma.findManyWithCache(
			prisma.database,
			{
				where: { tenantId },
				include: {
					tables: {
						include: {
							columns: true,
						},
					},
				},
			},
			DEFAULT_CACHE_STRATEGIES.databaseList,
		);
	},

	// Table list operations with Prisma Accelerate cache
	getTables: async (databaseId: number, prisma: any) => {
		return await prisma.findManyWithCache(
			prisma.table,
			{
				where: { databaseId },
				include: {
					columns: {
						orderBy: { order: "asc" },
					},
				},
			},
			DEFAULT_CACHE_STRATEGIES.tableList,
		);
	},
};

// Export the main operations object
export const apiCache = enhancedCachedOperations;
