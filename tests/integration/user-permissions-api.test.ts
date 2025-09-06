/** @format */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/tenants/[tenantId]/users/[userId]/permisions/route";
import { PATCH as PATCH_USER, DELETE as DELETE_USER } from "@/app/api/tenants/[tenantId]/users/[userId]/route";
import prisma from "@/lib/prisma";
import { checkPlanPermission } from "@/lib/planConstants";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
	default: {
		user: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		tablePermission: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		columnPermission: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		tenant: {
			findFirst: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

// Mock session functions
vi.mock("@/lib/session", () => ({
	requireAuthResponse: vi.fn(),
	requireTenantAccess: vi.fn(),
	getUserId: vi.fn(),
}));

// Mock plan constants
vi.mock("@/lib/planConstants", () => ({
	checkPlanPermission: vi.fn(),
}));

// Mock transaction manager
vi.mock("@/lib/transaction-manager", () => ({
	deleteUserTransaction: vi.fn(),
}));

describe("User Permissions API", () => {
	const mockUser = {
		id: 1,
		email: "admin@test.com",
		firstName: "Admin",
		lastName: "User",
		role: "ADMIN",
		tenantId: 1,
		subscriptionPlan: "Pro",
	};

	const mockTenant = {
		id: 1,
		name: "Test Tenant",
		adminId: 1,
	};

	const mockTablePermission = {
		id: 1,
		userId: 2,
		tableId: 1,
		tenantId: 1,
		canRead: true,
		canEdit: false,
		canDelete: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		table: {
			id: 1,
			name: "Test Table",
			database: {
				id: 1,
				name: "Test Database",
			},
		},
	};

	const mockColumnPermission = {
		id: 1,
		userId: 2,
		columnId: 1,
		tableId: 1,
		tenantId: 1,
		canRead: true,
		canEdit: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		column: {
			id: 1,
			name: "Name",
			type: "text",
			table: {
				id: 1,
				name: "Test Table",
				database: {
					id: 1,
					name: "Test Database",
				},
			},
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		
		// Mock session functions
		const { requireAuthResponse, requireTenantAccess, getUserId } = require("@/lib/session");
		requireAuthResponse.mockResolvedValue({
			user: mockUser,
		});
		requireTenantAccess.mockReturnValue(null);
		getUserId.mockReturnValue(1);

		// Mock plan permission check
		checkPlanPermission.mockReturnValue(true);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("GET /api/tenants/[tenantId]/users/[userId]/permisions", () => {
		it("returns permissions for valid user", async () => {
			prisma.user.findUnique.mockResolvedValue(mockUser);
			prisma.tablePermission.findMany.mockResolvedValue([mockTablePermission]);
			prisma.columnPermission.findMany.mockResolvedValue([mockColumnPermission]);

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2/permisions");
			const response = await GET(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.tablePermissions).toHaveLength(1);
			expect(data.columnsPermissions).toHaveLength(1);
		});

		it("returns 403 for insufficient plan", async () => {
			checkPlanPermission.mockReturnValue(false);
			prisma.user.findUnique.mockResolvedValue({
				...mockUser,
				subscriptionPlan: "Free",
			});

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2/permisions");
			const response = await GET(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(403);
			const data = await response.json();
			expect(data.error).toContain("Permission management is not available");
		});

		it("returns 401 for unauthorized access", async () => {
			const { requireAuthResponse } = require("@/lib/session");
			requireAuthResponse.mockResolvedValue({
				user: { ...mockUser, role: "EDITOR" },
			});

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2/permisions");
			const response = await GET(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(401);
		});

		it("returns 404 for non-existent user", async () => {
			prisma.user.findUnique.mockResolvedValue(null);

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2/permisions");
			const response = await GET(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(404);
		});
	});

	describe("PATCH /api/tenants/[tenantId]/users/[userId]/permisions", () => {
		it("updates permissions successfully", async () => {
			prisma.tablePermission.findFirst.mockResolvedValue(mockTablePermission);
			prisma.columnPermission.findFirst.mockResolvedValue(mockColumnPermission);
			prisma.tablePermission.update.mockResolvedValue(mockTablePermission);
			prisma.columnPermission.update.mockResolvedValue(mockColumnPermission);

			const requestBody = {
				tablePermissions: [mockTablePermission],
				columnsPermissions: [mockColumnPermission],
			};

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2/permisions", {
				method: "PATCH",
				body: JSON.stringify(requestBody),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const response = await PATCH(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(200);
			expect(prisma.tablePermission.update).toHaveBeenCalled();
			expect(prisma.columnPermission.update).toHaveBeenCalled();
		});

		it("creates new permissions when they don't exist", async () => {
			prisma.tablePermission.findFirst.mockResolvedValue(null);
			prisma.columnPermission.findFirst.mockResolvedValue(null);
			prisma.tablePermission.create.mockResolvedValue(mockTablePermission);
			prisma.columnPermission.create.mockResolvedValue(mockColumnPermission);

			const requestBody = {
				tablePermissions: [mockTablePermission],
				columnsPermissions: [mockColumnPermission],
			};

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2/permisions", {
				method: "PATCH",
				body: JSON.stringify(requestBody),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const response = await PATCH(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(200);
			expect(prisma.tablePermission.create).toHaveBeenCalled();
			expect(prisma.columnPermission.create).toHaveBeenCalled();
		});

		it("returns 400 for invalid request body", async () => {
			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2/permisions", {
				method: "PATCH",
				body: JSON.stringify({}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const response = await PATCH(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(400);
		});

		it("returns 401 for non-admin users", async () => {
			const { requireAuthResponse } = require("@/lib/session");
			requireAuthResponse.mockResolvedValue({
				user: { ...mockUser, role: "EDITOR" },
			});

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2/permisions", {
				method: "PATCH",
				body: JSON.stringify({
					tablePermissions: [],
					columnsPermissions: [],
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const response = await PATCH(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(401);
		});
	});

	describe("DELETE /api/tenants/[tenantId]/users/[userId]", () => {
		it("deletes user successfully", async () => {
			const { deleteUserTransaction } = require("@/lib/transaction-manager");
			deleteUserTransaction.mockResolvedValue({ success: true });

			prisma.user.findUnique.mockResolvedValue({
				...mockUser,
				id: 2,
				role: "EDITOR",
			});

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2", {
				method: "DELETE",
			});

			const response = await DELETE_USER(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(200);
			expect(deleteUserTransaction).toHaveBeenCalledWith(2);
		});

		it("deletes entire tenant when deleting admin user", async () => {
			prisma.user.findUnique.mockResolvedValue({
				...mockUser,
				id: 2,
				role: "ADMIN",
			});
			prisma.tenant.findFirst.mockResolvedValue(mockTenant);
			prisma.tenant.delete.mockResolvedValue(mockTenant);

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2", {
				method: "DELETE",
			});

			const response = await DELETE_USER(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(200);
			expect(prisma.tenant.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			});
		});

		it("returns 404 for non-existent user", async () => {
			prisma.user.findUnique.mockResolvedValue(null);

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2", {
				method: "DELETE",
			});

			const response = await DELETE_USER(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(404);
		});

		it("returns 401 for non-admin trying to delete other users", async () => {
			const { requireAuthResponse } = require("@/lib/session");
			requireAuthResponse.mockResolvedValue({
				user: { ...mockUser, role: "EDITOR" },
			});

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2", {
				method: "DELETE",
			});

			const response = await DELETE_USER(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(401);
		});

		it("allows self-deletion for any user", async () => {
			const { deleteUserTransaction } = require("@/lib/transaction-manager");
			deleteUserTransaction.mockResolvedValue({ success: true });

			prisma.user.findUnique.mockResolvedValue({
				...mockUser,
				id: 1,
				role: "EDITOR",
			});

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/1", {
				method: "DELETE",
			});

			const response = await DELETE_USER(request, {
				params: Promise.resolve({ tenantId: "1", userId: "1" }),
			});

			expect(response.status).toBe(200);
			expect(deleteUserTransaction).toHaveBeenCalledWith(1);
		});
	});

	describe("PATCH /api/tenants/[tenantId]/users/[userId]", () => {
		it("updates user successfully", async () => {
			prisma.user.findFirst.mockResolvedValue(mockUser);
			prisma.user.update.mockResolvedValue({
				...mockUser,
				firstName: "Updated",
			});

			const requestBody = {
				firstName: "Updated",
			};

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2", {
				method: "PATCH",
				body: JSON.stringify(requestBody),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const response = await PATCH_USER(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(200);
			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: 2 },
				data: requestBody,
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					role: true,
				},
			});
		});

		it("returns 404 for non-existent user", async () => {
			prisma.user.findFirst.mockResolvedValue(null);

			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2", {
				method: "PATCH",
				body: JSON.stringify({ firstName: "Updated" }),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const response = await PATCH_USER(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(404);
		});

		it("returns 400 for invalid fields", async () => {
			const request = new NextRequest("http://localhost:3000/api/tenants/1/users/2", {
				method: "PATCH",
				body: JSON.stringify({ invalidField: "value" }),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const response = await PATCH_USER(request, {
				params: Promise.resolve({ tenantId: "1", userId: "2" }),
			});

			expect(response.status).toBe(400);
		});
	});
});
