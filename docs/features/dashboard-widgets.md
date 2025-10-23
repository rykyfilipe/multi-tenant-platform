# Dynamic Dashboard System

The dashboard system provides a powerful, drag-and-drop interface for creating custom data visualizations with real-time updates and responsive layouts.

## Overview

The dashboard system enables users to:

- **Create Custom Dashboards**: Drag-and-drop widget placement
- **Real-Time Data Visualization**: Live updates from connected data sources
- **Responsive Design**: Automatic layout adaptation across devices
- **Template System**: Pre-built layouts and widget configurations
- **Collaborative Editing**: Multiple users can edit dashboards simultaneously

## Architecture Components

### 1. Widget System

#### Widget Types
The platform supports 8 widget types:

```typescript
enum WidgetType {
  CHART = "CHART",           // Data visualization charts
  TABLE = "TABLE",           // Data tables with filtering
  KPI = "KPI",               // Key performance indicators
  CLOCK = "CLOCK",           // Time and date displays
  WEATHER = "WEATHER",       // Weather information
  TASKS = "TASKS",           // Task management
  TEXT = "TEXT",             // Rich text content
  NOTES = "NOTES"            // Note-taking widget
}
```

#### Widget Definition Structure
```typescript
interface WidgetDefinition<TConfigSchema extends z.ZodTypeAny> {
  type: WidgetType;
  schema: TConfigSchema;                    // Configuration validation
  defaultConfig: ConfigFromSchema<TConfigSchema>;
  editor: EditorComponent<TConfigSchema>;   // Configuration UI
  renderer: RendererComponent;             // Display component
  category: string;                         // Widget category
  description: string;                     // Widget description
  icon: React.ComponentType;               // Widget icon
}
```

### 2. Layout System

#### Responsive Grid Layout
```typescript
// Widget position with responsive breakpoints
interface WidgetPosition {
  x: number;                    // Default position
  y: number;
  w: number;                    // Width in grid units
  h: number;                    // Height in grid units
  layouts?: {                   // Per-breakpoint layouts
    xxl?: BreakpointPosition;  // >= 1600px
    xl?: BreakpointPosition;   // >= 1200px
    lg?: BreakpointPosition;   // >= 996px
    md?: BreakpointPosition;   // >= 768px
    sm?: BreakpointPosition;   // >= 480px
    xs?: BreakpointPosition;   // < 480px
  };
}
```

#### Breakpoint Management
```typescript
// Responsive breakpoints configuration
const breakpoints = {
  xxl: 1600,  // 24 columns
  xl: 1200,   // 24 columns
  lg: 996,    // 24 columns
  md: 768,    // 24 columns
  sm: 480,    // 24 columns
  xs: 0       // 24 columns
};
```

### 3. State Management

#### Widget Store (Zustand)
```typescript
interface WidgetsStore {
  // Widget data
  widgets: Record<number, WidgetEntity>;
  originalWidgets: Record<number, WidgetEntity>;
  
  // Operations
  pendingOperations: DraftOperation[];
  changeHistory: ChangeGroup[];
  redoHistory: ChangeGroup[];
  
  // Actions
  createLocal: (widget: WidgetEntity) => void;
  updateLocal: (widgetId: number, patch: Partial<WidgetEntity>) => void;
  deleteLocal: (widgetId: number) => void;
  undoLastChange: () => boolean;
  redoLastChange: () => boolean;
  discardAllChanges: () => void;
}
```

## Implementation Details

### 1. Widget Rendering

#### Widget Renderer Components
```typescript
// Example: Chart Widget Renderer
export const ChartWidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  isEditMode,
  isSelected
}) => {
  const config = widget.config as ChartWidgetConfig;
  
  return (
    <div className="widget-container">
      <WidgetHeader 
        title={widget.title}
        isEditMode={isEditMode}
        isSelected={isSelected}
      />
      <div className="widget-content">
        <ChartComponent 
          data={config.data}
          chartType={config.chartType}
          options={config.options}
        />
      </div>
    </div>
  );
};
```

#### Widget Configuration Schema
```typescript
// Chart Widget Configuration Schema
export const chartWidgetConfigSchema = baseWidgetConfigSchema.extend({
  chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter']),
  data: z.object({
    source: z.string(),           // Data source table
    xAxis: z.string(),           // X-axis column
    yAxis: z.array(z.string()),   // Y-axis columns
    filters: z.array(z.object({
      column: z.string(),
      operator: z.string(),
      value: z.any()
    }))
  }),
  options: z.object({
    colors: z.array(z.string()).optional(),
    showLegend: z.boolean().default(true),
    showGrid: z.boolean().default(true),
    animation: z.boolean().default(true)
  })
});
```

### 2. Layout Management

#### Grid Layout Integration
```typescript
// React Grid Layout integration
<ResponsiveGridLayout 
  className="layout"
  layouts={layouts}                    // Per-breakpoint layouts
  breakpoints={breakpoints}
  cols={{ xxl: 24, xl: 24, lg: 24, md: 24, sm: 24, xs: 24 }}
  rowHeight={30}
  isDraggable={isEditMode}
  isResizable={isEditMode}
  onLayoutChange={handleLayoutChange}
  onResize={handleResize}
>
  {widgetList.map(widget => (
    <div key={widget.id}>
      <WidgetRenderer widget={widget} />
    </div>
  ))}
</ResponsiveGridLayout>
```

