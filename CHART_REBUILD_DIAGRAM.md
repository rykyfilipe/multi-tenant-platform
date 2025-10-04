# Chart Widget Rebuild - Visual Architecture

## New Widget Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHART WIDGET EDITOR                          │
│                     (Wizard-Style UX)                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┬─────────────────┬─────────────────┐
│   TAB 1: DATA   │  TAB 2: STYLE   │ TAB 3: SETTINGS │
├─────────────────┼─────────────────┼─────────────────┤
│                 │                 │                 │
│ Data Source     │ Theme Selection │ Chart Type      │
│ ├─ Database     │ ├─ 5 Themes     │ ├─ Line         │
│ └─ Table        │ └─ Custom       │ ├─ Bar          │
│                 │                 │ ├─ Area         │
│ Columns         │ Colors          │ ├─ Pie          │
│ ├─ X Axis       │ ├─ Background   │ ├─ Radar        │
│ └─ Y Axis       │ ├─ Text         │ └─ Scatter      │
│   (multi-select)│ ├─ Grid         │                 │
│                 │ └─ Border       │ Refresh         │
│ Processing Mode │                 │ Interval        │
│ ├─ Raw          │ Typography      │                 │
│ └─ Aggregated   │ ├─ Font Size    │                 │
│   ├─ Group By   │ └─ Weight       │                 │
│   └─ Function   │                 │                 │
│                 │ Layout          │                 │
│ Filters         │ ├─ Padding      │                 │
│ ├─ Add Filter   │ └─ Border Rad.  │                 │
│ └─ Clear All    │                 │                 │
│                 │ Effects         │                 │
│ Top N           │ ├─ Shadow       │                 │
│ ├─ Enable       │ ├─ Glass        │                 │
│ ├─ Count        │ ├─ Shine        │                 │
│ └─ Auto-sort    │ └─ Glow         │                 │
└─────────────────┴─────────────────┴─────────────────┘

                    │
                    ▼

┌─────────────────────────────────────────────────────────────────┐
│                    DATA PIPELINE                                │
│                   (Simplified Flow)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   1. SELECT │───▶│   2. FILTER │───▶│  3. PROCESS │
│  & NORMALIZE│    │   (User     │    │             │
│   (API/DB)  │    │  Filters)   │    │ Raw Mode:   │
│             │    │             │    │ └─ Use Y    │
│             │    │             │    │    Axis     │
│             │    │             │    │             │
│             │    │             │    │ Aggregated: │
│             │    │             │    │ ├─ Group By │
│             │    │             │    │ └─ Function │
└─────────────┘    └─────────────┘    └─────────────┘
                                               │
                                               ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   4. TOP N  │◀───│   5. MAP    │◀───│  6. VALIDATE│
│  (Optional) │    │  TO CHART   │    │   & SORT    │
│             │    │             │    │             │
│ Auto-sort   │    │ Chart-ready │    │ Schema      │
│ on first    │    │ data points │    │ validation  │
│ Y column    │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │     CHART RENDER    │
                │   (Recharts/Chart.js)│
                └─────────────────────┘
```

## Key Improvements

### 1. UI Consolidation
- **Eliminated Redundancies**: No more duplicate Y Axis vs Aggregation Columns
- **Logical Grouping**: Related settings grouped in tabs
- **Smart Defaults**: Auto-detect first text column as X, first numeric as Y

### 2. Simplified Data Pipeline
- **Clear Steps**: 6-step process with single responsibility per step
- **Mode Simplification**: Raw mode doesn't need Processing Mode toggle
- **Automatic Sorting**: Top N uses first Y column for sorting by default

### 3. Type Safety & Validation
```
interface ChartConfig {
  dataSource: {
    databaseId: string;
    tableId: string;
  };
  mappings: {
    x: string;
    y: string[];
  };
  processing: {
    mode: 'raw' | 'aggregated';
    groupBy?: string;
    aggregationFunction?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  };
  filters: FilterConfig[];
  topN?: {
    enabled: boolean;
    count: number;
    autoSort: boolean;
  };
  style: StyleConfig;
  settings: SettingsConfig;
}
```

### 4. Wizard-Style UX
1. **Step 1**: Choose Data Source (Database + Table)
2. **Step 2**: Select Columns (X + Y with smart suggestions)
3. **Step 3**: Choose Processing Mode
   - If Aggregated → Step 3a: Group By + Function
4. **Step 4**: Configure Filters (optional)
5. **Step 5**: Preview & Finish

### 5. Smart Features
- **Live Preview**: Chart updates immediately on config changes
- **Tooltips**: Explanatory help for each input
- **Validation**: Real-time validation with clear error messages
- **Auto-suggestions**: Smart column type detection and recommendations
