# Tour System Developer Guide

This guide explains how to add, edit, and manage tours in the YDV SaaS application.

## Overview

The tour system is built with `react-joyride` and provides a professional, premium-grade guided tour experience. It includes:

- **Element existence checks** with retries and timeouts
- **Contextual tours** for different user roles and features
- **Database persistence** for tour completion tracking
- **Premium UI/UX** with animations and modern styling
- **Non-blocking flow** with skip, pause, and resume capabilities

## Architecture

### Core Components

- **`TourManager`** - Main orchestrator component
- **`HelpMenu`** - Tour management interface
- **Tour configurations** - Individual tour definitions
- **API endpoints** - User preferences management

### File Structure

```
src/
├── components/tours/
│   ├── TourManager.tsx          # Main tour orchestrator
│   └── HelpMenu.tsx             # Tour management UI
├── tours/
│   ├── dashboard-tour.ts        # Dashboard tour configuration
│   ├── invoice-tour.ts          # Invoice management tour
│   ├── database-tour.ts         # Database management tour
│   ├── users-tour.ts            # User management tour
│   ├── settings-tour.ts         # Settings tour
│   └── index.ts                 # Tour registry
└── app/api/users/[userId]/preferences/
    └── route.ts                 # User preferences API
```

## Adding a New Tour

### 1. Create Tour Configuration

Create a new file in `src/tours/` (e.g., `new-feature-tour.ts`):

```typescript
import { Step } from 'react-joyride';
import { IconName } from 'lucide-react';

export const newFeatureTour: Step[] = [
  {
    target: '[data-tour-id="feature-header"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <IconName className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Feature Title</h3>
            <p className="text-sm text-gray-600">Feature description</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Detailed explanation of the feature and how to use it.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Pro Tip:</strong> Helpful tip for users.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  // Add more steps...
];

export const newFeatureTourConfig = {
  id: 'new-feature',
  name: 'New Feature Tour',
  description: 'Learn how to use the new feature',
  steps: newFeatureTour,
  roles: ['ADMIN', 'EDITOR'], // Optional: restrict to specific roles
  features: ['feature-name'], // Optional: require specific features
  autoStart: true, // Optional: auto-start on page load
  priority: 5 // Optional: higher number = higher priority
};
```

### 2. Register the Tour

Add your tour to `src/tours/index.ts`:

```typescript
import { newFeatureTourConfig } from './new-feature-tour';

export const allTours: TourConfig[] = [
  dashboardTourConfig,
  invoiceTourConfig,
  databaseTourConfig,
  usersTourConfig,
  settingsTourConfig,
  newFeatureTourConfig, // Add your tour here
];
```

### 3. Add Data Tour IDs

Add `data-tour-id` attributes to your UI elements:

```tsx
<div data-tour-id="feature-header">
  <h1>Feature Title</h1>
  <p>Feature description</p>
</div>

<button data-tour-id="feature-action">
  Action Button
</button>
```

### 4. Integrate with Page

Add the TourManager to your page component:

```tsx
import { TourManager } from '@/components/tours/TourManager';
import { allTours } from '@/tours';

export default function MyPage() {
  const { user, tenant } = useApp();
  
  return (
    <div>
      {/* Your page content */}
      
      <TourManager
        tours={allTours}
        currentPage="new-feature"
        userRole={user?.role}
        enabledFeatures={tenant?.enabledModules || []}
        onTourComplete={(tourId) => {
          console.log(`Tour ${tourId} completed`);
        }}
        onTourSkip={(tourId) => {
          console.log(`Tour ${tourId} skipped`);
        }}
      />
    </div>
  );
}
```

## Tour Configuration Options

### Step Configuration

Each tour step supports these options:

```typescript
{
  target: string,              // CSS selector for the target element
  content: React.ReactNode,    // Content to display
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center',
  disableBeacon?: boolean,     // Disable the beacon (pulsing dot)
  styles?: object,            // Custom styles
  spotlightPadding?: number,   // Padding around highlighted element
  disableOverlay?: boolean,    // Disable the overlay
  hideCloseButton?: boolean,   // Hide the close button
  hideFooter?: boolean,        // Hide the footer with navigation
}
```

