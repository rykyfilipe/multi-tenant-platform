/** @format */

import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "./pagination";

describe("Pagination Component", () => {
	const mockOnPageChange = jest.fn();
	const mockOnPageSizeChange = jest.fn();

	const defaultProps = {
		currentPage: 1,
		totalPages: 5,
		onPageChange: mockOnPageChange,
		pageSize: 25,
		totalItems: 100,
		onPageSizeChange: mockOnPageSizeChange,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders pagination controls when totalPages > 1", () => {
		render(<Pagination {...defaultProps} />);

		expect(
			screen.getByText("Showing 1 to 25 of 100 results"),
		).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("does not render when totalPages <= 1", () => {
		render(<Pagination {...defaultProps} totalPages={1} />);

		expect(
			screen.queryByText("Showing 1 to 25 of 100 results"),
		).not.toBeInTheDocument();
	});

	it("calls onPageChange when page button is clicked", () => {
		render(<Pagination {...defaultProps} />);

		fireEvent.click(screen.getByText("2"));
		expect(mockOnPageChange).toHaveBeenCalledWith(2);
	});

	it("calls onPageSizeChange when page size is changed", () => {
		render(<Pagination {...defaultProps} />);

		const select = screen.getByDisplayValue("25");
		fireEvent.change(select, { target: { value: "50" } });
		expect(mockOnPageSizeChange).toHaveBeenCalledWith(50);
	});

	it("disables previous button on first page", () => {
		render(<Pagination {...defaultProps} currentPage={1} />);

		const prevButton = screen.getByLabelText("Previous page");
		expect(prevButton).toBeDisabled();
	});

	it("disables next button on last page", () => {
		render(<Pagination {...defaultProps} currentPage={5} />);

		const nextButton = screen.getByLabelText("Next page");
		expect(nextButton).toBeDisabled();
	});
});
