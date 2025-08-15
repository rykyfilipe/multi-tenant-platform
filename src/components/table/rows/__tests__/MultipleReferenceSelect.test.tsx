/** @format */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MultipleReferenceSelect } from "../MultipleReferenceSelect";

const mockOptions = [
	{
		id: 1,
		displayValue: "User 1 - john@example.com",
		primaryKeyValue: "user1",
	},
	{
		id: 2,
		displayValue: "User 2 - jane@example.com",
		primaryKeyValue: "user2",
	},
	{ id: 3, displayValue: "User 3 - bob@example.com", primaryKeyValue: "user3" },
];

const defaultProps = {
	value: [],
	onValueChange: jest.fn(),
	options: mockOptions,
	placeholder: "Select users",
	referencedTableName: "Users",
	isMultiple: true,
};

describe("MultipleReferenceSelect", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders with placeholder when no value is selected", () => {
		render(<MultipleReferenceSelect {...defaultProps} />);
		expect(screen.getByText("Select users")).toBeInTheDocument();
	});

	it("shows selected items as badges", () => {
		render(
			<MultipleReferenceSelect {...defaultProps} value={["user1", "user2"]} />,
		);
		expect(screen.getByText("User 1 - john@example.com")).toBeInTheDocument();
		expect(screen.getByText("User 2 - jane@example.com")).toBeInTheDocument();
		expect(screen.getByText("2 items selected")).toBeInTheDocument();
	});

	it("opens dropdown when clicked", async () => {
		render(<MultipleReferenceSelect {...defaultProps} />);
		const trigger = screen.getByText("Select users");
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("User 1 - john@example.com")).toBeInTheDocument();
			expect(screen.getByText("User 2 - jane@example.com")).toBeInTheDocument();
			expect(screen.getByText("User 3 - bob@example.com")).toBeInTheDocument();
		});
	});

	it("allows selecting multiple items", async () => {
		const onValueChange = jest.fn();
		render(
			<MultipleReferenceSelect
				{...defaultProps}
				onValueChange={onValueChange}
			/>,
		);

		const trigger = screen.getByText("Select users");
		fireEvent.click(trigger);

		await waitFor(() => {
			const option1 = screen.getByText("User 1 - john@example.com");
			const option2 = screen.getByText("User 2 - jane@example.com");

			fireEvent.click(option1);
			fireEvent.click(option2);
		});

		expect(onValueChange).toHaveBeenCalledWith(["user1", "user2"]);
	});

	it("allows removing individual items", async () => {
		const onValueChange = jest.fn();
		render(
			<MultipleReferenceSelect
				{...defaultProps}
				value={["user1", "user2"]}
				onValueChange={onValueChange}
			/>,
		);

		const removeButton = screen.getByText(
			"User 1 - john@example.com",
		).nextElementSibling;
		if (removeButton) {
			fireEvent.click(removeButton);
		}

		expect(onValueChange).toHaveBeenCalledWith(["user2"]);
	});

	it("supports search functionality", async () => {
		render(<MultipleReferenceSelect {...defaultProps} />);

		const trigger = screen.getByText("Select users");
		fireEvent.click(trigger);

		await waitFor(() => {
			const searchInput = screen.getByPlaceholderText("Search Users...");
			fireEvent.change(searchInput, { target: { value: "john" } });
		});

		expect(screen.getByText("User 1 - john@example.com")).toBeInTheDocument();
		expect(
			screen.queryByText("User 2 - jane@example.com"),
		).not.toBeInTheDocument();
	});

	it("handles single selection mode", () => {
		const onValueChange = jest.fn();
		render(
			<MultipleReferenceSelect
				{...defaultProps}
				isMultiple={false}
				onValueChange={onValueChange}
			/>,
		);

		const trigger = screen.getByText("Select users");
		fireEvent.click(trigger);

		waitFor(() => {
			const option = screen.getByText("User 1 - john@example.com");
			fireEvent.click(option);
		});

		expect(onValueChange).toHaveBeenCalledWith("user1");
	});

	it("shows count of selected items", async () => {
		render(
			<MultipleReferenceSelect
				{...defaultProps}
				value={["user1", "user2", "user3"]}
			/>,
		);

		const trigger = screen.getByText("3 items selected");
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("• 3 selected")).toBeInTheDocument();
		});
	});

	it("clears all selections when clear button is clicked", () => {
		const onValueChange = jest.fn();
		render(
			<MultipleReferenceSelect
				{...defaultProps}
				value={["user1", "user2"]}
				onValueChange={onValueChange}
			/>,
		);

		const clearButton = screen.getByRole("button", { name: /clear/i });
		fireEvent.click(clearButton);

		expect(onValueChange).toHaveBeenCalledWith([]);
	});
});