### Tour Configuration

```typescript
{
  id: string,                  // Unique tour identifier
  name: string,                // Display name
  description: string,         // Short description
  steps: Step[],              // Array of tour steps
  roles?: string[],           // Optional: restrict to user roles
  features?: string[],        // Optional: require enabled features
  autoStart?: boolean,        // Auto-start on page load
  priority?: number,          // Priority (higher = more important)
}
```

## Best Practices

### 1. Element Targeting

- Use `data-tour-id` attributes instead of CSS classes
- Make selectors specific and stable
- Test that elements exist before targeting them

```tsx
// ✅ Good
<div data-tour-id="feature-header">

// ❌ Avoid
<div className="header"> // Classes can change
```

### 2. Content Design

- Keep content concise and actionable
- Use consistent styling with the design system
- Include helpful tips and pro tips
- Use icons to make content more engaging

### 3. Step Flow

- Start with an overview step
- Guide users through logical workflows
- End with a summary or next steps
- Keep steps focused on one concept each

### 4. Responsive Design

- Test tours on different screen sizes
- Use responsive placement options
- Consider mobile-specific interactions

## Troubleshooting

### Common Issues

1. **Element not found**
   - Check that `data-tour-id` attributes are correctly added
   - Ensure elements are rendered before tour starts
   - Use the element existence checker in TourManager

2. **Tour not starting**
   - Verify tour is registered in `allTours` array
   - Check role and feature restrictions
   - Ensure `autoStart` is set to `true` if needed

3. **Styling issues**
   - Use the provided content structure
   - Follow the design system patterns
   - Test with different themes

### Debug Mode

Enable debug mode by adding this to your component:

```tsx
<TourManager
  tours={allTours}
  currentPage="your-page"
  debug={true} // Add this for debugging
  // ... other props
/>
```

## API Reference

### TourManager Props

```typescript
interface TourManagerProps {
  tours: TourConfig[];           // Available tours
  currentPage: string;           // Current page identifier
  userRole?: string;             // User's role
  enabledFeatures?: string[];    // Enabled features
  onTourComplete?: (tourId: string) => void;
  onTourSkip?: (tourId: string) => void;
  debug?: boolean;               // Enable debug mode
}
```

### User Preferences API

The system automatically tracks tour completion in the database:

```typescript
// GET /api/users/[userId]/preferences
{
  tourDashboardDone: boolean,
  tourInvoiceDone: boolean,
  tourDatabaseDone: boolean,
  tourUsersDone: boolean,
  tourSettingsDone: boolean,
  tourAnalyticsDone: boolean,
  // ... other preferences
}

// PATCH /api/users/[userId]/preferences
{
  tourNewFeatureDone: true // Add new tour completion fields
}
```

## Examples

### Simple Feature Tour

```typescript
export const simpleFeatureTour: Step[] = [
  {
    target: '[data-tour-id="feature-button"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">New Feature</h3>
        <p>Click this button to access the new feature.</p>
      </div>
    ),
    placement: 'bottom',
  },
];
```

### Complex Workflow Tour

```typescript
export const complexWorkflowTour: Step[] = [
  {
    target: '[data-tour-id="workflow-start"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Workflow Overview</h3>
            <p className="text-sm text-gray-600">Let's walk through this process</p>
          </div>
        </div>
        <p>This workflow helps you accomplish X by following these steps...</p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Pro Tip:</strong> You can skip this tour anytime.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  // Add more steps...
];
```

## Contributing

When adding new tours:

1. Follow the established patterns
2. Test on different screen sizes
3. Ensure accessibility compliance
4. Update this guide if adding new features
5. Add appropriate role and feature restrictions

For questions or issues, contact the development team or create an issue in the repository.
