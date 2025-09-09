# Mobile-First Responsive Layout System

A comprehensive, mobile-first responsive layout system designed to provide a native mobile experience while maintaining professional desktop functionality.

## 🚀 Features

### Mobile-First Design
- **Native Mobile Experience**: Optimized for touch interactions with 44px+ touch targets
- **Bottom Navigation**: iOS/Android-style tab bar navigation
- **Floating Action Button**: Quick access to primary actions
- **Smooth Animations**: Framer Motion powered micro-interactions
- **Touch Feedback**: Visual feedback for all touch interactions

### Responsive Breakpoints
- **Mobile**: < 641px (1-2 columns)
- **Tablet**: 641px - 1024px (2-3 columns)
- **Desktop**: 1025px+ (3-6 columns)
- **Foldable**: Landscape tablet optimization

### Layout Components

#### ResponsiveLayout
Main layout wrapper that provides:
- Mobile header with hamburger menu
- Tablet header with collapsible sidebar
- Desktop header with full navigation
- Responsive sidebar overlays
- Mobile bottom navigation

```tsx
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";

function App() {
  return (
    <ResponsiveLayout>
      <YourContent />
    </ResponsiveLayout>
  );
}
```

#### ResponsiveGrid
Flexible grid system with mobile-first approach:

```tsx
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";

<ResponsiveGrid
  variant="dashboard"
  columns={{ mobile: 2, tablet: 3, desktop: 4 }}
  gap="md"
  animation={true}
>
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</ResponsiveGrid>
```

**Props:**
- `variant`: "default" | "dashboard" | "cards" | "list"
- `columns`: Object with mobile, tablet, desktop, wide breakpoints
- `gap`: "sm" | "md" | "lg" | "xl"
- `animation`: Boolean for staggered animations

#### ResponsiveCard
Mobile-optimized card component:

```tsx
import { ResponsiveCard } from "@/components/layout/ResponsiveGrid";

<ResponsiveCard
  variant="elevated"
  size="md"
  hover={true}
  clickable={true}
  onClick={() => console.log('Card clicked')}
>
  <CardContent>Your content</CardContent>
</ResponsiveCard>
```

**Props:**
- `variant`: "default" | "elevated" | "outlined" | "glass"
- `size`: "sm" | "md" | "lg" | "xl"
- `hover`: Boolean for hover effects
- `clickable`: Boolean for click interactions

#### ResponsiveContainer
Container with responsive max-width and padding:

```tsx
import { ResponsiveContainer } from "@/components/layout/ResponsiveGrid";

<ResponsiveContainer maxWidth="2xl" padding="lg" centered>
  <YourContent />
</ResponsiveContainer>
```

### Mobile-Optimized Components

#### MobileButton
Touch-optimized button with loading states:

```tsx
import { MobileButton } from "@/components/layout/MobileOptimizedComponents";

<MobileButton
  variant="default"
  size="lg"
  fullWidth={true}
  loading={isLoading}
  onClick={handleClick}
  className="mobile-touch-feedback"
>
  Click Me
</MobileButton>
```

#### MobileInput
Mobile-optimized input with proper sizing:

```tsx
import { MobileInput } from "@/components/layout/MobileOptimizedComponents";

<MobileInput
  value={value}
  onChange={setValue}
  placeholder="Enter text"
  label="Input Label"
  type="text"
  required
  error={errorMessage}
/>
```

#### MobileCard
Touch-friendly card component:

```tsx
import { MobileCard } from "@/components/layout/MobileOptimizedComponents";

<MobileCard
  title="Card Title"
  subtitle="Card subtitle"
  badge="New"
  clickable={true}
  onClick={handleClick}
  hover={true}
>
  <CardContent>Your content</CardContent>
</MobileCard>
```

#### MobileSearchBar
Enhanced search with filters and sorting:

```tsx
import { MobileSearchBar } from "@/components/layout/MobileOptimizedComponents";

<MobileSearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search..."
  showFilters={true}
  onFilterClick={handleFilter}
  showSort={true}
  onSortClick={handleSort}
  sortDirection="asc"
/>
```

#### MobileAccordion
Collapsible content sections:

```tsx
import { MobileAccordion } from "@/components/layout/MobileOptimizedComponents";

<MobileAccordion
  title="Section Title"
  icon={<Icon className="h-4 w-4" />}
  defaultOpen={true}
>
  <div>Collapsible content</div>
</MobileAccordion>
```

#### MobileList
Touch-optimized list component:

```tsx
import { MobileList } from "@/components/layout/MobileOptimizedComponents";

<MobileList
  items={[
    {
      id: "1",
      title: "Item Title",
      subtitle: "Item subtitle",
      icon: <Icon className="h-4 w-4" />,
      badge: "Badge",
      onClick: () => console.log('Item clicked')
    }
  ]}
  emptyMessage="No items found"
/>
```

## 🎨 CSS Classes

### Mobile-First Utilities

#### Touch Feedback
```css
.mobile-touch-feedback {
  @apply active:scale-95 active:bg-primary/5 transition-transform duration-150 ease-out;
}
```

