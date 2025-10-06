# 🚀 UX Improvements Quick Start Guide

## For Developers: Using the New Features

### 1. **Design Tokens** - Consistent Styling

Replace hardcoded values with design tokens:

```typescript
// ❌ Before (hardcoded)
<div className="p-4 shadow-lg rounded-xl">

// ✅ After (design tokens)
import { designTokens, widgetClasses } from '@/widgets/styles/designTokens';

<div className={widgetClasses.card}>
```

**Common Tokens:**
```typescript
// Spacing
designTokens.spacing.widget.gap       // 1.5rem (24px)
designTokens.spacing.widget.padding   // 1rem (16px)
designTokens.spacing.touch.minTarget  // 44px (WCAG)

// Shadows
designTokens.shadows.sm    // Subtle elevation
designTokens.shadows.lg    // Prominent elevation
designTokens.shadows.glow  // Attention-grabbing

// Transitions
designTokens.transitions.fast  // 150ms
designTokens.transitions.base  // 200ms
designTokens.transitions.slow  // 300ms
```

---

### 2. **Enhanced BaseWidget** - Better UX

Update your widget renderers:

```typescript
// ✅ Full-featured widget with all accessibility improvements
<BaseWidget 
  title={widget.title}
  widgetType={widget.kind}          // Shows "Chart", "KPI", etc.
  widgetId={widget.id}
  isSelected={isSelected}            // Visual selection state
  isEditMode={isEditMode}            // Toggle edit mode
  isDirty={hasUnsavedChanges}       // Shows "Modified" badge
  onEdit={() => openEditor(widget.id)}
  onDelete={() => deleteWidget(widget.id)}
  onDuplicate={() => duplicateWidget(widget)}
>
  {/* Your widget content */}
</BaseWidget>
```

**Keyboard shortcuts** (automatic):
- `Enter` or `Space` → Edit widget
- `Delete` or `Backspace` → Delete widget
- `Cmd+D` / `Ctrl+D` → Duplicate widget

---

### 3. **Mobile-Responsive Editor** - Already Upgraded!

The `WidgetEditorSheet` now automatically adapts:

**Mobile (<768px):**
- Full-screen modal
- Large touch targets (44px+)
- ChevronLeft back button
- Simplified footer

**Desktop (≥768px):**
- Side panel (max-width: 672px)
- X close button
- Keyboard shortcuts visible

**No code changes needed!** Just use the component as before.

---

### 4. **Smart Column Suggestions** - Intelligent Defaults

Auto-suggest optimal column mappings:

```typescript
import { 
  useSmartColumnSuggestions, 
  useSuggestedChartTypes,
  useDataQualityCheck 
} from '@/widgets/hooks/useSmartColumnSuggestions';

function ChartEditor({ columns }) {
  // Get smart suggestions
  const { xAxis, yAxis, reasoning, confidence } = useSmartColumnSuggestions(columns);
  
  // Suggest chart types
  const chartTypes = useSuggestedChartTypes(columns);
  
  // Check data quality
  const { issues, recommendations, isOptimal } = useDataQualityCheck(columns);
  
  // Apply suggestions as defaults
  useEffect(() => {
    if (confidence === 'high' && !userHasMadeChanges) {
      setConfig({
        xAxis,
        yAxis,
        chartType: chartTypes[0]?.type
      });
    }
  }, [xAxis, yAxis, chartTypes]);
  
  return (
    <div>
      {/* Show reasoning to user */}
      <InlineHelp type={confidence === 'high' ? 'success' : 'default'}>
        {reasoning}
      </InlineHelp>
      
      {/* Show recommendations */}
      {recommendations.map(rec => (
        <Alert key={rec.type}>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>{rec.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
```

**What it detects:**
- ✅ Time series (date + numeric columns)
- ✅ Categorical analysis (text + numeric)
- ✅ Correlation patterns (multiple numeric)
- ✅ Keywords: "revenue", "date", "category", "region", etc.

---

### 5. **Contextual Help** - User Guidance

Add inline help to any form field:

```typescript
import { FieldTooltip, ContextualTooltip, InlineHelp } from '@/components/ui/contextual-tooltip';

// Option A: Field with integrated tooltip
<FieldTooltip
  label="X Axis Column"
  description="The column used for category labels on the horizontal axis"
  example="date, month, region, product_name"
>
  <Select {...props} />
</FieldTooltip>

// Option B: Standalone tooltip
<div className="flex items-center gap-2">
  <Label>Processing Mode</Label>
  <ContextualTooltip
    type="help"
    content="Raw: Display data as-is. Aggregated: Group and calculate summary values"
  />
</div>

// Option C: Inline help text
<Input {...props} />
<InlineHelp type="success">
  ✓ Valid email format
</InlineHelp>
```

**Tooltip Types:**
- `info` → Blue info icon
- `help` → Gray help icon (default)
- `tip` → Amber lightbulb
- `warning` → Red alert icon

---

### 6. **Enhanced Loading States** - Better Perceived Performance

Replace generic loading with specific skeletons:

