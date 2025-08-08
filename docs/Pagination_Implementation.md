<!-- @format -->

# Pagination Implementation for Table Rows

## Overview

This document describes the pagination implementation for table rows in the
multi-tenant platform. The pagination system provides efficient data loading and
improved user experience when dealing with large datasets.

## Components

### 1. Pagination Component (`src/components/ui/pagination.tsx`)

A reusable pagination component that provides:

- Page navigation controls (Previous/Next buttons)
- Page number buttons with ellipsis for large page counts
- Page size selector (10, 25, 50, 100 items per page)
- Results counter showing current range and total items
- Responsive design for mobile and desktop

**Features:**

- Smart page number display with ellipsis for large datasets
- Disabled states for navigation buttons when at boundaries
- Page size selection with automatic reset to page 1
- Accessible button labels and keyboard navigation

### 2. usePagination Hook (`src/hooks/usePagination.ts`)

A custom React hook that manages pagination state and logic:

**State Management:**

- Current page number
- Page size (items per page)
- Total pages calculation
- Paginated data slice

**Functions:**

- `setPage(page)` - Navigate to specific page
- `setPageSize(size)` - Change page size (resets to page 1)
- `nextPage()` / `previousPage()` - Navigation helpers
- `goToPage(page)` - Direct page navigation

**Validation:**

- Ensures current page is within valid range
- Handles edge cases for empty datasets
- Automatic page size validation

## Integration

### TableEditor Component

The main table editor (`src/components/table/rows/TableEditor.tsx`) integrates
pagination:

1. **Pagination Hook Integration:**

   ```typescript
   const pagination = usePagination({
   	data: filteredRows,
   	initialPageSize: 25,
   	initialPage: 1,
   });
   ```

2. **Filter Integration:**

   - Pagination automatically resets to page 1 when filters change
   - Works seamlessly with existing TableFilters component
   - Maintains filter state across page navigation

3. **TableView Integration:**
   - Passes paginated data to TableView component
   - Provides pagination controls and state
   - Shows current page information in header

### TableView Component

Updated to support pagination props:

- Receives paginated data instead of full dataset
- Displays pagination controls at bottom
- Shows page information in header
- Maintains all existing functionality (editing, deleting, etc.)

## Features

### 1. Performance Optimization

- Only renders visible rows (paginated subset)
- Reduces DOM size for large datasets
- Improves rendering performance

### 2. User Experience

- Clear navigation controls
- Page size selection for user preference
- Results counter showing current position
- Responsive design for all screen sizes

### 3. Filter Integration

- Automatic page reset when filters change
- Maintains filter state across navigation
- Seamless integration with existing filter system

### 4. Accessibility

- Proper ARIA labels for navigation buttons
- Keyboard navigation support
- Screen reader friendly

## Usage

### Basic Implementation

```typescript
import { usePagination } from "@/hooks/usePagination";

function MyTable({ data }) {
	const pagination = usePagination({
		data: data,
		initialPageSize: 25,
		initialPage: 1,
	});

	return (
		<div>
			<TableView
				rows={pagination.paginatedData}
				currentPage={pagination.currentPage}
				pageSize={pagination.pageSize}
				totalPages={pagination.totalPages}
				totalItems={pagination.totalItems}
				onPageChange={pagination.setPage}
				onPageSizeChange={pagination.setPageSize}
			/>
		</div>
	);
}
```

### Custom Page Sizes

```typescript
const pagination = usePagination({
	data: data,
	initialPageSize: 50, // Custom default
	initialPage: 1,
});
```

## Configuration

### Default Settings

- **Initial Page Size:** 25 items per page
- **Page Size Options:** [10, 25, 50, 100]
- **Initial Page:** 1

### Customization

The pagination component accepts custom page size options:

```typescript
<Pagination
	pageSizeOptions={[5, 15, 30, 60]}
	// ... other props
/>
```

## Testing

A comprehensive test suite is included (`src/components/ui/pagination.test.tsx`)
covering:

- Component rendering
- Navigation functionality
- Page size changes
- Edge cases (first/last page)
- Accessibility features

## Future Enhancements

Potential improvements for future versions:

1. **Server-side pagination** for very large datasets
2. **URL state management** for bookmarkable pages
3. **Virtual scrolling** for extremely large datasets
4. **Custom page size presets** per user preference
5. **Export paginated data** functionality

## Migration Notes

The pagination implementation is backward compatible:

- Existing table functionality remains unchanged
- Filters continue to work as before
- No breaking changes to existing APIs
- Gradual rollout possible with feature flags
