# LineChart Widget Implementation Documentation

## Overview

The LineChart Widget is a comprehensive React component built with TypeScript that supports both manual data entry and table data sources. It features real-time editing, advanced filtering, and a sophisticated editor panel with live preview capabilities.

## Features Implemented

### ✅ Core Features
- **Dual Data Sources**: Manual data entry and table data fetching
- **Real-time Editing**: Live preview updates during configuration
- **Advanced Filtering**: Complex filter builder with multiple operators
- **Responsive Design**: Works on all screen sizes
- **Error Handling**: Graceful error states and retry mechanisms
- **Loading States**: Skeleton loaders and loading indicators

### ✅ Data Management
- **Manual Data Editor**: Inline CSV-style data editing
- **Table Integration**: Fetches data from existing database tables
- **Filter System**: Advanced filtering with 8 different operators
- **Import/Export**: CSV import/export functionality
- **Data Validation**: Type checking and validation

### ✅ Chart Customization
- **Multiple Curve Types**: Monotone, linear, step variations
- **Customizable Styling**: Colors, stroke width, dot size
- **Axis Configuration**: Custom labels and data keys
- **Legend & Grid**: Toggleable legend and grid display
- **Responsive Layout**: Adapts to container size

## Component Architecture

### Main Components

#### 1. LineChartWidget (`LineChartWidget.tsx`)
**Primary chart component with dual data source support**

```typescript
interface LineChartWidgetProps {
  widget: Widget;
  isEditMode?: boolean;
  onEdit?: () => void;
}

interface LineChartConfig {
  title?: string;
  dataSource: DataSource;
  xAxis: { key: string; label?: string; type?: 'category' | 'number' | 'time' };
  yAxis: { key: string; label?: string; type?: 'number' };
  options?: {
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    strokeWidth?: number;
    dotSize?: number;
    curveType?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
  };
}
```

**Key Features:**
- Automatic data source detection
- Real-time data fetching for table sources
- Error handling with fallback to mock data
- Refresh functionality for table data
- Loading and error states

#### 2. DataEditor (`DataEditor.tsx`)
**Inline data editor for manual data entry**

```typescript
interface DataEditorProps {
  data: ChartDataPoint[];
  columns: string[];
  onDataChange: (data: ChartDataPoint[]) => void;
  onSave: () => void;
}
```

**Features:**
- CSV-style table editing
- Add/remove rows dynamically
- Import/export CSV functionality
- Real-time data validation
- Animated row operations

#### 3. FilterBuilder (`FilterBuilder.tsx`)
**Advanced filter builder for table data**

```typescript
interface FilterBuilderProps {
  filters: Filter[];
  availableColumns: string[];
  onFiltersChange: (filters: Filter[]) => void;
}

interface Filter {
  id: string;
  column: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 
           'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number;
}
```

**Features:**
- 8 different filter operators
- Dynamic filter addition/removal
- Column-based filtering
- Value type detection
- Visual filter management

#### 4. TableSelector (`TableSelector.tsx`)
**Table and column selection for data sources**

```typescript
interface TableSelectorProps {
  selectedTableId?: number;
  selectedColumnX?: string;
  selectedColumnY?: string;
  onTableChange: (tableId: number) => void;
  onColumnXChange: (column: string) => void;
  onColumnYChange: (column: string) => void;
  tenantId: number;
  databaseId: number;
}
```

**Features:**
- Dynamic table loading
- Column metadata display
- Type information for columns
- Real-time column updates
- Error handling for API calls

#### 5. WidgetEditor (Updated)
**Enhanced editor with LineChart-specific options**

**New Features:**
- Data source type selection
- Manual data editing integration
- Table selection and filtering
- Axis configuration
- Advanced styling options

## Data Flow

### Manual Data Source
```
User Input → DataEditor → handleManualDataChange → 
updateConfig → LineChartWidget → Chart Rendering
```

### Table Data Source
```
Table Selection → TableSelector → Column Selection → 
Filter Configuration → API Call → Data Processing → 
Chart Rendering
```

### Real-time Editing
```
Editor Changes → updateConfig → Widget State Update → 
Chart Re-render → Live Preview
```

## API Integration

