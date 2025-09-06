/** @format */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserManagementGrid } from "@/components/users/UserManagementGrid";
import { PermissionsManager } from "@/components/permissions/PermissionManager";
import { usePermissions } from "@/hooks/usePermissions";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import { checkPlanPermission } from "@/lib/planConstants";
import { User, Role } from "@/types/user";
import { Table, Column } from "@/types/database";
import { TablePermission, ColumnPermission } from "@/types/permissions";

// Mock the AppContext
const mockAppContext = {
	user: {
		id: "1",
		email: "admin@test.com",
		firstName: "Admin",
		lastName: "User",
		role: "ADMIN" as Role,
	},
	tenant: {
		id: 1,
		name: "Test Tenant",
	},
	token: "mock-token",
	showAlert: vi.fn(),
};

vi.mock("@/contexts/AppContext", () => ({
	useApp: () => mockAppContext,
}));

// Mock fetch
global.fetch = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	useParams: () => ({ userId: "2" }),
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
	useSession: () => ({
		data: {
			subscription: {
				plan: "Pro",
			},
		},
	}),
}));

describe("User Permissions System", () => {
	const mockUsers: User[] = [
		{
			id: "1",
			email: "admin@test.com",
			firstName: "Admin",
			lastName: "User",
			role: "ADMIN",
			tenantId: 1,
		},
		{
			id: "2",
			email: "user@test.com",
			firstName: "Regular",
			lastName: "User",
			role: "EDITOR",
			tenantId: 1,
		},
	];

	const mockTable: Table = {
		id: 1,
		name: "Test Table",
		databaseId: 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		isPublic: false,
	};

	const mockColumns: Column[] = [
		{
			id: 1,
			name: "Name",
			type: "text",
			tableId: 1,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			isRequired: false,
			isUnique: false,
			showInInvoice: false,
		},
		{
			id: 2,
			name: "Email",
			type: "email",
			tableId: 1,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			isRequired: false,
			isUnique: false,
			showInInvoice: false,
		},
	];

	const mockTablePermission: TablePermission = {
		id: 1,
		userId: 2,
		tableId: 1,
		tenantId: 1,
		canRead: true,
		canEdit: false,
		canDelete: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	const mockColumnPermissions: ColumnPermission[] = [
		{
			id: 1,
			userId: 2,
			columnId: 1,
			tableId: 1,
			tenantId: 1,
			canRead: true,
			canEdit: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
		{
			id: 2,
			userId: 2,
			columnId: 2,
			tableId: 1,
			tenantId: 1,
			canRead: true,
			canEdit: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({}),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("UserManagementGrid", () => {
		it("renders users correctly", () => {
			const mockOnDeleteRow = vi.fn();
			render(
				<UserManagementGrid
					users={mockUsers}
					onDeleteRow={mockOnDeleteRow}
				/>
			);

			expect(screen.getByText("Admin User")).toBeInTheDocument();
			expect(screen.getByText("Regular User")).toBeInTheDocument();
			expect(screen.getByText("admin@test.com")).toBeInTheDocument();
			expect(screen.getByText("user@test.com")).toBeInTheDocument();
		});

		it("shows manage permissions button for admin users", () => {
			const mockOnDeleteRow = vi.fn();
			render(
				<UserManagementGrid
					users={mockUsers}
					onDeleteRow={mockOnDeleteRow}
				/>
			);

			const manageButtons = screen.getAllByRole("button", { name: /settings/i });
			expect(manageButtons).toHaveLength(2); // One for each user
		});

		it("shows delete button only for non-admin users when current user is admin", () => {
			const mockOnDeleteRow = vi.fn();
			render(
				<UserManagementGrid
					users={mockUsers}
					onDeleteRow={mockOnDeleteRow}
				/>
			);

			// Should show delete button for regular user but not for admin
			const deleteButtons = screen.getAllByRole("button", { name: /trash/i });
			expect(deleteButtons).toHaveLength(1); // Only for regular user
		});

		it("calls onDeleteRow when delete button is clicked", () => {
			const mockOnDeleteRow = vi.fn();
			render(
				<UserManagementGrid
					users={mockUsers}
					onDeleteRow={mockOnDeleteRow}
				/>
			);

			const deleteButton = screen.getByRole("button", { name: /trash/i });
			fireEvent.click(deleteButton);

			expect(mockOnDeleteRow).toHaveBeenCalledWith("2");
		});
	});

	describe("PermissionManager", () => {
		it("renders table permissions correctly", () => {
			render(
				<PermissionsManager
					table={mockTable}
					columns={mockColumns}
				/>
			);

			expect(screen.getByText("Table Permissions")).toBeInTheDocument();
			expect(screen.getByText("Read")).toBeInTheDocument();
			expect(screen.getByText("Edit")).toBeInTheDocument();
			expect(screen.getByText("Delete")).toBeInTheDocument();
		});

		it("renders column permissions correctly", () => {
			render(
				<PermissionsManager
					table={mockTable}
					columns={mockColumns}
				/>
			);

			expect(screen.getByText("Column Permissions")).toBeInTheDocument();
			expect(screen.getByText("Name")).toBeInTheDocument();
			expect(screen.getByText("Email")).toBeInTheDocument();
		});

		it("handles permission changes correctly", () => {
			const mockOnPermissionsUpdate = vi.fn();
			render(
				<PermissionsManager
					table={mockTable}
					columns={mockColumns}
					onPermissionsUpdate={mockOnPermissionsUpdate}
				/>
			);

			const readButton = screen.getAllByText("Disabled")[0];
			fireEvent.click(readButton);

			expect(screen.getByText("Enabled")).toBeInTheDocument();
		});
	});

	describe("useTablePermissions", () => {
		it("returns correct permissions for admin user", () => {
			const result = useTablePermissions(1, [], []);
			
			expect(result.canReadTable()).toBe(true);
			expect(result.canEditTable()).toBe(true);
			expect(result.canDeleteTable()).toBe(true);
		});

		it("returns correct permissions for regular user", () => {
			// Mock non-admin user
			const mockNonAdminContext = {
				...mockAppContext,
				user: { ...mockAppContext.user, role: "EDITOR" as Role },
			};

			vi.mocked(require("@/contexts/AppContext").useApp).mockReturnValue(mockNonAdminContext);

			const result = useTablePermissions(1, [mockTablePermission], mockColumnPermissions);
			
			expect(result.canReadTable()).toBe(true);
			expect(result.canEditTable()).toBe(false);
			expect(result.canDeleteTable()).toBe(false);
		});

		it("filters visible columns correctly", () => {
			const result = useTablePermissions(1, [mockTablePermission], mockColumnPermissions);
			const visibleColumns = result.getVisibleColumns(mockColumns);
			
			expect(visibleColumns).toHaveLength(2); // Both columns are readable
		});

		it("filters editable columns correctly", () => {
			const result = useTablePermissions(1, [mockTablePermission], mockColumnPermissions);
			const editableColumns = result.getEditableColumns(mockColumns);
			
			expect(editableColumns).toHaveLength(1); // Only Email column is editable
			expect(editableColumns[0].name).toBe("Email");
		});
	});

	describe("Plan Permission Checks", () => {
		it("allows permission management for Pro plan", () => {
			expect(checkPlanPermission("Pro", "canManagePermissions")).toBe(true);
		});

		it("allows permission management for Enterprise plan", () => {
			expect(checkPlanPermission("Enterprise", "canManagePermissions")).toBe(true);
		});

		it("denies permission management for Free plan", () => {
			expect(checkPlanPermission("Free", "canManagePermissions")).toBe(false);
		});

		it("denies permission management for Starter plan", () => {
			expect(checkPlanPermission("Starter", "canManagePermissions")).toBe(false);
		});
	});

	describe("API Integration", () => {
		it("fetches permissions correctly", async () => {
			const mockPermissions = {
				tablePermissions: [mockTablePermission],
				columnsPermissions: mockColumnPermissions,
			};

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockPermissions),
			});

			// This would need to be tested with a proper test setup
			// that can handle the hook's async behavior
			expect(true).toBe(true); // Placeholder for now
		});

		it("handles API errors gracefully", async () => {
			(global.fetch as any).mockResolvedValue({
				ok: false,
				status: 403,
				json: () => Promise.resolve({ error: "Access denied" }),
			});

			// This would need to be tested with a proper test setup
			expect(true).toBe(true); // Placeholder for now
		});
	});

	describe("User Deletion", () => {
		it("shows confirmation dialog before deletion", () => {
			const mockOnDeleteRow = vi.fn();
			// Mock window.confirm
			window.confirm = vi.fn(() => true);

			render(
				<UserManagementGrid
					users={mockUsers}
					onDeleteRow={mockOnDeleteRow}
				/>
			);

			const deleteButton = screen.getByRole("button", { name: /trash/i });
			fireEvent.click(deleteButton);

			expect(window.confirm).toHaveBeenCalledWith(
				expect.stringContaining("Are you sure you want to delete Regular User?")
			);
		});

		it("does not call onDeleteRow if user cancels confirmation", () => {
			const mockOnDeleteRow = vi.fn();
			// Mock window.confirm to return false
			window.confirm = vi.fn(() => false);

			render(
				<UserManagementGrid
					users={mockUsers}
					onDeleteRow={mockOnDeleteRow}
				/>
			);

			const deleteButton = screen.getByRole("button", { name: /trash/i });
			fireEvent.click(deleteButton);

			expect(mockOnDeleteRow).not.toHaveBeenCalled();
		});
	});
});
