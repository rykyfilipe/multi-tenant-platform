import { NextRequest } from "next/server";
import { POST as createColumns, GET as getColumns } from "@/app/api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/columns/route";
import { PATCH as updateColumn } from "@/app/api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/columns/[columnId]/route";
import prisma from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
	database: {
		findFirst: jest.fn(),
	},
	table: {
		findFirst: jest.fn(),
	},
	column: {
		create: jest.fn(),
		update: jest.fn(),
		findUnique: jest.fn(),
	},
	user: {
		findMany: jest.fn(),
	},
	tenant: {
		findUnique: jest.fn(),
	},
	columnPermission: {
		create: jest.fn(),
	},
	cell: {
		createMany: jest.fn(),
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

describe("Column Enhancements API", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		
		// Setup default mocks
		mockPrisma.database.findFirst.mockResolvedValue({
			id: 1,
			tenantId: 1,
			name: "Test Database",
		} as any);

		mockPrisma.table.findFirst.mockResolvedValue({
			id: 1,
			databaseId: 1,
			name: "Test Table",
			columns: [],
			rows: [],
		} as any);

		mockPrisma.user.findMany.mockResolvedValue([
			{ id: 1, role: "ADMIN" },
		] as any);

		mockPrisma.tenant.findUnique.mockResolvedValue({
			id: 1,
			adminOf: { subscriptionPlan: "Free" },
		} as any);
	});

	describe("POST /api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/columns", () => {
		it("should create column with description", async () => {
			const columnData = {
				columns: [{
					name: "Test Column",
					type: "string",
					description: "Test description",
					required: false,
					primary: false,
					unique: false,
					defaultValue: "default value",
				}],
			};

			mockPrisma.column.create.mockResolvedValue({
				id: 1,
				...columnData.columns[0],
				tableId: 1,
			} as any);

			mockPrisma.columnPermission.create.mockResolvedValue({} as any);
			mockPrisma.cell.createMany.mockResolvedValue({} as any);

			const request = new NextRequest("http://localhost:3000", {
				method: "POST",
				body: JSON.stringify(columnData),
			});

			const response = await createColumns(request, {
				params: Promise.resolve({
					tenantId: "1",
					databaseId: "1",
					tableId: "1",
				}),
			});

			expect(response.status).toBe(201);
			expect(mockPrisma.column.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					name: "Test Column",
					type: "string",
					description: "Test description",
					required: false,
					primary: false,
					unique: false,
					defaultValue: "default value",
					tableId: 1,
				}),
			});
		});

		it("should create column with unique constraint", async () => {
			const columnData = {
				columns: [{
					name: "Unique Column",
					type: "string",
					unique: true,
					required: false,
					primary: false,
				}],
			};

			mockPrisma.column.create.mockResolvedValue({
				id: 1,
				...columnData.columns[0],
				tableId: 1,
			} as any);

			mockPrisma.columnPermission.create.mockResolvedValue({} as any);
			mockPrisma.cell.createMany.mockResolvedValue({} as any);

			const request = new NextRequest("http://localhost:3000", {
				method: "POST",
				body: JSON.stringify(columnData),
			});

			const response = await createColumns(request, {
				params: Promise.resolve({
					tenantId: "1",
					databaseId: "1",
					tableId: "1",
				}),
			});

			expect(response.status).toBe(201);
			expect(mockPrisma.column.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					unique: true,
				}),
			});
		});

		it("should apply default value to existing rows", async () => {
			const columnData = {
				columns: [{
					name: "Default Column",
					type: "string",
					defaultValue: "default value",
				}],
			};

			mockPrisma.table.findFirst.mockResolvedValue({
				id: 1,
				databaseId: 1,
				name: "Test Table",
				columns: [],
				rows: [{ id: 1 }, { id: 2 }],
			} as any);

			mockPrisma.column.create.mockResolvedValue({
				id: 1,
				...columnData.columns[0],
				tableId: 1,
			} as any);

			mockPrisma.columnPermission.create.mockResolvedValue({} as any);
			mockPrisma.cell.createMany.mockResolvedValue({} as any);

			const request = new NextRequest("http://localhost:3000", {
				method: "POST",
				body: JSON.stringify(columnData),
			});

			const response = await createColumns(request, {
				params: Promise.resolve({
					tenantId: "1",
					databaseId: "1",
					tableId: "1",
				}),
			});

			expect(response.status).toBe(201);
			expect(mockPrisma.cell.createMany).toHaveBeenCalledWith({
				data: [
					{ rowId: 1, columnId: 1, value: "default value" },
					{ rowId: 2, columnId: 1, value: "default value" },
				],
			});
		});
	});

	describe("PATCH /api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/columns/[columnId]", () => {
		it("should update column with new fields", async () => {
			const updateData = {
				name: "Updated Column",
				description: "Updated description",
				unique: true,
				defaultValue: "new default",
			};

			mockPrisma.column.findUnique.mockResolvedValue({
				isLocked: false,
			} as any);

			mockPrisma.column.update.mockResolvedValue({
				id: 1,
				...updateData,
			} as any);

			const request = new NextRequest("http://localhost:3000", {
				method: "PATCH",
				body: JSON.stringify(updateData),
			});

			const response = await updateColumn(request, {
				params: Promise.resolve({
					tenantId: "1",
					databaseId: "1",
					tableId: "1",
					columnId: "1",
				}),
			});

			expect(response.status).toBe(200);
			expect(mockPrisma.column.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: expect.objectContaining({
					name: "Updated Column",
					description: "Updated description",
					unique: true,
					defaultValue: "new default",
				}),
			});
		});

		it("should not update locked columns", async () => {
			mockPrisma.column.findUnique.mockResolvedValue({
				isLocked: true,
			} as any);

			const request = new NextRequest("http://localhost:3000", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated Column" }),
			});

			const response = await updateColumn(request, {
				params: Promise.resolve({
					tenantId: "1",
					databaseId: "1",
					tableId: "1",
					columnId: "1",
				}),
			});

			expect(response.status).toBe(403);
			const responseData = await response.json();
			expect(responseData.error).toContain("Cannot modify locked column");
		});
	});
});
