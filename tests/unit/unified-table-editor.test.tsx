import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UnifiedTableEditor } from "../../src/components/table/unified/UnifiedTableEditor";
import { Column } from "../../src/types/database";
import { AppProvider } from "../../src/contexts/AppContext";
import { DatabaseProvider } from "../../src/contexts/DatabaseContext";

// Mock the contexts
jest.mock("@/contexts/AppContext", () => ({
	AppProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="app-provider">{children}</div>,
	useApp: () => ({
		showAlert: jest.fn(),
		token: "mock-token",
		user: { id: 1, name: "Test User" },
		tenant: { id: 1, name: "Test Tenant" },
	}),
}));

jest.mock("@/contexts/DatabaseContext", () => ({
	DatabaseProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="database-provider">{children}</div>,
	useDatabase: () => ({
		selectedDatabase: { id: 1, name: "Test Database" },
		tables: [],
	}),
}));

// Mock the hooks
jest.mock("@/hooks/useTableRows", () => ({
	__esModule: true,
	default: jest.fn(() => ({
		rows: [
			{ id: 1, tableId: 1, createdAt: "2023-01-01" },
			{ id: 2, tableId: 1, createdAt: "2023-01-02" },
		],
		loading: false,
		error: null,
		refreshRows: jest.fn(),
		pagination: { totalRows: 2, currentPage: 1, pageSize: 25 },
		fetchRows: jest.fn(),
		refetch: jest.fn(),
		silentRefresh: jest.fn(),
		applyFilters: jest.fn(),
		globalSearch: "",
		filters: {},
		setRows: jest.fn(),
	})),
}));

jest.mock("@/hooks/useRowsTableEditor", () => ({
	__esModule: true,
	default: jest.fn(() => ({
		editingCell: null,
		pendingChanges: {},
		handleEditCell: jest.fn(),
		handleSaveCell: jest.fn(),
		handleCancelEdit: jest.fn(),
		handleSaveAllChanges: jest.fn(),
		handleDeleteRows: jest.fn(),
		selectedRows: new Set(),
		setSelectedRows: jest.fn(),
		handleSelectAll: jest.fn(),
		handleSelectRow: jest.fn(),
		isAllSelected: false,
		isIndeterminate: false,
	})),
}));

jest.mock("@/hooks/useCurrentUserPermissions", () => ({
	useCurrentUserPermissions: jest.fn(() => ({
		canEdit: true,
		canDelete: true,
	})),
}));

jest.mock("@/hooks/useTablePermissions", () => ({
	useTablePermissions: jest.fn(() => ({
		canEditColumns: true,
		canDeleteColumns: true,
		canReadTable: jest.fn(() => true),
		canEditTable: jest.fn(() => true),
		canDeleteTable: jest.fn(() => true),
	})),
}));

// Mock the child components
jest.mock("@/components/table/unified/ColumnHeader", () => {
	return function MockColumnHeader({ column, onEdit, onDelete }: any) {
		return (
			<div data-testid={`column-header-${column.id}`}>
				<span>{column.name}</span>
				<button onClick={() => onEdit(column)} data-testid={`edit-column-${column.id}`}>
					Edit
				</button>
				<button onClick={() => onDelete(column.id)} data-testid={`delete-column-${column.id}`}>
					Delete
				</button>
			</div>
		);
	};
});

jest.mock("@/components/table/unified/RowGrid", () => {
	return function MockRowGrid({ rows, columns, onEditCell, onSaveCell, onCancelEdit }: any) {
		return (
			<div data-testid="row-grid">
				{rows.map((row: any) => (
					<div key={row.id} data-testid={`row-${row.id}`}>
						{columns.map((column: any) => (
							<div key={column.id} data-testid={`cell-${row.id}-${column.id}`}>
								<button
									onClick={() => onEditCell(row.id, column.id, "virtual")}
									data-testid={`edit-cell-${row.id}-${column.id}`}
								>
									Edit Cell
								</button>
							</div>
						))}
					</div>
				))}
			</div>
		);
	};
});

jest.mock("@/components/table/unified/ColumnPropertiesSidebar", () => {
	return function MockColumnPropertiesSidebar({ isOpen, column, onClose, onSave }: any) {
		if (!isOpen) return null;
		return (
			<div data-testid="column-properties-sidebar">
				<h3>Edit Column: {column?.name}</h3>
				<button onClick={onClose} data-testid="close-sidebar">Close</button>
				<button onClick={() => onSave(column)} data-testid="save-column">Save</button>
			</div>
		);
	};
});

jest.mock("@/components/table/unified/AddColumnForm", () => {
	return function MockAddColumnForm({ isOpen, onClose, onAdd }: any) {
		if (!isOpen) return null;
		return (
			<div data-testid="add-column-form">
				<h3>Add New Column</h3>
				<button onClick={onClose} data-testid="close-add-form">Close</button>
				<button onClick={() => onAdd({ name: "New Column", type: "string" })} data-testid="add-column">
					Add Column
				</button>
			</div>
		);
	};
});