#### Responsive Grid
```css
.mobile-grid-1 { @apply grid-cols-1; }
.mobile-grid-2 { @apply grid-cols-2; }
.tablet-grid-2 { @apply grid-cols-2; }
.tablet-grid-3 { @apply grid-cols-3; }
.desktop-grid-4 { @apply grid-cols-4; }
.desktop-grid-6 { @apply grid-cols-6; }
```

#### Responsive Text
```css
.mobile-text-sm { @apply text-xs; }
.mobile-text-base { @apply text-sm; }
.mobile-text-lg { @apply text-base; }
.tablet-text-sm { @apply text-sm; }
.tablet-text-base { @apply text-base; }
.tablet-text-lg { @apply text-lg; }
```

#### Responsive Spacing
```css
.mobile-space-y-2 > * + * { @apply mt-2; }
.mobile-space-y-3 > * + * { @apply mt-3; }
.mobile-space-y-4 > * + * { @apply mt-4; }
```

### Breakpoint-Specific Classes

#### Mobile (< 641px)
- Single column layouts
- Large touch targets (44px+)
- Bottom navigation
- Collapsible content

#### Tablet (641px - 1024px)
- 2-3 column layouts
- Collapsible sidebar
- Medium touch targets
- Landscape optimization

#### Desktop (1025px+)
- 3-6 column layouts
- Fixed sidebar
- Hover effects
- Full navigation

## 🎯 Best Practices

### Mobile Design
1. **Touch Targets**: Minimum 44px for all interactive elements
2. **Spacing**: Generous spacing between elements
3. **Typography**: Readable font sizes (16px+ for body text)
4. **Navigation**: Bottom navigation for primary actions
5. **Content**: Stack vertically, avoid horizontal scrolling

### Tablet Design
1. **Grid**: Use 2-3 columns for optimal space usage
2. **Sidebar**: Collapsible for more content space
3. **Touch**: Maintain touch-friendly interactions
4. **Orientation**: Support both portrait and landscape

### Desktop Design
1. **Grid**: Utilize 3-6 columns for complex layouts
2. **Sidebar**: Fixed sidebar for quick navigation
3. **Hover**: Rich hover effects and interactions
4. **Space**: Make use of available screen real estate

### Performance
1. **Animations**: Use `prefers-reduced-motion` for accessibility
2. **Images**: Optimize for different screen densities
3. **Loading**: Show loading states for better UX
4. **Touch**: Use `touch-manipulation` for better touch response

## 📱 Mobile Navigation

### Bottom Navigation
- **Primary Actions**: Most important app functions
- **Icons + Labels**: Clear visual hierarchy
- **Active States**: Visual feedback for current page
- **User Menu**: Profile and settings access

### Floating Action Button
- **Quick Actions**: Primary app actions
- **Context Aware**: Changes based on current page
- **Smooth Animations**: Framer Motion powered
- **Touch Optimized**: Large touch target

## 🔧 Customization

### Theme Integration
The layout system integrates with your existing theme:
- Uses CSS variables for colors
- Supports dark/light mode
- Maintains design consistency
- Responsive to theme changes

### Animation Control
```tsx
// Disable animations for performance
<ResponsiveGrid animation={false} />

// Custom animation timing
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Custom Breakpoints
```tsx
// Custom column configuration
<ResponsiveGrid
  columns={{
    mobile: 1,
    tablet: 2,
    desktop: 4,
    wide: 6
  }}
/>
```

## 🚀 Getting Started

1. **Import Components**:
```tsx
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { MobileButton } from "@/components/layout/MobileOptimizedComponents";
```

2. **Wrap Your App**:
```tsx
function App() {
  return (
    <ResponsiveLayout>
      <YourAppContent />
    </ResponsiveLayout>
  );
}
```

3. **Use Responsive Components**:
```tsx
function Dashboard() {
  return (
    <ResponsiveContainer maxWidth="full" padding="lg">
      <ResponsiveGrid variant="dashboard" columns={{ mobile: 2, tablet: 3, desktop: 4 }}>
        {items.map(item => (
          <MobileCard key={item.id} title={item.title}>
            {item.content}
          </MobileCard>
        ))}
      </ResponsiveGrid>
    </ResponsiveContainer>
  );
}
```

## 📊 Examples

See `MobileFirstExample.tsx` for a comprehensive example of the layout system in action.

## 🎨 Design Guidelines

### Material Design (Android)
- Bottom navigation with 3-5 items
- Floating action button for primary actions
- Card-based layouts with elevation
- Smooth transitions and animations

### Human Interface Guidelines (iOS)
- Tab bar navigation
- Large touch targets
- Clear visual hierarchy
- Native-feeling interactions

### Web Standards
- Progressive enhancement
- Accessibility compliance
- Performance optimization
- Cross-browser compatibility

## 🔍 Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG AA compliance
- **Reduced Motion**: Respects user preferences

## 📈 Performance

- **Lazy Loading**: Components load as needed
- **Optimized Animations**: Hardware accelerated
- **Touch Response**: Immediate feedback
- **Memory Efficient**: Minimal re-renders
- **Bundle Size**: Tree-shakeable components
