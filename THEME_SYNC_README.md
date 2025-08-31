# Theme Synchronization System

## Overview

This document describes the implementation of a theme synchronization system that prioritizes user preferences stored in localStorage while maintaining consistency with the database.

## Features

### 1. **localStorage Priority**
- Theme preferences are saved in localStorage for instant access
- Prevents flickering during page load
- Maintains user's last selected theme across browser sessions

### 2. **Database Synchronization**
- Automatically syncs localStorage theme with database
- Updates database when themes differ
- Maintains consistency across devices for the same user

### 3. **Real-time Updates**
- Theme changes are applied immediately
- Database updates happen in the background
- No interruption to user experience

## Implementation Details

### Core Components

#### 1. **ThemeContext.tsx**
```typescript
// Prioritizes localStorage theme over database theme
const localStorageTheme = localStorage.getItem("theme") as TenantTheme || "system";
const databaseTheme = tenant.theme as TenantTheme;

// Updates database if themes differ
if (localStorageTheme !== databaseTheme) {
    updateDatabaseTheme(localStorageTheme);
}
```

#### 2. **Layout Script**
```html
<script>
// Applies theme immediately to prevent flickering
var theme = localStorage.getItem('theme') || 'system';
var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

if (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}
</script>
```

#### 3. **Theme Toggle Components**
- **Navbar**: Main theme toggle in user dropdown
- **Sidebar**: Theme toggle in sidebar user menu
- **Mobile**: Theme toggle in mobile bottom navigation

### Theme Flow

```
User Changes Theme
        ↓
   Save to localStorage
        ↓
   Apply theme immediately
        ↓
   Update database (if admin)
        ↓
   Sync across components
```

### Database Schema

```prisma
model Tenant {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  theme     String?  // 'light', 'dark', or 'system'
  // ... other fields
}
```

## Usage

### For Users

1. **Change Theme**: Use the theme toggle in the navbar/sidebar
2. **Theme Persistence**: Your preference is saved locally and synced to your account
3. **Cross-device Sync**: Theme preference is available on other devices when you log in

### For Developers

#### Testing Theme Sync

Navigate to `/home/dev` (admin only, development mode) to access the ThemeTester component:

```typescript
import ThemeTester from "@/components/dev/ThemeTester";

// Shows real-time sync status between:
// - localStorage theme
// - database theme  
// - active theme
```

#### Manual Theme Updates

```typescript
import { useTenantTheme } from "@/contexts/ThemeContext";

const { setTheme } = useTenantTheme();

// This automatically:
// 1. Updates localStorage
// 2. Applies theme immediately
// 3. Syncs with database
setTheme("dark");
```

## API Endpoints

### Update Tenant Theme
```http
PATCH /api/tenants/{tenantId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "theme": "dark" | "light" | "system"
}
```

## Configuration

### Environment Variables
- `NODE_ENV`: Must be "development" to access dev tools
- User must have "ADMIN" role to access theme management

### Theme Options
- **light**: Light theme
- **dark**: Dark theme  
- **system**: Follows system preference

## Benefits

1. **Performance**: No flickering during theme changes
2. **User Experience**: Instant theme application
3. **Consistency**: Synchronized across localStorage and database
4. **Reliability**: Fallback to system theme if localStorage fails
5. **Debugging**: Built-in tools for theme synchronization testing

## Troubleshooting

### Theme Not Syncing
1. Check browser console for errors
2. Verify user has admin permissions
3. Check network requests to `/api/tenants/{id}`
4. Use ThemeTester component to debug

### Theme Flickering
1. Ensure layout script runs before React hydration
2. Check localStorage for valid theme values
3. Verify theme context initialization order

### Database Not Updating
1. Check user authentication
2. Verify API endpoint permissions
3. Check network connectivity
4. Review server logs for errors

## Future Enhancements

1. **Theme Presets**: Custom theme configurations
2. **User-specific Themes**: Individual user theme preferences
3. **Theme Scheduling**: Automatic theme changes based on time
4. **Theme Analytics**: Track theme usage patterns
5. **Advanced Sync**: Real-time sync across multiple browser tabs

## Security Considerations

- Only authenticated users can change themes
- Admin role required for database theme updates
- Theme changes are logged for audit purposes
- No sensitive data stored in theme preferences
