# Filtering Operators Documentation

This document describes all available filtering operators and their compatibility with different column types in the enhanced filtering system.

## Overview

The filtering system supports various operators for different data types, ensuring type safety and optimal performance. Each operator is validated against the column type before execution.

## Column Types

### Text Types
- `text` - Plain text
- `string` - String data
- `email` - Email addresses
- `url` - URLs

### Numeric Types
- `number` - Floating point numbers
- `integer` - Whole numbers
- `decimal` - Decimal numbers

### Date/Time Types
- `date` - Date only (YYYY-MM-DD)
- `datetime` - Date and time (ISO 8601)
- `time` - Time only (HH:MM:SS)

### Other Types
- `boolean` - True/false values
- `json` - JSON data
- `reference` - Foreign key references

## Operators by Column Type

### Text Operators

| Operator | Description | Example | Notes |
|----------|-------------|---------|-------|
| `contains` | Contains substring | `"John"` finds "John Doe" | Case-insensitive |
| `not_contains` | Does not contain substring | `"test"` excludes "testing" | Case-insensitive |
| `equals` | Exact match | `"John"` matches only "John" | Case-sensitive |
| `not_equals` | Not equal | `"John"` excludes "John" | Case-sensitive |
| `starts_with` | Starts with | `"Mr."` finds "Mr. Smith" | Case-insensitive |
| `ends_with` | Ends with | `".com"` finds "example.com" | Case-insensitive |
| `regex` | Regular expression | `"^[A-Z]"` finds uppercase start | Uses PostgreSQL regex |
| `is_empty` | Empty or null | No value needed | Checks for null, empty string |
| `is_not_empty` | Not empty | No value needed | Excludes null, empty string |

### Numeric Operators

| Operator | Description | Example | Notes |
|----------|-------------|---------|-------|
| `equals` | Exact match | `42` matches only 42 | Numeric comparison |
| `not_equals` | Not equal | `42` excludes 42 | Numeric comparison |
| `greater_than` | Greater than | `100` finds > 100 | Numeric comparison |
| `greater_than_or_equal` | Greater or equal | `100` finds >= 100 | Numeric comparison |
| `less_than` | Less than | `50` finds < 50 | Numeric comparison |
| `less_than_or_equal` | Less or equal | `50` finds <= 50 | Numeric comparison |
| `between` | Between values | `10, 20` finds 10-20 | Requires secondValue |
| `not_between` | Not between | `10, 20` excludes 10-20 | Requires secondValue |
| `is_empty` | Empty or null | No value needed | Checks for null |
| `is_not_empty` | Not empty | No value needed | Excludes null |

### Date Operators

| Operator | Description | Example | Notes |
|----------|-------------|---------|-------|
| `equals` | Exact date | `"2024-01-15"` matches that date | Date only comparison |
| `not_equals` | Not equal date | `"2024-01-15"` excludes that date | Date only comparison |
| `before` | Before date | `"2024-01-15"` finds earlier dates | Date comparison |
| `after` | After date | `"2024-01-15"` finds later dates | Date comparison |
| `between` | Between dates | `"2024-01-01", "2024-12-31"` | Requires secondValue |
| `not_between` | Not between dates | `"2024-01-01", "2024-12-31"` | Requires secondValue |
| `today` | Today's date | No value needed | Current date |
| `yesterday` | Yesterday's date | No value needed | Previous date |
| `this_week` | This week | No value needed | Monday to Sunday |
| `last_week` | Last week | No value needed | Previous Monday to Sunday |
| `this_month` | This month | No value needed | 1st to last day of month |
| `last_month` | Last month | No value needed | Previous month |
| `this_year` | This year | No value needed | January 1st to December 31st |
| `last_year` | Last year | No value needed | Previous year |
| `is_empty` | Empty or null | No value needed | Checks for null |
| `is_not_empty` | Not empty | No value needed | Excludes null |

### Boolean Operators

| Operator | Description | Example | Notes |
|----------|-------------|---------|-------|
| `equals` | Exact match | `true` matches true | Boolean comparison |
| `not_equals` | Not equal | `true` excludes true | Boolean comparison |
| `is_empty` | Empty or null | No value needed | Checks for null |
| `is_not_empty` | Not empty | No value needed | Excludes null |

### Reference Operators

| Operator | Description | Example | Notes |
|----------|-------------|---------|-------|
| `equals` | Exact match | `123` matches row ID 123 | Numeric ID comparison |
| `not_equals` | Not equal | `123` excludes row ID 123 | Numeric ID comparison |
| `is_empty` | Empty or null | No value needed | Checks for null |
| `is_not_empty` | Not empty | No value needed | Excludes null |

## Usage Examples

### Frontend Filter Configuration

```typescript
const filters: FilterConfig[] = [
  {
    id: 'filter-1',
    columnId: 1,
    columnName: 'Name',
    columnType: 'text',
    operator: 'contains',
    value: 'John'
  },
  {
    id: 'filter-2',
    columnId: 2,
    columnName: 'Age',
    columnType: 'number',
    operator: 'between',
    value: 18,
    secondValue: 65
  },
  {
    id: 'filter-3',
    columnId: 3,
    columnName: 'Created Date',
    columnType: 'date',
    operator: 'this_month',
    value: null
  }
];
```

### API Request

```typescript
const response = await fetch('/api/tenants/1/databases/2/tables/3/rows?' + new URLSearchParams({
  page: '1',
  pageSize: '25',
  search: 'global search term',
  filters: encodeURIComponent(JSON.stringify(filters)),
  sortBy: 'id',
  sortOrder: 'asc'
}));
```

## Performance Considerations

### Indexing
- Text searches use GIN indexes for optimal performance
- Numeric comparisons use B-tree indexes
- Date ranges use specialized date indexes
- Regular expressions use trigram indexes

### Caching
- Filter results are cached for 5 minutes
- Cache keys include all filter parameters
- Cache is invalidated when data changes

### Query Optimization
- Filters are applied at the database level
- Complex filters are optimized for PostgreSQL
- Pagination is handled efficiently

## Error Handling

### Validation Errors
- Invalid operators for column types return 400 Bad Request
- Missing required values return validation errors
- Type conversion warnings are logged but don't fail the request

### Common Error Messages
- `"Invalid filters"` - Filter configuration is invalid
- `"Operator 'X' is not compatible with column type 'Y'"` - Type mismatch
- `"Range operator 'between' requires secondValue"` - Missing range value

## Best Practices

1. **Use appropriate operators** for each column type
2. **Combine filters** with AND logic for precise results
3. **Use global search** for broad text searches
4. **Cache frequently used filters** for better performance
5. **Monitor query performance** with database statistics
6. **Use indexes** for frequently filtered columns
7. **Limit page size** to reasonable values (max 100)
8. **Use debouncing** for real-time filter updates

## Migration from Old System

The new filtering system is backward compatible with the old system, but provides:
- Better type safety
- Improved performance
- More operators
- Better error handling
- Structured logging
- Intelligent caching

No changes are required to existing filter configurations, but new features are available for enhanced filtering capabilities.
