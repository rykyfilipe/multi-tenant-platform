<!-- @format -->

# Analytics Dashboard System

A comprehensive, modern analytics dashboard built with React, TypeScript, and
Recharts. This system provides real-time insights, KPIs, and performance metrics
for multi-tenant platforms.

## 🚀 Features

### Data Processing

- **Raw Data Processing**: Transforms raw dashboard data into meaningful KPIs
  and metrics
- **Real-time Calculations**: Computes growth rates, percentages, trends, and
  health scores
- **Time Series Generation**: Creates historical data for trend analysis
- **Distribution Analysis**: Analyzes data distribution patterns and rankings

### KPIs & Metrics

- **Core Metrics**: Databases, tables, rows, users, engagement rates
- **Growth Metrics**: Weekly/monthly growth trends and rates
- **Performance Metrics**: Response time, uptime, error rates, throughput
- **Health Scores**: Overall system health with component-level scoring
- **Resource Utilization**: Memory, storage, and system resource usage

### Visualizations

- **KPI Cards**: Animated metric cards with trend indicators
- **Line/Area Charts**: Time-series data visualization
- **Bar Charts**: Resource usage and comparative data
- **Pie Charts**: Distribution and percentage breakdowns
- **Radar Charts**: Multi-dimensional performance analysis
- **Top Lists**: Rankings and leaderboards

### UI/UX Features

- **Responsive Design**: Optimized for all screen sizes
- **Smooth Animations**: Framer Motion powered transitions
- **Dark/Light Theme**: Full theme support with system colors
- **Tab Navigation**: Organized content in logical sections
- **Export Functionality**: JSON data export capability
- **Loading States**: Skeleton loading and error handling

## 📁 File Structure

```
src/components/analytics/
├── AnalyticsDashboard.tsx    # Main dashboard orchestrator
├── KPICard.tsx              # Metric cards with animations
├── OverviewChart.tsx        # Line/area charts for trends
├── ResourceUsageChart.tsx   # Horizontal bar charts
├── DistributionChart.tsx    # Pie charts for distributions
├── TrendChart.tsx           # Combined line/bar charts
├── PerformanceChart.tsx     # Radar charts for performance
├── TopItemsList.tsx         # Ranked lists and leaderboards
├── index.ts                 # Component exports
└── README.md               # This documentation

src/hooks/
└── useProcessedAnalyticsData.ts  # Data processing hook
```

## 🔧 Components

### AnalyticsDashboard

Main dashboard component that orchestrates all analytics views.

**Features:**

- Tab-based navigation (Overview, Resources, Users, Performance, Trends)
- Time filter selection (7d, 30d, 90d, 1y)
- Export and refresh functionality
- Responsive grid layouts

### KPICard

Displays key performance indicators with trend information.

**Props:**

- `title`: Card title
- `value`: Main metric value
- `icon`: Lucide icon component
- `change`: Percentage change (optional)
- `changeType`: "increase" | "decrease" | "neutral"
- `unit`: Value unit (optional)
- `color`: Theme color variant

### Chart Components

Specialized chart components for different data types:

- **OverviewChart**: Line/area charts for time-series data
- **ResourceUsageChart**: Horizontal bar charts for resource utilization
- **DistributionChart**: Pie charts for data distribution
- **TrendChart**: Combined charts with trend indicators
- **PerformanceChart**: Radar charts for multi-dimensional analysis
- **TopItemsList**: Ranked lists with avatars and status indicators

## 📊 Data Structure

### ProcessedAnalyticsData Interface

```typescript
interface ProcessedAnalyticsData {
	raw: any; // Original dashboard data
	kpis: KPIMetrics; // Calculated KPIs
	growth: GrowthMetrics; // Growth rates and trends
	distributions: Distributions; // Data distributions
	rankings: Rankings; // Top performers
	timeSeriesData: TimeSeries; // Historical data
	performance: Performance; // System performance
	health: HealthScores; // Health indicators
}
```

### Key Metrics Calculated

- **Engagement Rate**: Active users / Total users \* 100
- **Resource Utilization Score**: Weighted average of resource usage
- **Growth Rates**: Weekly/monthly percentage increases
- **Health Scores**: Component-specific health indicators (0-100)
- **Distribution Percentages**: Relative size and usage patterns

