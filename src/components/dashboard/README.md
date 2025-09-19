# Widget System Documentation

## Overview

The widget system is a comprehensive, scalable solution for building interactive dashboard components. It follows modern React patterns and provides a clean, maintainable architecture.

## Architecture

### Core Components

1. **Widget Types** (`src/types/widgets.ts`)
   - Centralized type definitions
   - Single source of truth for all widget-related interfaces
   - Type-safe configuration options

2. **Widget Registry** (`src/components/dashboard/WidgetRegistry.tsx`)
   - Centralized widget component registration
   - Dynamic widget rendering based on type
   - Error handling and fallback components

3. **Widget Factory** (`src/components/dashboard/WidgetFactory.tsx`)
   - Widget creation with default configurations
   - Smart positioning algorithms
   - Validation and error handling

4. **Data Management** (`src/hooks/useWidgetData.ts`)
   - Centralized data fetching
   - Caching and performance optimization
   - Error handling and retry logic

5. **Composition Components** (`src/components/dashboard/composition/`)
   - Reusable UI components
   - Consistent loading and error states
   - Empty state handling

## Widget Types

### Chart Widgets
- **Line Chart**: Time series data visualization
- **Bar Chart**: Categorical data comparison
- **Pie Chart**: Proportional data representation

### Data Widgets
- **Table**: Tabular data display with sorting and filtering
- **KPI/Metric**: Key performance indicators and metrics

### Content Widgets
- **Text**: Rich text content with formatting

## Usage

### Creating a Widget

```typescript
import { WidgetFactory } from '@/components/dashboard';

// Create a new chart widget
const chartWidget = WidgetFactory.create('chart', {
  title: 'Sales Chart',
  position: { x: 0, y: 0, width: 8, height: 6 },
  config: {
    chartType: 'line',
    dataSource: {
      type: 'table',
      tableId: 1,
      columnX: 'date',
      columnY: 'sales'
    }
  }
});
```

### Rendering a Widget

```typescript
import { WidgetRegistry } from '@/components/dashboard';

// Render widget using registry
const widgetElement = WidgetRegistry.render(widget, {
  isEditMode: true,
  onEdit: () => console.log('Edit clicked'),
  onDelete: () => console.log('Delete clicked')
});
```

### Using Data Hooks

```typescript
import { useWidgetData } from '@/hooks/useWidgetData';

function MyWidget({ widget }) {
  const { data, isLoading, error, refetch } = useWidgetData(widget);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{/* Render data */}</div>;
}
```

## Performance Optimizations

### Lazy Loading
Widgets are lazy-loaded when they come into view, reducing initial load time.

### Virtualization
Large numbers of widgets are virtualized for better performance.

### Memoization
Widget configurations and data are memoized to prevent unnecessary re-renders.

### Error Boundaries
Widget errors are caught and handled gracefully without breaking the entire dashboard.

## Styling

### Presets
The system includes several built-in style presets:
- `modern`: Clean, minimal design
- `glass`: Glassmorphism effect
- `dark`: Dark theme
- `gradient`: Gradient backgrounds
- `card`: Card-based design
- `compact`: Compact spacing
- `luxury`: Premium, elegant design

### Custom Styling
Widgets support extensive customization through the `WidgetStyleConfig` interface.

## Best Practices

1. **Use the Registry**: Always use `WidgetRegistry.render()` for consistent rendering
2. **Leverage the Factory**: Use `WidgetFactory` for creating widgets with proper defaults
3. **Handle Errors**: Implement proper error boundaries and fallback states
4. **Optimize Performance**: Use lazy loading and virtualization for large datasets
5. **Type Safety**: Always use the centralized types for better maintainability

## Extending the System

### Adding New Widget Types

1. Create the widget component
2. Register it in the Widget Registry
3. Add type definitions to `widgets.ts`
4. Update the factory with default configurations

### Adding New Data Sources

1. Extend the `DataSource` interface
2. Update the data hooks to handle the new source
3. Add validation in the factory

## Troubleshooting

### Common Issues

1. **Widget not rendering**: Check if it's registered in the Widget Registry
2. **Data not loading**: Verify the data source configuration
3. **Performance issues**: Consider using lazy loading or virtualization
4. **Styling problems**: Check the style configuration and presets

### Debug Mode

Enable debug mode by setting `NODE_ENV=development` to see detailed error information and performance metrics.

## Migration Guide

### From Old System

1. Replace direct widget imports with `WidgetRegistry`
2. Update widget creation to use `WidgetFactory`
3. Migrate data fetching to use the centralized hooks
4. Update styling to use the new configuration system

## Contributing

When contributing to the widget system:

1. Follow the established patterns
2. Add proper TypeScript types
3. Include error handling
4. Write tests for new functionality
5. Update documentation

## License

This widget system is part of the multi-tenant platform and follows the same licensing terms.
