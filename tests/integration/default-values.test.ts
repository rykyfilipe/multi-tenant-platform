import { NextRequest } from "next/server";
import { POST as createRow } from "@/app/api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/rows/route";
import prisma from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
	database: {
		findFirst: jest.fn(),
	},
	table: {
		findFirst: jest.fn(),
	},
	row: {
		count: jest.fn(),
		create: jest.fn(),
	},
	cell: {
		createMany: jest.fn(),
	},
	columnPermission: {
		findFirst: jest.fn(),
	},
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Mock auth functions
jest.mock("@/lib/session", () => ({
	requireAuthResponse: jest.fn().mockResolvedValue({
		user: { id: 1, role: "ADMIN" },
	}),
	requireTenantAccess: jest.fn().mockReturnValue(null),
	getUserId: jest.fn().mockReturnValue(1),
}));

jest.mock("@/lib/auth", () => ({
	checkTableEditPermission: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/lib/planLimits", () => ({
	checkPlanLimit: jest.fn().mockResolvedValue({ allowed: true, limit: 1000 }),
}));

jest.mock("@/lib/memory-middleware", () => ({
	updateMemoryAfterRowChange: jest.fn(),
}));

describe("Default Values in Row Creation", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		
		// Setup default mocks
		mockPrisma.database.findFirst.mockResolvedValue({
			id: 1,
			tenantId: 1,
			name: "Test Database",
		} as any);

		mockPrisma.row.count.mockResolvedValue(0);
		mockPrisma.row.create.mockResolvedValue({
			id: 1,
			tableId: 1,
		} as any);

		mockPrisma.cell.createMany.mockResolvedValue({} as any);
	});

	it("should apply default values for columns with defaultValue", async () => {
		// Mock table with columns that have default values
		mockPrisma.table.findFirst.mockResolvedValue({
			id: 1,
			databaseId: 1,
			name: "Test Table",
			columns: [
				{
					id: 1,
					name: "Name",
					type: "string",
					required: true,
					defaultValue: null,
				},
				{
					id: 2,
					name: "Status",
					type: "string",
					required: false,
					defaultValue: "active",
				},
				{
					id: 3,
					name: "Priority",
					type: "string",
					required: false,
					defaultValue: "medium",
				},
			],
		} as any);

		const rowData = {
			cells: [
				{
					columnId: 1,
					value: "Test Name",
				},
			],
		};

		const request = new NextRequest("http://localhost:3000", {
			method: "POST",
			body: JSON.stringify(rowData),
		});

		const response = await createRow(request, {
			params: Promise.resolve({
				tenantId: "1",
				databaseId: "1",
				tableId: "1",
			}),
		});

		expect(response.status).toBe(201);
		
		// Verify that cells were created with default values
		expect(mockPrisma.cell.createMany).toHaveBeenCalledWith({
			data: [
				{
					rowId: 1,
					columnId: 1,
					value: "Test Name",
				},
				{
					rowId: 1,
					columnId: 2,
					value: "active",
				},
				{
					rowId: 1,
					columnId: 3,
					value: "medium",
				},
			],
		});
	});

	it("should not override provided values with default values", async () => {
		mockPrisma.table.findFirst.mockResolvedValue({
			id: 1,
			databaseId: 1,
			name: "Test Table",
			columns: [
				{
					id: 1,
					name: "Name",
					type: "string",
					required: true,
					defaultValue: "Default Name",
				},
				{
					id: 2,
					name: "Status",
					type: "string",
					required: false,
					defaultValue: "active",
				},
			],
		} as any);

		const rowData = {
			cells: [
				{
					columnId: 1,
					value: "Custom Name",
				},
				{
					columnId: 2,
					value: "inactive",
				},
			],
		};

		const request = new NextRequest("http://localhost:3000", {
			method: "POST",
			body: JSON.stringify(rowData),
		});

		const response = await createRow(request, {
			params: Promise.resolve({
				tenantId: "1",
				databaseId: "1",
				tableId: "1",
			}),
		});

		expect(response.status).toBe(201);
		
		// Verify that provided values are used, not defaults
		expect(mockPrisma.cell.createMany).toHaveBeenCalledWith({
			data: [
				{
					rowId: 1,
					columnId: 1,
					value: "Custom Name",
				},
				{
					rowId: 1,
					columnId: 2,
					value: "inactive",
				},
			],
		});
	});

	it("should handle columns without default values", async () => {
		mockPrisma.table.findFirst.mockResolvedValue({
			id: 1,
			databaseId: 1,
			name: "Test Table",
			columns: [
				{
					id: 1,
					name: "Name",
					type: "string",
					required: true,
					defaultValue: null,
				},
				{
					id: 2,
					name: "Description",
					type: "string",
					required: false,
					defaultValue: null,
				},
			],
		} as any);

		const rowData = {
			cells: [
				{
					columnId: 1,
					value: "Test Name",
				},
			],
		};

		const request = new NextRequest("http://localhost:3000", {
			method: "POST",
			body: JSON.stringify(rowData),
		});

		const response = await createRow(request, {
			params: Promise.resolve({
				tenantId: "1",
				databaseId: "1",
				tableId: "1",
			}),
		});

		expect(response.status).toBe(201);
		
		// Verify that only provided cells are created
		expect(mockPrisma.cell.createMany).toHaveBeenCalledWith({
			data: [
				{
					rowId: 1,
					columnId: 1,
					value: "Test Name",
				},
			],
		});
	});

	it("should handle mixed default and non-default columns", async () => {
		mockPrisma.table.findFirst.mockResolvedValue({
			id: 1,
			databaseId: 1,
			name: "Test Table",
			columns: [
				{
					id: 1,
					name: "Name",
					type: "string",
					required: true,
					defaultValue: null,
				},
				{
					id: 2,
					name: "Status",
					type: "string",
					required: false,
					defaultValue: "active",
				},
				{
					id: 3,
					name: "Description",
					type: "string",
					required: false,
					defaultValue: null,
				},
				{
					id: 4,
					name: "Priority",
					type: "string",
					required: false,
					defaultValue: "medium",
				},
			],
		} as any);

		const rowData = {
			cells: [
				{
					columnId: 1,
					value: "Test Name",
				},
				{
					columnId: 3,
					value: "Custom Description",
				},
			],
		};

		const request = new NextRequest("http://localhost:3000", {
			method: "POST",
			body: JSON.stringify(rowData),
		});

		const response = await createRow(request, {
			params: Promise.resolve({
				tenantId: "1",
				databaseId: "1",
				tableId: "1",
			}),
		});

		expect(response.status).toBe(201);
		
		// Verify that default values are applied only for columns with defaultValue
		expect(mockPrisma.cell.createMany).toHaveBeenCalledWith({
			data: [
				{
					rowId: 1,
					columnId: 1,
					value: "Test Name",
				},
				{
					rowId: 1,
					columnId: 2,
					value: "active",
				},
				{
					rowId: 1,
					columnId: 3,
					value: "Custom Description",
				},
				{
					rowId: 1,
					columnId: 4,
					value: "medium",
				},
			],
		});
	});
});
