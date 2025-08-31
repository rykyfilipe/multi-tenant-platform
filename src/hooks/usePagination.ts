/** @format */

import { useState, useMemo } from "react";

interface UsePaginationProps<T> {
	data: T[];
	initialPageSize?: number;
	initialPage?: number;
}

interface UsePaginationReturn<T> {
	currentPage: number;
	pageSize: number;
	totalPages: number;
	totalItems: number;
	paginatedData: T[];
	startIndex: number;
	endIndex: number;
	setPage: (page: number) => void;
	setPageSize: (pageSize: number) => void;
	goToPage: (page: number) => void;
	nextPage: () => void;
	previousPage: () => void;
	canGoNext: boolean;
	canGoPrevious: boolean;
}

export function usePagination<T>({
	data,
	initialPageSize = 25,
	initialPage = 1,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
	const [currentPage, setCurrentPage] = useState(initialPage);
	const [pageSize, setPageSize] = useState(initialPageSize);

	const totalItems = data.length;
	const totalPages = Math.ceil(totalItems / pageSize);

	// Ensure current page is within valid range
	const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));

	const startIndex = (validCurrentPage - 1) * pageSize;
	const endIndex = Math.min(startIndex + pageSize, totalItems);

	const paginatedData = useMemo(() => {
		return data.slice(startIndex, endIndex);
	}, [data, startIndex, endIndex]);

	const setPage = (page: number) => {
		const validPage = Math.max(1, Math.min(page, totalPages));
		setCurrentPage(validPage);
	};

	const setPageSizeAndReset = (newPageSize: number) => {
		setPageSize(newPageSize);
		setCurrentPage(1); // Reset to first page when changing page size
	};

	const goToPage = (page: number) => {
		setPage(page);
	};

	const nextPage = () => {
		if (validCurrentPage < totalPages) {
			setCurrentPage(validCurrentPage + 1);
		}
	};

	const previousPage = () => {
		if (validCurrentPage > 1) {
			setCurrentPage(validCurrentPage - 1);
		}
	};

	const canGoNext = validCurrentPage < totalPages;
	const canGoPrevious = validCurrentPage > 1;

	return {
		currentPage: validCurrentPage,
		pageSize,
		totalPages,
		totalItems,
		paginatedData,
		startIndex,
		endIndex,
		setPage,
		setPageSize: setPageSizeAndReset,
		goToPage,
		nextPage,
		previousPage,
		canGoNext,
		canGoPrevious,
	};
}