### Table Data Fetching
```typescript
const fetchTableData = async (dataSource: DataSource): Promise<ChartDataPoint[]> => {
  const response = await fetch(`/api/tenants/1/databases/1/tables/${dataSource.tableId}/rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: dataSource.filters || [],
      limit: 1000,
      offset: 0,
    }),
  });
  return response.json();
};
```

### Filter Application
Filters are applied at the API level using the existing filtering system:
- Column-based filtering
- Operator-based conditions
- Value matching
- Empty/null checks

## Configuration Examples

### Manual Data Configuration
```typescript
const manualConfig: LineChartConfig = {
  title: 'Sales Performance',
  dataSource: {
    type: 'manual',
    manualData: [
      { month: 'Jan', sales: 1000 },
      { month: 'Feb', sales: 1200 },
      { month: 'Mar', sales: 1500 },
    ]
  },
  xAxis: { key: 'month', label: 'Month', type: 'category' },
  yAxis: { key: 'sales', label: 'Sales ($)', type: 'number' },
  options: {
    colors: ['#3B82F6'],
    showLegend: true,
    showGrid: true,
    strokeWidth: 3,
    dotSize: 5,
    curveType: 'monotone'
  }
};
```

### Table Data Configuration
```typescript
const tableConfig: LineChartConfig = {
  title: 'Revenue Trends',
  dataSource: {
    type: 'table',
    tableId: 123,
    columnX: 'date',
    columnY: 'revenue',
    filters: [
      { id: '1', column: 'status', operator: 'equals', value: 'active' },
      { id: '2', column: 'amount', operator: 'greater_than', value: 100 }
    ]
  },
  xAxis: { key: 'date', label: 'Date', type: 'time' },
  yAxis: { key: 'revenue', label: 'Revenue ($)', type: 'number' },
  options: {
    colors: ['#10B981', '#F59E0B'],
    showLegend: true,
    showGrid: true,
    strokeWidth: 2,
    dotSize: 4,
    curveType: 'linear'
  }
};
```

## Usage Examples

### Basic Implementation
```tsx
<LineChartWidget 
  widget={widget} 
  isEditMode={true}
  onEdit={() => setShowEditor(true)}
/>
```

### With Custom Configuration
```tsx
const customWidget: Widget = {
  id: 1,
  type: 'chart',
  title: 'Custom Chart',
  position: { x: 0, y: 0, width: 6, height: 4 },
  config: {
    title: 'Custom Chart',
    dataSource: {
      type: 'manual',
      manualData: customData
    },
    xAxis: { key: 'x', label: 'X Axis' },
    yAxis: { key: 'y', label: 'Y Axis' },
    options: {
      colors: ['#FF6B6B', '#4ECDC4'],
      curveType: 'step'
    }
  },
  isVisible: true,
  order: 0
};
```

### Editor Integration
```tsx
<WidgetEditor
  widget={widget}
  onClose={() => setShowEditor(false)}
  onSave={(updatedWidget) => {
    // Handle widget update
    updateWidget(updatedWidget);
  }}
/>
```

## Styling and Theming

### Color System
- Primary: `#3B82F6` (Blue)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Orange)
- Error: `#EF4444` (Red)

### Chart Styling
- Responsive container with 100% width/height
- Customizable stroke width (1-10px)
- Configurable dot size (1-10px)
- Multiple curve types for different visual effects

### UI Components
- Consistent with existing design system
- Tailwind CSS for styling
- Framer Motion for animations
- Radix UI for accessible components

## Performance Optimizations

### Data Processing
- `useMemo` for processed data calculations
- Efficient re-rendering with proper dependencies
- Lazy loading for large datasets

### API Calls
- Debounced search and filtering
- Error handling with retry mechanisms
- Caching for frequently accessed data

### Rendering
- React.memo for component optimization
- Efficient state updates
- Minimal re-renders during editing

## Error Handling

### Data Source Errors
- Network error handling
- Invalid data format detection
- Fallback to mock data
- User-friendly error messages

### Validation Errors
- Type checking for data points
- Required field validation
- Range validation for numeric inputs

### API Errors
- HTTP status code handling
- Retry mechanisms for failed requests
- Graceful degradation

## Testing Considerations

### Unit Tests
- Component rendering tests
- Data processing logic tests
- Event handler tests
- Configuration validation tests

### Integration Tests
- API integration tests
- Editor workflow tests
- Data source switching tests

### E2E Tests
- Complete editing workflow
- Data import/export functionality
- Filter application and removal

## Future Enhancements

### Planned Features
- Multiple line support
- Area chart variant
- Interactive tooltips
- Data point editing
- Real-time data updates

### Technical Improvements
- WebSocket integration
- Advanced caching strategies
- Performance monitoring
- Accessibility improvements

## Troubleshooting

### Common Issues

1. **Chart not rendering**
   - Check data format and structure
   - Verify axis key mappings
   - Ensure data source is properly configured

2. **Table data not loading**
   - Verify table ID and permissions
   - Check filter configuration
   - Ensure API endpoints are accessible

3. **Editor not updating**
   - Check state management
   - Verify event handlers
   - Ensure proper prop passing

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG = process.env.NODE_ENV === 'development';
```

This implementation provides a robust, feature-rich LineChart widget that supports both manual and table data sources with real-time editing capabilities and a sophisticated user interface.
