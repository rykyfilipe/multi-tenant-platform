# POST-Based Filtering System

This document describes the new POST-based filtering system that replaces the previous GET-based query string approach.

## Overview

The filtering system has been refactored to use POST requests with JSON payloads instead of GET requests with query strings. This provides several benefits:

- **Better structure**: Complex filter objects are easier to manage in JSON format
- **No URL length limits**: Large filter sets won't hit URL length restrictions
- **Type safety**: Clear TypeScript interfaces for all filter structures
- **Better performance**: JSON parsing is more efficient than query string parsing
- **Easier debugging**: Filter payloads are more readable in network logs

## API Endpoints

### Main Rows Endpoint
```
POST /api/tenants/{tenantId}/databases/{databaseId}/tables/{tableId}/rows
```

### Filtered Rows Endpoint (Alternative)
```
POST /api/tenants/{tenantId}/databases/{databaseId}/tables/{tableId}/rows/filtered
```

Both endpoints accept the same payload structure and return identical responses.

## Request Payload

```typescript
interface FilterPayload {
  page: number;                    // Page number (1-based)
  pageSize: number;               // Number of rows per page (1-100)
  includeCells?: boolean;         // Include cell data (default: true)
  globalSearch?: string;          // Global search term
  filters?: FilterConfig[];       // Array of column filters
  sortBy?: string;                // Sort column (default: "id")
  sortOrder?: 'asc' | 'desc';     // Sort direction (default: "asc")
}
```

### Filter Configuration

```typescript
interface FilterConfig {
  id: string;                     // Unique identifier for the filter
  columnId: number;               // ID of the column to filter
  columnName: string;             // Name of the column
  columnType: string;             // Type of the column
  operator: string;               // Filter operator
  value: any;                     // Filter value
  secondValue?: any;              // Second value for range filters
}
```

## Supported Filter Operators

### Text Columns (`text`, `string`, `email`, `url`)
- `contains` - Contains substring
- `not_contains` - Does not contain substring
- `equals` - Exact match
- `not_equals` - Not exact match
- `starts_with` - Starts with string
- `ends_with` - Ends with string
- `regex` - Regular expression match
- `is_empty` - Cell is empty
- `is_not_empty` - Cell is not empty

### Numeric Columns (`number`, `integer`, `decimal`)
- `equals` - Exact match
- `not_equals` - Not exact match
- `greater_than` - Greater than value
- `greater_than_or_equal` - Greater than or equal to value
- `less_than` - Less than value
- `less_than_or_equal` - Less than or equal to value
- `between` - Between two values (requires `secondValue`)
- `not_between` - Not between two values (requires `secondValue`)
- `is_empty` - Cell is empty
- `is_not_empty` - Cell is not empty

### Boolean Columns (`boolean`)
- `equals` - Exact match
- `not_equals` - Not exact match
- `is_empty` - Cell is empty
- `is_not_empty` - Cell is not empty

### Date Columns (`date`, `datetime`)
- `equals` - Exact match
- `not_equals` - Not exact match
- `before` - Before date
- `after` - After date
- `between` - Between two dates (requires `secondValue`)
- `not_between` - Not between two dates (requires `secondValue`)
- `today` - Today's date
- `yesterday` - Yesterday's date
- `this_week` - This week
- `this_month` - This month
- `this_year` - This year
- `is_empty` - Cell is empty
- `is_not_empty` - Cell is not empty

### Reference Columns (`reference`)
- `equals` - Exact match
- `not_equals` - Not exact match
- `is_empty` - Cell is empty
- `is_not_empty` - Cell is not empty

## Response Format

```typescript
interface FilteredRowsResponse {
  data: any[];                    // Array of filtered rows
  pagination: {
    page: number;                 // Current page
    pageSize: number;             // Rows per page
    totalRows: number;            // Total number of rows
    totalPages: number;           // Total number of pages
    hasNext: boolean;             // Has next page
    hasPrev: boolean;             // Has previous page
  };
  filters: {
    applied: boolean;             // Whether filters are applied
    globalSearch: string;         // Applied global search
    columnFilters: FilterConfig[]; // Applied column filters
    validFiltersCount: number;    // Number of valid filters
  };
  performance?: {                 // Only in /filtered endpoint
    queryTime: number;            // Query execution time
    filteredRows: number;         // Number of filtered rows
    originalTableSize: number;    // Original table size
  };
}
```

