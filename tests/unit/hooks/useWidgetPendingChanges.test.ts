import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useWidgetPendingChanges } from '@/hooks/useWidgetPendingChanges';
import { BaseWidget } from '@/types/widgets';
import { AppProvider } from '@/contexts/AppContext';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => 
  React.createElement(AppProvider, null, children);

// Mock widget data
const mockWidget: BaseWidget = {
  id: 1,
  type: 'table',
  title: 'Test Widget',
  position: { x: 0, y: 0, width: 4, height: 3 },
  config: {
    dataSource: {
      type: 'table',
      tableId: 1,
      mapping: {
        titleColumn: 'name',
        valueColumn: 'amount'
      }
    }
  },
  isVisible: true,
  order: 1
};

const mockUpdatedWidget: BaseWidget = {
  ...mockWidget,
  title: 'Updated Widget',
  config: {
    ...mockWidget.config,
    dataSource: {
      ...mockWidget.config!.dataSource!,
      mapping: {
        titleColumn: 'updated_name',
        valueColumn: 'updated_amount'
      }
    }
  }
};

describe('useWidgetPendingChanges', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('Initial State', () => {
    it('should initialize with empty pending changes', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      expect(result.current.pendingChanges).toEqual([]);
      expect(result.current.pendingChangesCount).toBe(0);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.hasPendingChange(1, 'update')).toBe(false);
    });
  });

  describe('Adding Pending Changes', () => {
    it('should add a create change', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('create', 1, mockWidget);
      });
      
      expect(result.current.pendingChangesCount).toBe(1);
      expect(result.current.hasPendingChange(1, 'create')).toBe(true);
      expect(result.current.getPendingChange(1, 'create')).toBeDefined();
    });

    it('should add an update change', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('update', 1, mockUpdatedWidget, mockWidget);
      });
      
      expect(result.current.pendingChangesCount).toBe(1);
      expect(result.current.hasPendingChange(1, 'update')).toBe(true);
    });

    it('should add a delete change', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('delete', 1, null, mockWidget);
      });
      
      expect(result.current.pendingChangesCount).toBe(1);
      expect(result.current.hasPendingChange(1, 'delete')).toBe(true);
    });

    it('should deduplicate update changes for the same widget', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('update', 1, { ...mockWidget, title: 'First Update' });
        result.current.addPendingChange('update', 1, { ...mockWidget, title: 'Second Update' });
      });
      
      expect(result.current.pendingChangesCount).toBe(1);
      const change = result.current.getPendingChange(1, 'update');
      expect(change?.data?.title).toBe('Second Update');
    });

    it('should deduplicate update changes for the same field', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('update', 1, mockWidget, undefined, 'title');
        result.current.addPendingChange('update', 1, { ...mockWidget, title: 'Updated Title' }, undefined, 'title');
      });
      
      expect(result.current.pendingChangesCount).toBe(1);
    });

    it('should handle create/delete conflicts by keeping delete', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('create', 1, mockWidget);
        result.current.addPendingChange('delete', 1, null, mockWidget);
      });
      
      expect(result.current.pendingChangesCount).toBe(1);
      expect(result.current.hasPendingChange(1, 'delete')).toBe(true);
      expect(result.current.hasPendingChange(1, 'create')).toBe(false);
    });
  });

  describe('Removing Pending Changes', () => {
    it('should remove a pending change', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('update', 1, mockWidget);
      });
      
      expect(result.current.pendingChangesCount).toBe(1);
      
      act(() => {
        result.current.removePendingChange(1, 'update');
      });
      
      expect(result.current.pendingChangesCount).toBe(0);
      expect(result.current.hasPendingChange(1, 'update')).toBe(false);
    });

    it('should remove a pending change by field path', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('update', 1, mockWidget, undefined, 'title');
        result.current.addPendingChange('update', 1, mockWidget, undefined, 'config');
      });
      
      expect(result.current.pendingChangesCount).toBe(2);
      
      act(() => {
        result.current.removePendingChange(1, 'update', 'title');
      });
      
      expect(result.current.pendingChangesCount).toBe(1);
      expect(result.current.hasPendingChange(1, 'update')).toBe(true);
    });
  });

  describe('Merging Pending Changes', () => {
    it('should merge multiple changes for the same widget', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('update', 1, { ...mockWidget, title: 'First' }, undefined, 'title');
        result.current.addPendingChange('update', 1, { ...mockWidget, title: 'Second' }, undefined, 'title');
        result.current.addPendingChange('update', 1, { ...mockWidget, config: { ...mockWidget.config } }, undefined, 'config');
      });
      
      expect(result.current.pendingChangesCount).toBe(3);
      
      act(() => {
        result.current.mergePendingChanges(1);
      });
      
      // Should consolidate to latest changes per field
      expect(result.current.pendingChangesCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Clearing Pending Changes', () => {
    it('should clear all pending changes', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('create', 1, mockWidget);
        result.current.addPendingChange('update', 2, mockWidget);
        result.current.addPendingChange('delete', 3, null, mockWidget);
      });
      
      expect(result.current.pendingChangesCount).toBe(3);
      
      act(() => {
        result.current.clearPendingChanges();
      });
      
      expect(result.current.pendingChangesCount).toBe(0);
    });
  });

  describe('Saving Pending Changes', () => {
    it('should handle successful save', async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();
      
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      const { result } = renderHook(() => useWidgetPendingChanges({
        onSuccess,
        onError
      }), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('create', 1, mockWidget);
      });
      
      expect(result.current.pendingChangesCount).toBe(1);
      
      await act(async () => {
        await result.current.savePendingChanges(1);
      });
      
      expect(result.current.pendingChangesCount).toBe(0);
      expect(onSuccess).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle save error', async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();
      
      // Mock fetch to return error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500
      });
      
      const { result } = renderHook(() => useWidgetPendingChanges({
        onSuccess,
        onError
      }), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('create', 1, mockWidget);
      });
      
      await act(async () => {
        await result.current.savePendingChanges(1);
      });
      
      expect(onError).toHaveBeenCalledWith('Failed to save changes: 500');
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle no pending changes', async () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      await act(async () => {
        await result.current.savePendingChanges(1);
      });
      
      // Should not make any API calls
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Discarding Pending Changes', () => {
    it('should discard all pending changes', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('create', 1, mockWidget);
        result.current.addPendingChange('update', 2, mockWidget);
      });
      
      expect(result.current.pendingChangesCount).toBe(2);
      
      act(() => {
        result.current.discardPendingChanges();
      });
      
      expect(result.current.pendingChangesCount).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple widgets with same change type', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('update', 1, mockWidget);
        result.current.addPendingChange('update', 2, mockWidget);
      });
      
      expect(result.current.pendingChangesCount).toBe(2);
      expect(result.current.hasPendingChange(1, 'update')).toBe(true);
      expect(result.current.hasPendingChange(2, 'update')).toBe(true);
    });

    it('should handle very large numbers of changes', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addPendingChange('update', i, { ...mockWidget, id: i });
        }
      });
      
      expect(result.current.pendingChangesCount).toBe(100);
    });

    it('should handle null/undefined data gracefully', () => {
      const { result } = renderHook(() => useWidgetPendingChanges(), {
        wrapper: TestWrapper
      });
      
      act(() => {
        result.current.addPendingChange('update', 1, undefined as any);
        result.current.addPendingChange('delete', 2, null);
      });
      
      expect(result.current.pendingChangesCount).toBe(2);
    });
  });
});