## 🎨 Styling & Theming

### Color System

Uses the project's OKLCH color system:

- `bg-background`, `bg-card`: Background colors
- `text-foreground`, `text-muted-foreground`: Text colors
- `bg-primary`: Primary accent color
- `border-border`: Border colors

### Component Colors

- **Blue**: Primary metrics, databases
- **Green**: Positive trends, storage
- **Orange**: Warnings, users
- **Red**: Errors, over-limits
- **Purple**: Advanced metrics
- **Gray**: Neutral states

### Responsive Breakpoints

- **Mobile**: Single column layouts
- **Tablet**: 2-column grids
- **Desktop**: 3-4 column layouts
- **Large**: 6-column KPI grids

## 🔄 Animations

### Framer Motion Integration

- **Page Load**: Staggered component appearance
- **Hover Effects**: Subtle scale and shadow transitions
- **Loading States**: Skeleton animations
- **Chart Animations**: Smooth data transitions

### Animation Timing

- **Delay Patterns**: 0.1s increments for staggered effects
- **Duration**: 0.3-0.6s for smooth transitions
- **Easing**: Natural motion curves

## 📱 Responsive Design

### Grid Systems

```css
/* KPI Cards */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6

/* Charts */
grid-cols-1 lg:grid-cols-2

/* Details */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

### Mobile Optimizations

- Condensed layouts
- Touch-friendly interactions
- Optimized chart sizes
- Simplified navigation

## 🚀 Usage

### Basic Implementation

```tsx
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

function AnalyticsPage() {
	return <AnalyticsDashboard />;
}
```

### Custom Hook Usage

```tsx
import { useProcessedAnalyticsData } from "@/hooks/useProcessedAnalyticsData";

function CustomAnalytics() {
	const { data, loading, error } = useProcessedAnalyticsData();

	if (loading) return <LoadingSpinner />;
	if (error) return <ErrorMessage error={error} />;

	return (
		<div>
			<KPICard
				title='Total Users'
				value={data.kpis.totalUsers}
				icon={Users}
				color='blue'
			/>
		</div>
	);
}
```

## 🔧 Customization

### Adding New Metrics

1. Extend `ProcessedAnalyticsData` interface
2. Add calculation logic in `useProcessedAnalyticsData`
3. Create new chart components if needed
4. Update dashboard layout

### Custom Chart Types

```tsx
// Create new chart component
export const CustomChart: React.FC<CustomChartProps> = ({ data, ...props }) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: props.delay }}>
			<Card>{/* Chart implementation */}</Card>
		</motion.div>
	);
};
```

### Theme Customization

Modify color mappings in individual components or create theme variants.

## 📈 Performance

### Optimizations

- **Lazy Loading**: Heavy components loaded on demand
- **Memoization**: Expensive calculations cached
- **Skeleton Loading**: Immediate UI feedback
- **Progressive Enhancement**: Essential data first

### Bundle Size

- **Recharts**: ~200KB (charts)
- **Framer Motion**: ~100KB (animations)
- **Component Code**: ~50KB

## 🧪 Testing

### Component Testing

```bash
# Test individual components
npm test -- --testPathPattern=analytics

# Test data processing
npm test -- --testPathPattern=useProcessedAnalyticsData
```

### Integration Testing

- Dashboard rendering with mock data
- Chart interactions and responsiveness
- Animation performance
- Theme switching

## 🚀 Deployment

### Build Optimization

- Tree shaking for unused chart components
- Code splitting for lazy-loaded components
- Asset optimization for icons and images

### Performance Monitoring

- Chart render times
- Animation frame rates
- Data processing duration
- Memory usage patterns

## 📚 Dependencies

### Core Dependencies

- `react`: UI framework
- `typescript`: Type safety
- `recharts`: Chart library
- `framer-motion`: Animations
- `lucide-react`: Icons

### UI Components

- Custom UI component library
- Tailwind CSS for styling
- Radix UI primitives

## 🤝 Contributing

### Code Standards

- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component documentation

### Adding Features

1. Create feature branch
2. Implement with tests
3. Update documentation
4. Submit pull request

---

Built with ❤️ for modern analytics experiences.
