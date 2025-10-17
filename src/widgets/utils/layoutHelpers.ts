import { WidgetPosition, Breakpoint, BreakpointPosition, ResponsiveLayouts } from '@/widgets/domain/entities';

/**
 * Get position for a specific breakpoint from widget position
 * Falls back to default position if breakpoint-specific layout doesn't exist
 */
export function getPositionForBreakpoint(
  position: WidgetPosition,
  breakpoint: Breakpoint
): BreakpointPosition {
  // If layouts exist and has breakpoint-specific position, use it
  if (position.layouts && position.layouts[breakpoint]) {
    return position.layouts[breakpoint]!;
  }
  
  // Fallback to default x, y, w, h
  return {
    x: position.x,
    y: position.y,
    w: position.w,
    h: position.h,
  };
}

/**
 * Update position for a specific breakpoint
 * Creates layouts object if it doesn't exist
 */
export function setPositionForBreakpoint(
  position: WidgetPosition,
  breakpoint: Breakpoint,
  newPosition: BreakpointPosition
): WidgetPosition {
  return {
    ...position,
    // Update default position to match the current breakpoint being edited
    x: newPosition.x,
    y: newPosition.y,
    w: newPosition.w,
    h: newPosition.h,
    // Update or create layouts object
    layouts: {
      ...(position.layouts || {}),
      [breakpoint]: newPosition,
    },
  };
}

/**
 * Migrate legacy position format to new format with layouts
 * This ensures backwards compatibility
 */
export function migratePositionToResponsive(position: WidgetPosition): WidgetPosition {
  // If layouts already exist, no migration needed
  if (position.layouts) {
    return position;
  }
  
  // Create default layout for all breakpoints based on current position
  const defaultPosition: BreakpointPosition = {
    x: position.x,
    y: position.y,
    w: position.w,
    h: position.h,
  };
  
  return {
    ...position,
    layouts: {
      xxl: { ...defaultPosition },
      xl: { ...defaultPosition },
      lg: { ...defaultPosition },
      md: { ...defaultPosition },
      sm: { ...defaultPosition },
      xs: { ...defaultPosition },
    },
  };
}

/**
 * Detect current breakpoint based on container width
 */
export function detectBreakpoint(width: number): Breakpoint {
  if (width >= 1600) return 'xxl';
  if (width >= 1200) return 'xl';
  if (width >= 996) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 480) return 'sm';
  return 'xs';
}

/**
 * Check if position has responsive layouts
 */
export function hasResponsiveLayouts(position: WidgetPosition): boolean {
  return !!position.layouts && Object.keys(position.layouts).length > 0;
}