```typescript
import { 
  WidgetSkeleton, 
  WidgetGridSkeleton,
  ToolbarSkeleton 
} from '@/widgets/ui/components/WidgetSkeleton';

// Single widget loading
{isLoading && <WidgetSkeleton variant="chart" />}

// Grid of widgets loading
{isLoading && <WidgetGridSkeleton count={6} />}

// Toolbar loading
{isLoading && <ToolbarSkeleton />}
```

**Skeleton Variants:**
- `chart` → Chart icon + area placeholder
- `table` → Table icon + row placeholders
- `kpi` → Target icon + metric placeholder
- `custom` → Generic content placeholder

**Features:**
- ✅ Shimmer animation (already in globals.css)
- ✅ Fade-in transition
- ✅ Widget-type icons
- ✅ Realistic layout preview

---

## For Designers: Style Customization

### Modify Design Tokens

Edit `/src/widgets/styles/designTokens.ts`:

```typescript
export const designTokens = {
  spacing: {
    widget: {
      gap: 'var(--space-6, 1.5rem)',    // Change widget spacing
      padding: 'var(--space-4, 1rem)',  // Change internal padding
    }
  },
  
  shadows: {
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)', // Modify shadow
  },
  
  // ... all tokens in one place
};
```

### Add New Semantic Colors

```typescript
semanticColors: {
  success: 'text-green-600 dark:text-green-400',
  myCustomColor: 'text-purple-600 dark:text-purple-400', // Add new
}
```

---

## Common Patterns

### Pattern 1: Accessible Form Field

```typescript
<div className="space-y-2">
  <FieldTooltip
    label="Chart Title"
    description="A descriptive name for this visualization"
  >
    <Input
      id="chart-title"
      className={cn(
        editorClasses.input,
        "min-h-[44px]" // WCAG touch target
      )}
      aria-describedby="title-hint"
    />
  </FieldTooltip>
  <InlineHelp id="title-hint">
    Appears at the top of the chart
  </InlineHelp>
</div>
```

### Pattern 2: Smart Auto-Configuration

```typescript
function SmartWidgetEditor({ columns }) {
  const suggestions = useSmartColumnSuggestions(columns);
  const [config, setConfig] = useState({});
  const [userEdited, setUserEdited] = useState(false);

  // Apply smart defaults only if user hasn't edited
  useEffect(() => {
    if (!userEdited && suggestions.confidence === 'high') {
      setConfig({
        xAxis: suggestions.xAxis,
        yAxis: suggestions.yAxis
      });
    }
  }, [suggestions, userEdited]);

  const handleChange = (newConfig) => {
    setUserEdited(true);
    setConfig(newConfig);
  };

  return (
    <div>
      {suggestions.confidence === 'high' && !userEdited && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Auto-configured based on your data: {suggestions.reasoning}
          </AlertDescription>
        </Alert>
      )}
      {/* Form fields */}
    </div>
  );
}
```

### Pattern 3: Progressive Loading

```typescript
function DashboardView() {
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState([]);

  if (isLoading) {
    return (
      <>
        <ToolbarSkeleton />
        <WidgetGridSkeleton count={6} />
      </>
    );
  }

  return (
    <>
      <WidgetToolbar {...props} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map(widget => (
          <WidgetRenderer key={widget.id} widget={widget} />
        ))}
      </div>
    </>
  );
}
```

---

## Testing Checklist

### Accessibility Testing

- [ ] Tab through all interactive elements
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Verify all images have alt text
- [ ] Check color contrast (WCAG 2.1 AA)
- [ ] Test keyboard shortcuts (Enter, Space, Delete, Cmd+D)
- [ ] Verify focus indicators are visible

### Mobile Testing

- [ ] Test on actual devices (iOS/Android)
- [ ] Verify touch targets ≥44px
- [ ] Check editor on portrait/landscape
- [ ] Test drag-and-drop on touch
- [ ] Verify responsive typography

### UX Testing

- [ ] Measure task completion time
- [ ] Track error rates
- [ ] Collect user satisfaction scores
- [ ] A/B test skeleton vs spinner
- [ ] Monitor auto-suggestion accuracy

---

## Performance Tips

1. **Lazy load** contextual tooltips:
```typescript
const ContextualTooltip = dynamic(() => import('@/components/ui/contextual-tooltip'));
```

2. **Memoize** smart suggestions:
```typescript
const suggestions = useMemo(
  () => useSmartColumnSuggestions(columns),
  [columns]
);
```

3. **Debounce** live updates:
```typescript
const debouncedUpdate = useDebouncedCallback(
  (config) => updateWidget(config),
  300
);
```

---

## Need Help?

- 📚 **Full Documentation:** `/UX_IMPROVEMENTS_IMPLEMENTED.md`
- 🎨 **Design Tokens:** `/src/widgets/styles/designTokens.ts`
- 🧰 **Components:** `/src/widgets/ui/components/`
- 🪝 **Hooks:** `/src/widgets/hooks/`

**Happy coding!** 🎉

