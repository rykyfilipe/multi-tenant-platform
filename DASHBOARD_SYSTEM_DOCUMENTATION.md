# Dashboard System Documentation

## Overview

The Dashboard System provides a comprehensive solution for creating, managing, and displaying customizable dashboards with widgets in a multi-tenant environment. The system is built with production-ready features including validation, error handling, permissions, and monitoring.

## Architecture

### Database Models

#### Dashboard Model
```prisma
model Dashboard {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  name        String
  description String?
  mode        String   @default("view") // view, edit
  isPublic    Boolean  @default(false)
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   Int
  updatedBy   Int

  tenant   Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  widgets  Widget[]
  creator  User    @relation("DashboardCreator", fields: [createdBy], references: [id])
  updater  User    @relation("DashboardUpdater", fields: [updatedBy], references: [id])

  @@unique([tenantId, name])
  @@index([tenantId])
  @@index([tenantId, isDefault])
  @@index([createdBy])
  @@index([updatedBy])
}
```

#### Widget Model
```prisma
model Widget {
  id          Int      @id @default(autoincrement())
  dashboardId Int
  type        String   // chart, table, metric, text, filter, etc.
  title       String?
  position    Json     // { x: number, y: number, width: number, height: number }
  config      Json     // Widget-specific configuration
  isVisible   Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   Int
  updatedBy   Int

  dashboard Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  creator   User      @relation("WidgetCreator", fields: [createdBy], references: [id])
  updater   User      @relation("WidgetUpdater", fields: [updatedBy], references: [id])

  @@index([dashboardId])
  @@index([dashboardId, order])
  @@index([type])
  @@index([createdBy])
  @@index([updatedBy])
}
```

### Key Features

- **Multi-tenant Isolation**: Each dashboard belongs to a tenant
- **Unique Constraints**: Dashboard names are unique per tenant
- **Cascading Deletes**: Widgets are automatically deleted when dashboard is deleted
- **Audit Trail**: Tracks who created and last updated each dashboard/widget
- **Flexible Positioning**: Grid-based positioning system for widgets
- **Type-safe Configuration**: JSON configuration with validation per widget type

## API Endpoints

### Dashboard Endpoints

#### GET /api/dashboards
List all dashboards for the current tenant with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by name or description
- `mode` (string): Filter by mode (view/edit)
- `isPublic` (boolean): Filter by public/private status

**Response:**
```json
{
  "dashboards": [
    {
      "id": 1,
      "name": "Sales Dashboard",
      "description": "Overview of sales metrics",
      "mode": "view",
      "isPublic": false,
      "isDefault": true,
      "createdAt": "2024-12-20T10:00:00Z",
      "updatedAt": "2024-12-20T10:00:00Z",
      "createdBy": 1,
      "updatedBy": 1,
      "widgets": [...],
      "_count": { "widgets": 5 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### POST /api/dashboards
Create a new dashboard.

**Request Body:**
```json
{
  "name": "New Dashboard",
  "description": "Dashboard description",
  "mode": "view",
  "isPublic": false,
  "isDefault": false
}
```

**Response:** Dashboard object with widgets and metadata.

#### GET /api/dashboards/[id]
Get a specific dashboard by ID.

**Response:** Dashboard object with widgets and metadata.

#### PUT /api/dashboards/[id]
Update a dashboard.

**Request Body:** Partial dashboard object with fields to update.

**Response:** Updated dashboard object.

#### DELETE /api/dashboards/[id]
Delete a dashboard (widgets are automatically deleted).

**Response:**
```json
{
  "message": "Dashboard deleted successfully"
}
```

### Widget Endpoints

#### GET /api/dashboards/[id]/widgets
List all widgets for a dashboard.

**Query Parameters:**
- `type` (string): Filter by widget type
- `isVisible` (boolean): Filter by visibility

**Response:**
```json
{
  "widgets": [
    {
      "id": 1,
      "type": "chart",
      "title": "Sales Chart",
      "position": { "x": 0, "y": 0, "width": 6, "height": 4 },
      "config": { "chartType": "line", "dataSource": {...} },
      "isVisible": true,
      "order": 0,
      "createdAt": "2024-12-20T10:00:00Z",
      "updatedAt": "2024-12-20T10:00:00Z"
    }
  ]
}
```

#### POST /api/dashboards/[id]/widgets
Create a new widget.

**Request Body:**
```json
{
  "type": "chart",
  "title": "Sales Chart",
  "position": { "x": 0, "y": 0, "width": 6, "height": 4 },
  "config": {
    "chartType": "line",
    "dataSource": {
      "tableId": 1,
      "columnX": "date",
      "columnY": "amount"
    }
  },
  "isVisible": true,
  "order": 0
}
```

**Response:** Widget object with metadata.

#### GET /api/dashboards/[id]/widgets/[widgetId]
Get a specific widget.

**Response:** Widget object with metadata.

#### PUT /api/dashboards/[id]/widgets/[widgetId]
Update a widget.

**Request Body:** Partial widget object with fields to update.

**Response:** Updated widget object.

#### DELETE /api/dashboards/[id]/widgets/[widgetId]
Delete a widget.

**Response:**
```json
{
  "message": "Widget deleted successfully"
}
```

## Widget Types

### Supported Widget Types

1. **chart** - Data visualization charts
2. **table** - Tabular data display
3. **metric** - Single value metrics
4. **text** - Text content
5. **filter** - Data filtering controls
6. **image** - Image display
7. **iframe** - Embedded content
8. **calendar** - Calendar view
9. **map** - Geographic data
10. **gauge** - Gauge charts
11. **progress** - Progress bars
12. **list** - List display
13. **form** - Form inputs
14. **button** - Action buttons
15. **divider** - Visual separators

### Widget Configuration Examples

#### Chart Widget
```json
{
  "type": "chart",
  "config": {
    "chartType": "line",
    "dataSource": {
      "tableId": 1,
      "columnX": "date",
      "columnY": "amount",
      "filters": []
    },
    "options": {
      "title": "Sales Over Time",
      "xAxisLabel": "Date",
      "yAxisLabel": "Amount",
      "colors": ["#3B82F6", "#EF4444"],
      "showLegend": true,
      "showGrid": true
    }
  }
}
```

#### Table Widget
```json
{
  "type": "table",
  "config": {
    "dataSource": {
      "tableId": 1,
      "columns": ["name", "email", "createdAt"],
      "filters": [],
      "sortBy": "createdAt",
      "sortOrder": "desc"
    },
    "options": {
      "pageSize": 10,
      "showPagination": true,
      "showSearch": true,
      "showExport": false
    }
  }
}
```

#### Metric Widget
```json
{
  "type": "metric",
  "config": {
    "dataSource": {
      "tableId": 1,
      "column": "amount",
      "aggregation": "sum",
      "filters": []
    },
    "options": {
      "format": "currency",
      "prefix": "$",
      "suffix": "",
      "color": "#10B981",
      "showTrend": true
    }
  }
}
```

## Validation

### Dashboard Validation

- **Name**: Required, 1-100 characters, alphanumeric with spaces, hyphens, underscores
- **Description**: Optional, max 500 characters
- **Mode**: Must be "view" or "edit"
- **isPublic**: Boolean
- **isDefault**: Boolean (only one default per tenant)

### Widget Validation

- **Type**: Must be one of the supported widget types
- **Title**: Optional, max 100 characters
- **Position**: Required object with x, y, width, height
  - x, y: Non-negative integers
  - width: 1-12 grid units
  - height: 1-20 grid units
- **Config**: JSON object with type-specific validation
- **isVisible**: Boolean
- **Order**: Non-negative integer

## Security Features

### Authentication & Authorization
- All endpoints require authentication
- Users can only access dashboards from their tenant
- Proper permission checks for all operations

### Input Sanitization
- All string inputs are sanitized to prevent XSS
- SQL injection prevention through Prisma ORM
- Comprehensive input validation

### Error Handling
- Detailed error messages for validation failures
- Proper HTTP status codes
- Error tracking and logging
- Graceful error responses

## Performance Features

### Database Optimization
- Proper indexing for all queries
- Efficient pagination
- Optimized joins and includes

### Caching
- Query result caching (optional)
- Materialized views for analytics
- Connection pooling

### Monitoring
- Query performance tracking
- Usage analytics
- Error monitoring
- API usage metrics

## Usage Examples

### Creating a Dashboard with Widgets

```typescript
// 1. Create dashboard
const dashboard = await fetch('/api/dashboards', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sales Dashboard',
    description: 'Overview of sales metrics',
    mode: 'view',
    isPublic: false,
    isDefault: true
  })
});