## Example Requests

### Basic Request (No Filters)
```json
{
  "page": 1,
  "pageSize": 25,
  "includeCells": true,
  "globalSearch": "",
  "filters": [],
  "sortBy": "id",
  "sortOrder": "asc"
}
```

### Global Search
```json
{
  "page": 1,
  "pageSize": 25,
  "globalSearch": "important",
  "filters": []
}
```

### Simple Column Filter
```json
{
  "page": 1,
  "pageSize": 25,
  "filters": [
    {
      "id": "filter-1",
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "contains",
      "value": "test"
    }
  ]
}
```

### Complex Filters (Multiple Columns)
```json
{
  "page": 1,
  "pageSize": 25,
  "filters": [
    {
      "id": "filter-1",
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "contains",
      "value": "test"
    },
    {
      "id": "filter-2",
      "columnId": 2,
      "columnName": "status",
      "columnType": "text",
      "operator": "equals",
      "value": "active"
    },
    {
      "id": "filter-3",
      "columnId": 3,
      "columnName": "price",
      "columnType": "number",
      "operator": "between",
      "value": 10,
      "secondValue": 100
    }
  ]
}
```

### Date Range Filter
```json
{
  "page": 1,
  "pageSize": 25,
  "filters": [
    {
      "id": "filter-1",
      "columnId": 4,
      "columnName": "created_at",
      "columnType": "date",
      "operator": "between",
      "value": "2024-01-01",
      "secondValue": "2024-12-31"
    }
  ]
}
```

## Frontend Integration

The frontend uses the `useTableRows` hook which automatically handles POST requests:

```typescript
const {
  rows,
  loading,
  error,
  pagination,
  filters,
  globalSearch,
  applyFilters,
  updateGlobalSearch,
  clearFilters
} = useTableRows(tableId, pageSize);
```

### Applying Filters
```typescript
// Apply multiple filters
await applyFilters([
  {
    id: 'filter-1',
    columnId: 1,
    columnName: 'name',
    columnType: 'text',
    operator: 'contains',
    value: 'test'
  }
], 'global search term');

// Update global search
updateGlobalSearch('search term');

// Clear all filters
clearFilters();
```

## Migration from GET to POST

### Before (GET with Query Strings)
```typescript
const url = `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows?page=1&pageSize=25&search=test&filters=${encodeURIComponent(JSON.stringify(filters))}`;
const response = await fetch(url, { method: 'GET' });
```

### After (POST with JSON Body)
```typescript
const url = `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows`;
const payload = {
  page: 1,
  pageSize: 25,
  globalSearch: 'test',
  filters: filters
};
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

## Error Handling

The API returns structured error responses:

```typescript
interface FilterErrorResponse {
  error: string;                  // Error message
  code?: string;                  // Error code
  details?: any;                  // Additional error details
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid filter parameters
- `INTERNAL_ERROR` - Server error
- `ACCESS_DENIED` - Insufficient permissions
- `NOT_FOUND` - Table or database not found

## Performance Considerations

1. **Pagination**: Always use pagination to limit result sets
2. **Indexing**: Ensure database columns used in filters are properly indexed
3. **Caching**: The system includes built-in caching for frequently accessed data
4. **Query Optimization**: Complex filters are optimized at the database level

## Testing

Use the provided test script to verify filtering functionality:

```bash
npm run test:filtering
```

Or run the test script directly:

```bash
npx tsx src/scripts/test-post-filtering.ts
```

## Backward Compatibility

The old GET endpoints are still available for backward compatibility, but new code should use the POST endpoints. The GET endpoints will be deprecated in a future version.

## Type Safety

All filter types are defined in `src/types/filtering.ts` and provide full TypeScript support:

```typescript
import { FilterConfig, FilterPayload, FilteredRowsResponse } from '@/types/filtering';
```

This ensures type safety across the entire filtering system and provides excellent IDE support.
