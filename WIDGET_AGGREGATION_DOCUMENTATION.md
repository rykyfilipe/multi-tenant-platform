# Widget Aggregation System Documentation

## Overview

The widget aggregation system provides a comprehensive, modular, and scalable solution for data processing, validation, and aggregation across all widget types in the dashboard. This system ensures consistent data handling, proper validation, and flexible aggregation functions.

## Architecture

### Core Components

1. **Widget Aggregation Utilities** (`src/lib/widget-aggregation.ts`)
   - Common aggregation functions and validation logic
   - Type-safe interfaces and utilities
   - Flexible data mapping and processing

2. **Widget Implementations**
   - **MetricWidget**: Single-value aggregation with trend analysis
   - **Chart Widgets**: Multi-axis aggregation with grouping support
   - **TableWidget**: Tabular data with column-based aggregation

3. **Validation System**
   - Column type compatibility checking
   - Aggregation function validation
   - Configuration validation for each widget type

## Key Features

### 1. Aggregation Functions

Supported aggregation functions:
- **SUM**: Sum of numeric values
- **AVG**: Average of numeric values
- **MIN**: Minimum value (numeric or text)
- **MAX**: Maximum value (numeric or text)
- **COUNT**: Count of non-null values

### 2. Column Type Compatibility

| Column Type | SUM | AVG | MIN | MAX | COUNT |
|-------------|-----|-----|-----|-----|-------|
| number/integer/decimal | ✅ | ✅ | ✅ | ✅ | ✅ |
| string/text | ❌ | ❌ | ✅ | ✅ | ✅ |
| date/datetime | ❌ | ❌ | ❌ | ❌ | ✅ |
| boolean | ❌ | ❌ | ❌ | ❌ | ✅ |
| json/customArray | ❌ | ❌ | ❌ | ❌ | ✅ |

### 3. Widget-Specific Implementations

#### Metric Widget
- **Purpose**: Display single aggregated value with optional trend
- **Configuration**: Column selection + aggregation function
- **Validation**: Ensures aggregation compatibility with column type
- **Features**: Trend calculation, custom formatting, error handling

#### Chart Widgets (Line, Bar, Pie)
- **Purpose**: Visual representation of data with X/Y axes
- **Configuration**: X-axis (categorical/temporal) + Y-axis (numeric) columns
- **Validation**: Ensures proper axis types and aggregation compatibility
- **Features**: Automatic grouping, multi-series support, aggregation per group

#### Table Widget
- **Purpose**: Tabular display with optional column aggregation
- **Configuration**: Column selection + per-column aggregation functions
- **Validation**: Validates each column's aggregation compatibility
- **Features**: Sorting, filtering, pagination, local search

## Data Flow

### 1. Data Fetching
```typescript
// Raw database rows with cell structure
const rawRows = [
  {
    id: 1,
    cells: [
      { column: { name: 'price' }, numberValue: 100 },
      { column: { name: 'category' }, stringValue: 'Electronics' }
    ]
  }
];
```

### 2. Data Processing
```typescript
// Convert to processed format
const processedData = mapRawRowsToProcessedData(rawRows);
// Result: [{ id: 1, price: 100, category: 'Electronics' }]
```

### 3. Aggregation Application
```typescript
// Apply aggregation function
const result = applyAggregation([100, 200, 300], 'sum');
// Result: { value: 600, count: 3, isValid: true }
```

### 4. Validation
```typescript
// Validate configuration
const validation = validateMetricWidgetConfig(column, 'sum');
// Result: { isValid: true/false, error?: string }
```

## Usage Examples

### Metric Widget Configuration
```typescript
const metricConfig: MetricConfig = {
  title: 'Total Revenue',
  dataSource: {
    type: 'table',
    tableId: 1,
    columnY: 'price', // Numeric column
    filters: [
      {
        id: 'filter-1',
        columnId: 2,
        columnName: 'category',
        columnType: 'string',
        operator: 'equals',
        value: 'Electronics'
      }
    ]
  },
  aggregation: 'sum', // Compatible with numeric column
  formatting: {
    type: 'currency',
    decimals: 2,
    prefix: '$'
  }
};
```

