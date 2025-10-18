import { WidgetEntity, WidgetPosition } from '@/widgets/domain/entities';
import { DashboardLayoutTemplate } from '@/widgets/templates/layout-templates';

/**
 * Apply a layout template to existing widgets
 * Maps widgets to layout slots in order and updates their positions for ALL breakpoints
 */
export function applyLayoutTemplate(
  widgets: WidgetEntity[],
  template: DashboardLayoutTemplate
): WidgetEntity[] {
  console.log(`🎨 [LAYOUT] Applying template "${template.name}" to ${widgets.length} widgets`);
  
  // Sort widgets by current position (top-left to bottom-right) to maintain relative order
  const sortedWidgets = [...widgets].sort((a, b) => {
    const aY = a.position.y || 0;
    const bY = b.position.y || 0;
    if (aY !== bY) return aY - bY; // Sort by Y first
    const aX = a.position.x || 0;
    const bX = b.position.x || 0;
    return aX - bX; // Then by X
  });
  
  // Map widgets to layout slots
  const updatedWidgets: WidgetEntity[] = sortedWidgets.map((widget, index) => {
    // Get the slot for this widget (wrap around if more widgets than slots)
    const slot = template.slots[index % template.slots.length];
    
    if (!slot) {
      console.warn(`⚠️ [LAYOUT] No slot available for widget ${index}, keeping original position`);
      return widget;
    }
    
    // Create new position with layouts for all breakpoints
    const newPosition: WidgetPosition = {
      // Default position (use xxl as default)
      x: slot.positions.xxl.x,
      y: slot.positions.xxl.y,
      w: slot.positions.xxl.w,
      h: slot.positions.xxl.h,
      // Responsive layouts for all breakpoints
      layouts: {
        xxl: slot.positions.xxl,
        xl: slot.positions.xl,
        lg: slot.positions.lg,
        md: slot.positions.md,
        sm: slot.positions.sm,
        xs: slot.positions.xs,
      },
    };
    
    console.log(`✅ [LAYOUT] Widget ${widget.id} → Slot ${slot.id}:`, {
      old: { x: widget.position.x, y: widget.position.y, w: widget.position.w, h: widget.position.h },
      new: { x: newPosition.x, y: newPosition.y, w: newPosition.w, h: newPosition.h },
      breakpoints: Object.keys(newPosition.layouts || {}).length,
    });
    
    return {
      ...widget,
      position: newPosition,
    };
  });
  
  console.log(`🎨 [LAYOUT] Applied "${template.name}" to ${updatedWidgets.length} widgets successfully`);
  
  return updatedWidgets;
}

/**
 * Check if a template is suitable for the number of widgets
 */
export function isTemplateSuitableForWidgets(
  template: DashboardLayoutTemplate,
  widgetCount: number
): { suitable: boolean; reason?: string } {
  // Check minimum
  if (template.minWidgets && widgetCount < template.minWidgets) {
    return {
      suitable: false,
      reason: `Requires at least ${template.minWidgets} widgets (you have ${widgetCount})`,
    };
  }
  
  // Check maximum
  if (template.maxWidgets && widgetCount > template.maxWidgets) {
    return {
      suitable: false,
      reason: `Supports up to ${template.maxWidgets} widgets (you have ${widgetCount})`,
    };
  }
  
  // Check if close to recommended
  const diff = Math.abs(widgetCount - template.recommendedWidgetCount);
  if (diff === 0) {
    return { suitable: true, reason: 'Perfect fit!' };
  }
  
  if (diff <= 2) {
    return { suitable: true, reason: 'Good fit' };
  }
  
  return { suitable: true };
}

/**
 * Get recommended templates for a given number of widgets
 * Sorted by how well they match the widget count
 */
export function getRecommendedTemplates(
  templates: DashboardLayoutTemplate[],
  widgetCount: number
): DashboardLayoutTemplate[] {
  return templates
    .filter(template => {
      const check = isTemplateSuitableForWidgets(template, widgetCount);
      return check.suitable;
    })
    .sort((a, b) => {
      // Sort by closeness to recommended count
      const aDiff = Math.abs(widgetCount - a.recommendedWidgetCount);
      const bDiff = Math.abs(widgetCount - b.recommendedWidgetCount);
      return aDiff - bDiff;
    });
}

