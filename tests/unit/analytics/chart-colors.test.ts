/** @format */

import { getChartColor, getChartColors, getGradientColor, getStatusColor } from '@/lib/chart-colors';

describe('Chart Colors', () => {
  describe('getChartColor', () => {
    it('returns correct color for valid index', () => {
      expect(getChartColor(0)).toBe('#3b82f6'); // blue-500
      expect(getChartColor(1)).toBe('#10b981'); // emerald-500
      expect(getChartColor(2)).toBe('#f59e0b'); // amber-500
      expect(getChartColor(3)).toBe('#ef4444'); // red-500
      expect(getChartColor(4)).toBe('#8b5cf6'); // violet-500
    });

    it('cycles through colors when index exceeds available colors', () => {
      expect(getChartColor(10)).toBe('#3b82f6'); // Should cycle back to first color
      expect(getChartColor(11)).toBe('#10b981'); // Second color
      expect(getChartColor(20)).toBe('#3b82f6'); // Should cycle back to first color
    });

    it('handles negative index', () => {
      expect(getChartColor(-1)).toBe('#3b82f6'); // Should return first color
      expect(getChartColor(-5)).toBe('#3b82f6'); // Should return first color
    });

    it('handles large index values', () => {
      expect(getChartColor(100)).toBe('#3b82f6'); // Should cycle back to first color
      expect(getChartColor(1000)).toBe('#3b82f6'); // Should cycle back to first color
    });
  });

  describe('getChartColors', () => {
    it('returns correct number of colors for given count', () => {
      const colors = getChartColors(5);
      expect(colors).toHaveLength(5);
      expect(colors[0]).toBe('#3b82f6');
      expect(colors[1]).toBe('#10b981');
      expect(colors[2]).toBe('#f59e0b');
      expect(colors[3]).toBe('#ef4444');
      expect(colors[4]).toBe('#8b5cf6');
    });

    it('returns empty array for zero count', () => {
      const colors = getChartColors(0);
      expect(colors).toHaveLength(0);
    });

    it('returns empty array for negative count', () => {
      const colors = getChartColors(-1);
      expect(colors).toHaveLength(0);
    });

    it('cycles through colors for large counts', () => {
      const colors = getChartColors(10);
      expect(colors).toHaveLength(10);
      expect(colors[0]).toBe('#3b82f6'); // First color
      expect(colors[5]).toBe('#3b82f6'); // Should cycle back to first color
      expect(colors[6]).toBe('#10b981'); // Second color
    });

    it('handles single color request', () => {
      const colors = getChartColors(1);
      expect(colors).toHaveLength(1);
      expect(colors[0]).toBe('#3b82f6');
    });
  });

  describe('getGradientColor', () => {
    it('returns correct gradient for valid index', () => {
      expect(getGradientColor(0)).toBe('url(#gradient-0)');
      expect(getGradientColor(1)).toBe('url(#gradient-1)');
      expect(getGradientColor(2)).toBe('url(#gradient-2)');
    });

    it('cycles through gradients when index exceeds available gradients', () => {
      expect(getGradientColor(10)).toBe('url(#gradient-0)'); // Should cycle back to first gradient
      expect(getGradientColor(11)).toBe('url(#gradient-1)'); // Second gradient
    });

    it('handles negative index', () => {
      expect(getGradientColor(-1)).toBe('url(#gradient-0)'); // Should return first gradient
    });
  });

  describe('getStatusColor', () => {
    it('returns correct colors for different statuses', () => {
      expect(getStatusColor('success')).toBe('#10b981'); // emerald-500
      expect(getStatusColor('warning')).toBe('#f59e0b'); // amber-500
      expect(getStatusColor('error')).toBe('#ef4444'); // red-500
      expect(getStatusColor('info')).toBe('#3b82f6'); // blue-500
    });

    it('returns default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('#6b7280'); // gray-500
      expect(getStatusColor('')).toBe('#6b7280'); // gray-500
    });

    it('handles case-insensitive status', () => {
      expect(getStatusColor('SUCCESS')).toBe('#10b981');
      expect(getStatusColor('Warning')).toBe('#f59e0b');
      expect(getStatusColor('ERROR')).toBe('#ef4444');
      expect(getStatusColor('Info')).toBe('#3b82f6');
    });

    it('handles null and undefined status', () => {
      expect(getStatusColor(null as any)).toBe('#6b7280');
      expect(getStatusColor(undefined as any)).toBe('#6b7280');
    });
  });

  describe('Color Consistency', () => {
    it('maintains consistent color mapping', () => {
      // Test that the same index always returns the same color
      for (let i = 0; i < 20; i++) {
        const color1 = getChartColor(i);
        const color2 = getChartColor(i);
        expect(color1).toBe(color2);
      }
    });

    it('maintains consistent gradient mapping', () => {
      // Test that the same index always returns the same gradient
      for (let i = 0; i < 20; i++) {
        const gradient1 = getGradientColor(i);
        const gradient2 = getGradientColor(i);
        expect(gradient1).toBe(gradient2);
      }
    });

    it('maintains consistent status color mapping', () => {
      const statuses = ['success', 'warning', 'error', 'info', 'unknown'];
      statuses.forEach(status => {
        const color1 = getStatusColor(status);
        const color2 = getStatusColor(status);
        expect(color1).toBe(color2);
      });
    });
  });

  describe('Performance', () => {
    it('handles large number of color requests efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        getChartColor(i);
        getChartColors(i % 10);
        getGradientColor(i);
        getStatusColor(['success', 'warning', 'error', 'info'][i % 4]);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('handles floating point indices', () => {
      expect(getChartColor(1.5)).toBe('#10b981'); // Should floor to 1
      expect(getChartColor(2.9)).toBe('#f59e0b'); // Should floor to 2
    });

    it('handles very large numbers', () => {
      expect(getChartColor(Number.MAX_SAFE_INTEGER)).toBe('#3b82f6'); // Should cycle back
      expect(getChartColor(Number.MAX_VALUE)).toBe('#3b82f6'); // Should cycle back
    });

    it('handles NaN and Infinity', () => {
      expect(getChartColor(NaN)).toBe('#3b82f6'); // Should return first color
      expect(getChartColor(Infinity)).toBe('#3b82f6'); // Should return first color
      expect(getChartColor(-Infinity)).toBe('#3b82f6'); // Should return first color
    });

    it('handles string indices', () => {
      // @ts-ignore - Testing runtime behavior
      expect(getChartColor('0')).toBe('#3b82f6');
      // @ts-ignore - Testing runtime behavior
      expect(getChartColor('1')).toBe('#10b981');
      // @ts-ignore - Testing runtime behavior
      expect(getChartColor('invalid')).toBe('#3b82f6');
    });
  });
});