// 2. Add chart widget
const chartWidget = await fetch(`/api/dashboards/${dashboard.id}/widgets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'chart',
    title: 'Sales Over Time',
    position: { x: 0, y: 0, width: 8, height: 4 },
    config: {
      chartType: 'line',
      dataSource: {
        tableId: 1,
        columnX: 'date',
        columnY: 'amount'
      }
    }
  })
});

// 3. Add metric widget
const metricWidget = await fetch(`/api/dashboards/${dashboard.id}/widgets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'metric',
    title: 'Total Sales',
    position: { x: 8, y: 0, width: 4, height: 2 },
    config: {
      dataSource: {
        tableId: 1,
        column: 'amount',
        aggregation: 'sum'
      },
      options: {
        format: 'currency',
        prefix: '$'
      }
    }
  })
});
```

### Querying Dashboards

```typescript
// Get all dashboards with pagination
const dashboards = await fetch('/api/dashboards?page=1&limit=10&search=sales');

// Get public dashboards only
const publicDashboards = await fetch('/api/dashboards?isPublic=true');

// Get dashboards in edit mode
const editDashboards = await fetch('/api/dashboards?mode=edit');
```

## Migration

To apply the dashboard system to your database:

```bash
# Run the migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Best Practices

### Dashboard Design
- Keep dashboards focused on specific use cases
- Use meaningful names and descriptions
- Organize widgets logically
- Consider mobile responsiveness

### Widget Configuration
- Validate widget configurations on the frontend
- Use consistent positioning and sizing
- Test widget configurations thoroughly
- Document custom widget types

### Performance
- Limit the number of widgets per dashboard
- Use efficient data sources
- Implement proper caching
- Monitor query performance

### Security
- Validate all inputs
- Sanitize user-generated content
- Implement proper access controls
- Monitor for suspicious activity

## Troubleshooting

### Common Issues

1. **Validation Errors**: Check input format and required fields
2. **Permission Denied**: Ensure user has access to tenant
3. **Widget Not Found**: Verify widget ID and dashboard ownership
4. **Database Errors**: Check Prisma connection and migrations

### Debugging

- Check error logs for detailed error messages
- Use browser dev tools to inspect API requests
- Verify authentication and session state
- Test with minimal data first

## Future Enhancements

### Planned Features
- Real-time widget updates
- Advanced widget types (maps, calendars)
- Dashboard templates
- Collaborative editing
- Export functionality
- Mobile app support

### Extensibility
- Plugin system for custom widgets
- Custom validation rules
- Advanced theming
- Integration with external data sources

This dashboard system provides a solid foundation for building interactive, data-driven dashboards in a multi-tenant environment with production-ready features and comprehensive documentation.