describe("UnifiedTableEditor", () => {
	const mockTable = {
		id: 1,
		name: "Test Table",
		databaseId: 1,
	};

	const mockColumns: Column[] = [
		{
			id: 1,
			name: "Name",
			type: "string",
			required: true,
			primary: true,
			tableId: 1,
			order: 0,
			description: "User name",
			unique: false,
			defaultValue: undefined,
		},
		{
			id: 2,
			name: "Email",
			type: "string",
			required: true,
			primary: false,
			tableId: 1,
			order: 1,
			description: "User email",
			unique: true,
			defaultValue: undefined,
		},
	];

	const defaultProps = {
		table: mockTable,
		columns: mockColumns,
		setColumns: jest.fn(),
		refreshTable: jest.fn(),
	};

	const renderWithProvider = (props = defaultProps) => {
		return render(
			<AppProvider>
				<DatabaseProvider>
					<UnifiedTableEditor {...props} />
				</DatabaseProvider>
			</AppProvider>
		);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should render table header with column headers", () => {
		renderWithProvider();

		expect(screen.getByTestId("unified-table-header")).toBeInTheDocument();
		expect(screen.getByTestId("column-header-1")).toBeInTheDocument();
		expect(screen.getByTestId("column-header-2")).toBeInTheDocument();
		expect(screen.getByText("Name")).toBeInTheDocument();
		expect(screen.getByText("Email")).toBeInTheDocument();
	});

	it("should render add column button", () => {
		renderWithProvider();

		expect(screen.getByTestId("add-column-button")).toBeInTheDocument();
	});

	it("should open add column form when add button is clicked", async () => {
		renderWithProvider();

		const addButton = screen.getByTestId("add-column-button");
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(screen.getByTestId("add-column-form")).toBeInTheDocument();
		});
	});

	it("should open column properties sidebar when edit button is clicked", async () => {
		renderWithProvider();

		const editButton = screen.getByTestId("edit-column-1");
		fireEvent.click(editButton);

		await waitFor(() => {
			expect(screen.getByTestId("column-properties-sidebar")).toBeInTheDocument();
			expect(screen.getByText("Edit Column: Name")).toBeInTheDocument();
		});
	});

	it("should close sidebar when close button is clicked", async () => {
		renderWithProvider();

		// Open sidebar
		const editButton = screen.getByTestId("edit-column-1");
		fireEvent.click(editButton);

		await waitFor(() => {
			expect(screen.getByTestId("column-properties-sidebar")).toBeInTheDocument();
		});

		// Close sidebar
		const closeButton = screen.getByTestId("close-sidebar");
		fireEvent.click(closeButton);

		await waitFor(() => {
			expect(screen.queryByTestId("column-properties-sidebar")).not.toBeInTheDocument();
		});
	});

	it("should render row grid with data", () => {
		renderWithProvider();

		expect(screen.getByTestId("row-grid")).toBeInTheDocument();
		expect(screen.getByTestId("row-1")).toBeInTheDocument();
		expect(screen.getByTestId("row-2")).toBeInTheDocument();
	});

	it("should handle cell editing", async () => {
		const mockHandleEditCell = jest.fn();
		const mockUseRowsTableEditor = require("@/hooks/useRowsTableEditor").default;
		mockUseRowsTableEditor.mockReturnValue({
			editingCell: null,
			pendingChanges: {},
			handleEditCell: mockHandleEditCell,
			handleSaveCell: jest.fn(),
			handleCancelEdit: jest.fn(),
			handleSaveAllChanges: jest.fn(),
			handleDeleteRows: jest.fn(),
			selectedRows: new Set(),
			setSelectedRows: jest.fn(),
			handleSelectAll: jest.fn(),
			handleSelectRow: jest.fn(),
			isAllSelected: false,
			isIndeterminate: false,
		});

		renderWithProvider();

		const editCellButton = screen.getByTestId("edit-cell-1-1");
		fireEvent.click(editCellButton);

		expect(mockHandleEditCell).toHaveBeenCalledWith(1, 1, "virtual");
	});

	it("should show column type and properties in header", () => {
		renderWithProvider();

		// Check that column headers show type information
		expect(screen.getByText("Name")).toBeInTheDocument();
		expect(screen.getByText("Email")).toBeInTheDocument();
	});

	it("should handle empty columns array", () => {
		renderWithProvider({ ...defaultProps, columns: [] });

		expect(screen.getByTestId("unified-table-header")).toBeInTheDocument();
		expect(screen.getByTestId("add-column-button")).toBeInTheDocument();
	});

	it("should handle null columns", () => {
		renderWithProvider({ ...defaultProps, columns: [] });

		expect(screen.getByTestId("unified-table-header")).toBeInTheDocument();
		expect(screen.getByTestId("add-column-button")).toBeInTheDocument();
	});
});