### Chart Widget Configuration
```typescript
const chartConfig: LineChartConfig = {
  title: 'Sales by Category',
  dataSource: {
    type: 'table',
    tableId: 1,
    xAxis: {
      columns: ['category'], // Categorical column
      label: 'Category'
    },
    yAxis: {
      columns: ['price'], // Numeric column
      label: 'Revenue'
    }
  },
  // Aggregation applied automatically per category
  aggregation: 'sum'
};
```

### Table Widget Configuration
```typescript
const tableConfig: TableWidgetConfig = {
  title: 'Product Analysis',
  dataSource: {
    type: 'table',
    tableId: 1,
    columns: ['name', 'price', 'quantity'],
    aggregations: {
      'price': 'sum',    // Valid for numeric column
      'quantity': 'avg', // Valid for numeric column
      'name': 'count'    // Valid for string column
    }
  }
};
```

## Error Handling

### Configuration Validation
- **Column Type Mismatch**: Prevents invalid aggregations (e.g., SUM on string)
- **Missing Configuration**: Validates required fields are present
- **Invalid Operators**: Ensures filter operators match column types

### Runtime Validation
- **Data Type Checking**: Validates data types during processing
- **Aggregation Errors**: Handles empty data, invalid values gracefully
- **User Feedback**: Clear error messages with suggestions

### Error Display
```typescript
// Configuration Error
{
  isValid: false,
  error: "Cannot apply SUM on string column. Only numeric columns are supported."
}

// Runtime Error
{
  isValid: false,
  error: "No valid numeric values found"
}
```

## Testing

Comprehensive test suite covers:
- ✅ Aggregation function calculations
- ✅ Column type validation
- ✅ Widget configuration validation
- ✅ Data mapping and processing
- ✅ Error handling scenarios
- ✅ Edge cases (empty data, invalid values)

### Running Tests
```bash
npm test -- src/lib/__tests__/widget-aggregation.test.ts
```

## Performance Considerations

### Optimization Strategies
1. **Data Caching**: Processed data cached to avoid reprocessing
2. **Lazy Validation**: Validation only when configuration changes
3. **Efficient Mapping**: Single-pass data transformation
4. **Memory Management**: Proper cleanup of large datasets

### Scalability
- **Modular Design**: Easy to add new widget types
- **Extensible Aggregations**: Simple to add new aggregation functions
- **Type Safety**: Full TypeScript support for maintainability
- **Validation Framework**: Consistent validation across all widgets

## Migration Guide

### From Legacy Implementation
1. **Replace Direct Aggregation**: Use `applyAggregation()` instead of manual calculations
2. **Add Validation**: Use validation functions before processing
3. **Update Data Mapping**: Use `mapRawRowsToProcessedData()` for consistency
4. **Error Handling**: Implement proper error display using validation results

### Backward Compatibility
- Existing widget configurations continue to work
- Legacy data source formats supported
- Gradual migration path available

## Future Enhancements

### Planned Features
1. **Custom Aggregation Functions**: User-defined aggregation logic
2. **Advanced Filtering**: Complex filter combinations
3. **Real-time Updates**: Live data streaming support
4. **Performance Metrics**: Aggregation performance monitoring

### Extension Points
1. **New Widget Types**: Easy integration with validation system
2. **Custom Validators**: Plugin-based validation system
3. **Data Sources**: Support for additional data source types
4. **Aggregation Functions**: Framework for adding new functions

## Troubleshooting

### Common Issues

1. **"No data available" with valid data**
   - Check filter configuration
   - Verify column names match database schema
   - Ensure aggregation function is compatible with column type

2. **Configuration errors**
   - Validate column types in database
   - Check aggregation function compatibility
   - Verify filter operators match column types

3. **Performance issues**
   - Implement data caching
   - Use pagination for large datasets
   - Optimize filter queries

### Debug Tools
- Console logging for data flow tracking
- Validation error messages with specific details
- Test suite for verifying functionality
- TypeScript type checking for configuration errors
