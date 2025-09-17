# Technical Specifications

## System Architecture

### Frontend Architecture
```
src/
├── app/home/dashboards/          # Main dashboard page
├── components/dashboard/          # Widget components
│   ├── BaseWidget.tsx            # Base widget component
│   ├── KPIWidget.tsx             # KPI widget
│   ├── LineChartWidget.tsx       # Line chart widget
│   ├── BarChartWidget.tsx        # Bar chart widget
│   ├── PieChartWidget.tsx        # Pie chart widget
│   ├── TableWidget.tsx           # Table widget
│   ├── TextWidget.tsx            # Text widget
│   ├── WidgetEditor.tsx          # Widget editor
│   └── TableSelector.tsx         # Table selector
├── lib/
│   ├── aggregation-utils.ts      # Aggregation functions
│   ├── chart-colors.ts           # Color palettes
│   └── dashboard-service.ts      # Dashboard service
└── hooks/
    ├── useDashboardStore.ts      # Dashboard state
    └── useSchemaCache.ts         # Schema caching
```

### Backend Architecture
```
src/app/api/
├── dashboards/                   # Dashboard API endpoints
│   ├── [id]/                     # Individual dashboard
│   │   ├── widgets/              # Widget operations
│   │   │   ├── batch/            # Batch operations
│   │   │   └── [widgetId]/       # Individual widget
│   │   └── route.ts              # Dashboard CRUD
│   └── route.ts                  # Dashboard list
└── tenants/[tenantId]/           # Tenant-specific APIs
    └── databases/
        └── tables/               # Table data access
```

## Data Models

### Widget Interface
```typescript
interface Widget {
  id: number | string;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: any;
  isVisible: boolean;
  order: number;
  style?: WidgetStyleConfig;
}
```

### Widget Style Configuration
```typescript
interface WidgetStyleConfig {
  // Background styling
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  
  // Border styling
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  
  // Shadow styling
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shadowColor?: string;
  
  // Padding and spacing
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Typography
  titleColor?: string;
  titleSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  titleAlign?: 'left' | 'center' | 'right';
  
  // Animation and effects
  animation?: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';
  hoverEffect?: 'none' | 'lift' | 'glow' | 'scale' | 'rotate';
  
  // Layout
  height?: 'auto' | 'fit' | 'full' | 'min' | 'max';
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  
  // Custom CSS
  customCSS?: string;
}
```

### Aggregation Types
```typescript
type AggregationType = 
  | 'sum' | 'average' | 'mean' | 'median' | 'min' | 'max'
  | 'count' | 'count_distinct' | 'first' | 'last'
  | 'std_dev' | 'variance'
  | 'percentile_25' | 'percentile_50' | 'percentile_75'
  | 'percentile_90' | 'percentile_95' | 'percentile_99';
```

## API Endpoints

### Dashboard Management
- `GET /api/dashboards` - List all dashboards
- `POST /api/dashboards` - Create new dashboard
- `GET /api/dashboards/[id]` - Get dashboard by ID
- `PUT /api/dashboards/[id]` - Update dashboard
- `DELETE /api/dashboards/[id]` - Delete dashboard

### Widget Operations
- `GET /api/dashboards/[id]/widgets` - List widgets
- `POST /api/dashboards/[id]/widgets` - Create widget
- `PUT /api/dashboards/[id]/widgets/[widgetId]` - Update widget
- `DELETE /api/dashboards/[id]/widgets/[widgetId]` - Delete widget
- `POST /api/dashboards/[id]/widgets/batch` - Batch operations

### Data Access
- `GET /api/tenants/[tenantId]/databases/tables` - List all tables
- `GET /api/tenants/[tenantId]/databases/[databaseId]/tables` - List tables in database
- `GET /api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/rows` - Get table data

## Color Palettes

### Business Palette (Default)
```typescript
const business = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
];
```

### Luxury Palette
```typescript
const luxury = [
  '#2C3E50', // Dark blue-gray
  '#E74C3C', // Red
  '#F39C12', // Orange
  '#27AE60', // Green
  '#8E44AD', // Purple
  '#3498DB', // Blue
  '#1ABC9C', // Turquoise
  '#E67E22', // Dark orange
];
```

### Vibrant Palette
```typescript
const vibrant = [
  '#FF6B6B', // Coral
  '#4ECDC4', // Teal
  '#45B7D1', // Sky blue
  '#96CEB4', // Mint
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Seafoam
  '#F7DC6F', // Gold
];
```

## Aggregation Functions

### Basic Aggregations
```typescript
// Sum
const sum = values.reduce((acc, val) => acc + val, 0);

// Average/Mean
const average = values.reduce((acc, val) => acc + val, 0) / values.length;

// Median
const median = calculateMedian(sortedValues);

// Min/Max
const min = Math.min(...values);
const max = Math.max(...values);

// Count
const count = values.length;
```

