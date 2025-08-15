<!-- @format -->

# Multiple Reference Selection - UI Examples

## Overview

This document showcases the improved UI for the multiple reference selection
feature, demonstrating the enhanced user experience and visual design.

## UI Components

### 1. MultipleReferenceSelect Component

#### Main Trigger Button

- **Rounded corners** (`rounded-lg`) for modern appearance
- **Hover effects** with subtle shadows and border changes
- **Smooth transitions** (`transition-all duration-200`)
- **Focus states** with ring indicators

#### Selected Items Display

- **Primary-colored badges** with hover effects
- **Individual remove buttons** (X) on each badge
- **Counter badge** showing "+X more" for additional items
- **Responsive layout** that adapts to content

#### Dropdown Menu

- **High z-index** (`z-[9999]`) to appear above all other components
- **Enhanced shadows** (`shadow-2xl`) for depth
- **Improved spacing** and padding for better readability
- **Search input** with better styling and focus states

#### Option Items

- **Checkbox-style indicators** for multiple selection mode
- **Hover effects** with smooth transitions
- **Selected state highlighting** with primary colors
- **Keyboard navigation** support with visual feedback

### 2. Cell Display Enhancement

#### Multiple References in Cells

- **Compact display**: Shows first reference + count (e.g., "User 1 +2 more")
- **Hover tooltip**: Displays all references in an elegant overlay
- **Badge numbering**: Each reference gets a numbered badge
- **Responsive layout**: Adapts to available space

#### Tooltip Features

- **High z-index** to appear above other content
- **Arrow indicator** pointing to the cell
- **Structured layout** with clear visual hierarchy
- **Hover activation** for non-intrusive interaction

## Visual Design Improvements

### Color Scheme

- **Primary colors** for selected states and highlights
- **Muted backgrounds** for secondary information
- **Consistent borders** and shadows throughout
- **Hover states** with subtle color changes

### Typography

- **Font weights** for better hierarchy
- **Text sizes** optimized for readability
- **Truncation** with ellipsis for long content
- **Consistent spacing** between elements

### Spacing and Layout

- **Increased padding** for better touch targets
- **Consistent gaps** between related elements
- **Responsive sizing** that adapts to content
- **Visual grouping** of related information

## Interaction Patterns

### Selection Behavior

1. **Click to open** dropdown
2. **Search and filter** options
3. **Click to select/deselect** individual items
4. **Visual feedback** for all interactions
5. **Keyboard navigation** support

### Hover Interactions

1. **Hover over cell** to see tooltip
2. **Hover over badges** for enhanced styling
3. **Hover over options** for selection feedback
4. **Smooth transitions** between states

### Accessibility Features

- **Keyboard navigation** (Arrow keys, Enter, Escape)
- **Screen reader** support with proper ARIA labels
- **Focus indicators** for all interactive elements
- **High contrast** for better visibility

## Code Examples

### Basic Usage

```tsx
<MultipleReferenceSelect
	value={selectedValues}
	onValueChange={handleValueChange}
	options={referenceOptions}
	placeholder='Select references'
	referencedTableName='Users'
	isMultiple={true}
/>
```

### Tooltip Integration

```tsx
{
	column.isMultiple && Array.isArray(value) && value.length > 0 && (
		<MultipleReferencesTooltip
			value={value}
			referenceTable={referenceTable}
			column={column}
		/>
	);
}
```

## Responsive Design

### Mobile Considerations

- **Touch-friendly** button sizes
- **Scrollable** dropdown content
- **Optimized spacing** for small screens
- **Gesture support** for mobile interactions

### Desktop Enhancements

- **Hover states** for better UX
- **Keyboard shortcuts** for power users
- **Large dropdown** for better overview
- **Multi-column** information display

## Performance Optimizations

### Rendering

- **Memoized** component updates
- **Conditional rendering** for tooltips
- **Efficient re-renders** with proper dependencies
- **Lazy loading** of heavy content

### Interactions

- **Debounced** search input
- **Optimized** event handlers
- **Smooth animations** with CSS transitions
- **Efficient** DOM updates

## Future Enhancements

### Planned Improvements

1. **Virtual scrolling** for large datasets
2. **Advanced filtering** options
3. **Bulk operations** interface
4. **Custom themes** support
5. **Animation presets** for different use cases

### User Experience

1. **Drag and drop** reordering
2. **Context menus** for quick actions
3. **Keyboard shortcuts** customization
4. **Accessibility** improvements
5. **Internationalization** support