#### Layout Change Handling
```typescript
const handleLayoutChange = useCallback((currentLayout: Layout[]) => {
  if (!isEditMode || isUndoRedoInProgress.current) return;
  
  const breakpoint = currentBreakpoint as Breakpoint;
  
  currentLayout.forEach((item) => {
    const widgetId = Number(item.i);
    const widget = widgetsRecord[widgetId];
    if (!widget) return;
    
    // Update widget position for current breakpoint
    const newPosition = setPositionForBreakpoint(
      widget.position,
      breakpoint,
      { x: item.x, y: item.y, w: item.w, h: item.h }
    );
    
    updateLocal(widgetId, { position: newPosition });
  });
}, [isEditMode, currentBreakpoint, widgetsRecord, updateLocal]);
```

### 3. Template System

#### Layout Templates
```typescript
// Pre-defined layout templates
export const layoutTemplates: DashboardLayoutTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level KPIs and charts for executives',
    layouts: {
      xxl: [
        { widgetId: 'kpi-1', x: 0, y: 0, w: 6, h: 4 },
        { widgetId: 'kpi-2', x: 6, y: 0, w: 6, h: 4 },
        { widgetId: 'chart-1', x: 12, y: 0, w: 12, h: 8 }
      ]
    }
  }
];
```

#### Widget Templates
```typescript
// Pre-configured widget templates
export const widgetTemplates: WidgetTemplate[] = [
  {
    id: 'sales-chart',
    name: 'Sales Performance Chart',
    description: 'Line chart showing sales trends over time',
    widgetType: WidgetType.CHART,
    config: {
      chartType: 'line',
      data: {
        source: 'sales_data',
        xAxis: 'date',
        yAxis: ['revenue', 'units_sold']
      },
      options: {
        showLegend: true,
        showGrid: true
      }
    }
  }
];
```

## Advanced Features

### 1. Real-Time Updates

#### WebSocket Integration
```typescript
// Real-time widget updates
const useWidgetUpdates = (widgetId: number) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const socket = io('/widget-updates');
    
    socket.on(`widget-${widgetId}`, (newData) => {
      setData(newData);
    });
    
    return () => socket.disconnect();
  }, [widgetId]);
  
  return data;
};
```

### 2. Optimistic Updates

#### Undo/Redo System
```typescript
// Optimistic undo/redo implementation
const handleUndo = useCallback(() => {
  isUndoRedoInProgress.current = true;
  
  const success = undoLastChange();
  
  if (success) {
    setLayoutKey(prev => prev + 1); // Force re-render
    
    setTimeout(() => {
      isUndoRedoInProgress.current = false;
    }, 50);
  }
}, [undoLastChange]);
```

#### Cache Optimization
```typescript
// Widget reference caching for performance
const widgetList = useMemo(() => {
  const filtered = Object.values(widgetsRecord).filter(/* ... */);
  
  const cachedList = filtered.map(widget => {
    const cached = widgetCacheRef.current.get(widget.id);
    
    // Use cached reference if unchanged
    if (cached === widget) {
      return cached;
    }
    
    // Update cache for changed widgets
    widgetCacheRef.current.set(widget.id, widget);
    return widget;
  });
  
  return cachedList;
}, [widgetsRecord]);
```

### 3. Data Integration

#### Dynamic Data Sources
```typescript
// Widget data fetching
const useWidgetData = (widget: WidgetEntity) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const response = await fetch(`/api/widgets/${widget.id}/data`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch widget data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time updates
    const interval = setInterval(fetchData, widget.config.refresh?.interval || 30000);
    
    return () => clearInterval(interval);
  }, [widget.id, widget.config.refresh]);
  
  return { data, loading };
};
```

## Performance Optimizations

### 1. Widget Caching

#### Reference Equality Optimization
```typescript
// Prevent unnecessary re-renders
const WidgetRenderer = React.memo(({ widget, isEditMode }) => {
  return (
    <div className="widget-container">
      {/* Widget content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.widget === nextProps.widget &&
    prevProps.isEditMode === nextProps.isEditMode
  );
});
```

### 2. Layout Optimization

#### Responsive Layout Caching
```typescript
// Cache layouts to prevent recalculation
const layouts: Layouts = useMemo(() => {
  console.log('Recalculating layouts for', widgetList.length, 'widgets');
  
  return {
    xxl: createSmartLayout('xxl'),
    xl: createSmartLayout('xl'),
    lg: createSmartLayout('lg'),
    md: createSmartLayout('md'),
    sm: createSmartLayout('sm'),
    xs: createSmartLayout('xs')
  };
}, [widgetList]);
```

## Common Issues & Solutions

### 1. Layout Performance

**Problem**: Slow rendering with many widgets
**Solution**:
- Implement widget virtualization
- Use React.memo for widget components
- Optimize layout calculations

### 2. Real-Time Updates

**Problem**: Widgets not updating in real-time
**Solution**:
- Implement WebSocket connections
- Add proper error handling
- Use optimistic updates

### 3. Responsive Issues

**Problem**: Widgets not adapting to screen sizes
**Solution**:
- Implement proper breakpoint handling
- Use CSS Grid and Flexbox
- Test across all device sizes

## Future Enhancements

### 1. Advanced Widgets
- **Custom Widget Builder**: Visual widget creation tool
- **Third-Party Integrations**: Connect external data sources
- **AI-Powered Insights**: Automatic data analysis and recommendations

### 2. Collaboration Features
- **Real-Time Collaboration**: Multiple users editing simultaneously
- **Version Control**: Track dashboard changes over time
- **Comments & Annotations**: Add context to widgets

### 3. Advanced Analytics
- **Usage Analytics**: Track widget usage and performance
- **A/B Testing**: Test different dashboard layouts
- **Predictive Analytics**: Forecast trends and patterns
