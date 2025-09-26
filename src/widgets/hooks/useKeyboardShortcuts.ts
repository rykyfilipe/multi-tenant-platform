import { useEffect, useCallback } from 'react';
import { WidgetKind } from '@/generated/prisma';

export interface KeyboardShortcutsConfig {
  onAddWidget?: (kind: WidgetKind) => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSelectAll?: () => void;
  onEscape?: () => void;
  onSearch?: () => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    const { ctrlKey, metaKey, shiftKey, key } = event;
    const isModifierPressed = ctrlKey || metaKey;

    // Prevent default for our shortcuts
    const preventDefault = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    switch (key.toLowerCase()) {
      // Widget creation shortcuts
      case 'c':
        if (isModifierPressed && shiftKey) {
          preventDefault();
          config.onAddWidget?.(WidgetKind.CHART);
        }
        break;
      case 't':
        if (isModifierPressed && shiftKey) {
          preventDefault();
          config.onAddWidget?.(WidgetKind.TABLE);
        }
        break;
      case 'k':
        if (isModifierPressed && shiftKey) {
          preventDefault();
          config.onAddWidget?.(WidgetKind.KPI);
        }
        break;
      case 'w':
        if (isModifierPressed && shiftKey) {
          preventDefault();
          config.onAddWidget?.(WidgetKind.WEATHER);
        }
        break;
      case 'l':
        if (isModifierPressed && shiftKey) {
          preventDefault();
          config.onAddWidget?.(WidgetKind.CLOCK);
        }
        break;
      case 'u':
        if (isModifierPressed && shiftKey) {
          preventDefault();
          config.onAddWidget?.(WidgetKind.CUSTOM);
        }
        break;

      // General shortcuts
      case 's':
        if (isModifierPressed) {
          preventDefault();
          config.onSave?.();
        }
        break;
      case 'z':
        if (isModifierPressed && !shiftKey) {
          preventDefault();
          config.onUndo?.();
        } else if (isModifierPressed && shiftKey) {
          preventDefault();
          config.onRedo?.();
        }
        break;
      case 'a':
        if (isModifierPressed) {
          preventDefault();
          config.onSelectAll?.();
        }
        break;
      case 'd':
        if (isModifierPressed) {
          preventDefault();
          config.onDuplicate?.();
        }
        break;
      case 'delete':
      case 'backspace':
        if (isModifierPressed) {
          preventDefault();
          config.onDelete?.();
        }
        break;
      case 'escape':
        config.onEscape?.();
        break;
      case '/':
        if (!isModifierPressed) {
          preventDefault();
          config.onSearch?.();
        }
        break;
    }
  }, [config]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