### Advanced Aggregations
```typescript
// Standard Deviation
const stdDev = Math.sqrt(variance);

// Variance
const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

// Percentiles
const percentile = calculatePercentile(sortedValues, percentileValue);
```

## Performance Optimizations

### React Optimizations
- **React.memo**: Prevent unnecessary re-renders
- **useMemo**: Memoize expensive calculations
- **useCallback**: Memoize event handlers
- **Lazy Loading**: Load widgets only when needed

### Data Optimizations
- **Schema Caching**: Cache table schemas for 60 seconds
- **Pagination**: Limit data fetching to necessary records
- **Batch Operations**: Combine multiple operations into single requests
- **Debouncing**: Debounce search and filter operations

### Rendering Optimizations
- **Virtual Scrolling**: For large datasets in tables
- **Canvas Rendering**: For complex charts with many data points
- **CSS Transforms**: Use GPU acceleration for animations
- **Intersection Observer**: Load widgets when they become visible

## Security Features

### Data Protection
- **Tenant Isolation**: Complete data separation between tenants
- **Input Validation**: Validate all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Protection**: Sanitize all user-generated content

### Access Control
- **Role-Based Access**: Admin, user, viewer roles
- **Permission System**: Per-widget access control
- **API Authentication**: JWT-based authentication
- **Rate Limiting**: Prevent API abuse

### Audit Trail
- **Action Logging**: Log all user actions
- **Change Tracking**: Track widget modifications
- **Error Logging**: Comprehensive error logging
- **Performance Monitoring**: Track system performance

## Error Handling

### Frontend Error Handling
```typescript
// Error boundaries for widget failures
<ErrorBoundary fallback={<ErrorFallback />}>
  <Widget />
</ErrorBoundary>

// Graceful degradation
if (error) {
  return <ErrorState error={error} onRetry={handleRetry} />;
}
```

### Backend Error Handling
```typescript
// API error responses
return NextResponse.json(
  { error: 'Failed to process request', details: error.message },
  { status: 500 }
);

// Database error handling
const dbErrorResponse = handleDatabaseError(error, context);
if (dbErrorResponse) {
  return dbErrorResponse;
}
```

## Testing Strategy

### Unit Tests
- **Widget Components**: Test individual widget functionality
- **Utility Functions**: Test aggregation and formatting functions
- **API Endpoints**: Test API response handling
- **Error Scenarios**: Test error handling paths

### Integration Tests
- **Widget Integration**: Test widget interactions
- **Data Flow**: Test data flow from API to widgets
- **User Interactions**: Test user interaction flows
- **Performance**: Test performance under load

### End-to-End Tests
- **Dashboard Creation**: Test complete dashboard creation flow
- **Widget Management**: Test widget CRUD operations
- **Data Visualization**: Test data rendering in widgets
- **User Workflows**: Test complete user workflows

## Deployment Considerations

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_POOL_SIZE=10

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...

# Performance
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Build Optimizations
- **Code Splitting**: Split code by routes and features
- **Tree Shaking**: Remove unused code
- **Image Optimization**: Optimize images for web
- **Bundle Analysis**: Analyze bundle size and optimize

### Monitoring
- **Performance Monitoring**: Track page load times
- **Error Tracking**: Monitor and alert on errors
- **User Analytics**: Track user interactions
- **System Health**: Monitor system resources

## Scalability Considerations

### Horizontal Scaling
- **Load Balancing**: Distribute load across multiple instances
- **Database Sharding**: Partition data across multiple databases
- **CDN Integration**: Serve static assets from CDN
- **Caching**: Implement Redis for session and data caching

### Vertical Scaling
- **Memory Optimization**: Optimize memory usage
- **CPU Optimization**: Optimize CPU-intensive operations
- **Database Optimization**: Optimize database queries
- **Resource Monitoring**: Monitor resource usage

## Maintenance

### Regular Maintenance
- **Dependency Updates**: Keep dependencies up to date
- **Security Patches**: Apply security patches promptly
- **Performance Monitoring**: Monitor and optimize performance
- **User Feedback**: Collect and act on user feedback

### Monitoring
- **Health Checks**: Implement health check endpoints
- **Metrics Collection**: Collect system metrics
- **Alerting**: Set up alerts for critical issues
- **Logging**: Implement comprehensive logging

## Conclusion

This technical specification provides a comprehensive overview of the dashboard system's architecture, implementation details, and operational considerations. The system is designed for scalability, maintainability, and performance while providing a rich user experience for data visualization and business intelligence.
