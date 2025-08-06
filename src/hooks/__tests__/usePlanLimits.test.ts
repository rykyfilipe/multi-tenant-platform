import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePlanLimits } from '../usePlanLimits';
import { PLAN_LIMITS } from '@/lib/planConstants';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

const mockUseSession = vi.mocked(require('next-auth/react').useSession);

describe('usePlanLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state when no session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.currentPlan).toBe('Starter');
      expect(result.current.planLimits).toEqual(PLAN_LIMITS.Starter);
      expect(result.current.currentCounts).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it('should return initial state when session exists but no user id', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: null },
          subscription: { plan: 'Pro' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.currentPlan).toBe('Pro');
      expect(result.current.planLimits).toEqual(PLAN_LIMITS.Pro);
      expect(result.current.currentCounts).toBeNull();
      expect(result.current.loading).toBe(true);
    });
  });

  describe('session with user id', () => {
    it('should fetch limits when session has user id', async () => {
      const mockSession = {
        user: { id: 'user123' },
        subscription: { plan: 'Business' },
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      const mockResponse = {
        databases: 5,
        tables: 20,
        users: 8,
        apiTokens: 3,
        publicTables: 1,
        storage: 512,
        rows: 50000,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(fetch).toHaveBeenCalledWith('/api/user/limits');
      expect(result.current.currentCounts).toEqual(mockResponse);
      expect(result.current.currentPlan).toBe('Business');
      expect(result.current.planLimits).toEqual(PLAN_LIMITS.Business);
    });

    it('should handle fetch error gracefully', async () => {
      const mockSession = {
        user: { id: 'user123' },
        subscription: { plan: 'Pro' },
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching limits:', expect.any(Error));
      expect(result.current.currentCounts).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should handle non-ok response', async () => {
      const mockSession = {
        user: { id: 'user123' },
        subscription: { plan: 'Starter' },
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentCounts).toBeNull();
    });
  });

  describe('checkLimit function', () => {
    it('should check database limit correctly', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Pro' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      // Set current counts manually for testing
      result.current.currentCounts = {
        databases: 3,
        tables: 15,
        users: 5,
        apiTokens: 2,
        publicTables: 1,
        storage: 256,
        rows: 25000,
      };

      const check = result.current.checkLimit('databases');

      expect(check).toEqual({
        allowed: true,
        limit: 5,
        current: 3,
      });
    });

    it('should check table limit when at limit', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Starter' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      result.current.currentCounts = {
        databases: 1,
        tables: 5,
        users: 2,
        apiTokens: 1,
        publicTables: 0,
        storage: 50,
        rows: 5000,
      };

      const check = result.current.checkLimit('tables');

      expect(check).toEqual({
        allowed: false,
        limit: 5,
        current: 5,
      });
    });

    it('should handle null currentCounts', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Pro' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      const check = result.current.checkLimit('users');

      expect(check).toEqual({
        allowed: true,
        limit: 10,
        current: 0,
      });
    });

    it('should check all limit types', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Business' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      result.current.currentCounts = {
        databases: 10,
        tables: 50,
        users: 20,
        apiTokens: 5,
        publicTables: 3,
        storage: 2048,
        rows: 200000,
      };

      const limitTypes: Array<keyof typeof PLAN_LIMITS.Business> = [
        'databases',
        'tables',
        'users',
        'apiTokens',
        'publicTables',
        'storage',
        'rows',
      ];

      limitTypes.forEach(limitType => {
        const check = result.current.checkLimit(limitType);
        expect(check).toHaveProperty('allowed');
        expect(check).toHaveProperty('limit');
        expect(check).toHaveProperty('current');
        expect(typeof check.allowed).toBe('boolean');
        expect(typeof check.limit).toBe('number');
        expect(typeof check.current).toBe('number');
      });
    });
  });

  describe('isAtLimit function', () => {
    it('should return true when at limit', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Starter' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      result.current.currentCounts = {
        databases: 1,
        tables: 5,
        users: 2,
        apiTokens: 1,
        publicTables: 0,
        storage: 100,
        rows: 10000,
      };

      expect(result.current.isAtLimit('databases')).toBe(true);
      expect(result.current.isAtLimit('tables')).toBe(true);
      expect(result.current.isAtLimit('users')).toBe(true);
      expect(result.current.isAtLimit('apiTokens')).toBe(true);
    });

    it('should return false when below limit', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Pro' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      result.current.currentCounts = {
        databases: 2,
        tables: 10,
        users: 5,
        apiTokens: 2,
        publicTables: 1,
        storage: 512,
        rows: 50000,
      };

      expect(result.current.isAtLimit('databases')).toBe(false);
      expect(result.current.isAtLimit('tables')).toBe(false);
      expect(result.current.isAtLimit('users')).toBe(false);
      expect(result.current.isAtLimit('apiTokens')).toBe(false);
    });

    it('should handle null currentCounts', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Starter' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.isAtLimit('databases')).toBe(false);
      expect(result.current.isAtLimit('tables')).toBe(false);
    });

    it('should return true when over limit', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Starter' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      result.current.currentCounts = {
        databases: 2, // Over limit of 1
        tables: 6, // Over limit of 5
        users: 3, // Over limit of 2
        apiTokens: 2, // Over limit of 1
        publicTables: 1, // Over limit of 0
        storage: 150, // Over limit of 100
        rows: 15000, // Over limit of 10000
      };

      expect(result.current.isAtLimit('databases')).toBe(true);
      expect(result.current.isAtLimit('tables')).toBe(true);
      expect(result.current.isAtLimit('users')).toBe(true);
      expect(result.current.isAtLimit('apiTokens')).toBe(true);
      expect(result.current.isAtLimit('publicTables')).toBe(true);
      expect(result.current.isAtLimit('storage')).toBe(true);
      expect(result.current.isAtLimit('rows')).toBe(true);
    });
  });

  describe('getUsagePercentage function', () => {
    it('should calculate correct percentage', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Pro' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      result.current.currentCounts = {
        databases: 2,
        tables: 10,
        users: 5,
        apiTokens: 2,
        publicTables: 1,
        storage: 512,
        rows: 50000,
      };

      expect(result.current.getUsagePercentage('databases')).toBe(40); // 2/5 * 100
      expect(result.current.getUsagePercentage('tables')).toBe(40); // 10/25 * 100
      expect(result.current.getUsagePercentage('users')).toBe(50); // 5/10 * 100
      expect(result.current.getUsagePercentage('apiTokens')).toBe(40); // 2/5 * 100
      expect(result.current.getUsagePercentage('publicTables')).toBe(50); // 1/2 * 100
      expect(result.current.getUsagePercentage('storage')).toBe(50); // 512/1024 * 100
      expect(result.current.getUsagePercentage('rows')).toBe(50); // 50000/100000 * 100
    });

    it('should return 0 when limit is 0', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Starter' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      result.current.currentCounts = {
        databases: 1,
        tables: 5,
        users: 2,
        apiTokens: 1,
        publicTables: 0,
        storage: 100,
        rows: 10000,
      };

      // This would be a hypothetical case where limit is 0
      // For publicTables, limit is 0, so percentage should be 0
      expect(result.current.getUsagePercentage('publicTables')).toBe(0);
    });

    it('should handle null currentCounts', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Pro' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.getUsagePercentage('databases')).toBe(0);
      expect(result.current.getUsagePercentage('tables')).toBe(0);
    });

    it('should handle over-limit percentages', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Starter' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      result.current.currentCounts = {
        databases: 2, // Over limit of 1
        tables: 10, // Over limit of 5
        users: 4, // Over limit of 2
        apiTokens: 2, // Over limit of 1
        publicTables: 1, // Over limit of 0
        storage: 200, // Over limit of 100
        rows: 20000, // Over limit of 10000
      };

      expect(result.current.getUsagePercentage('databases')).toBe(200); // 2/1 * 100
      expect(result.current.getUsagePercentage('tables')).toBe(200); // 10/5 * 100
      expect(result.current.getUsagePercentage('users')).toBe(200); // 4/2 * 100
      expect(result.current.getUsagePercentage('apiTokens')).toBe(200); // 2/1 * 100
      expect(result.current.getUsagePercentage('storage')).toBe(200); // 200/100 * 100
      expect(result.current.getUsagePercentage('rows')).toBe(200); // 20000/10000 * 100
    });
  });

  describe('plan variations', () => {
    it('should handle Starter plan', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Starter' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.currentPlan).toBe('Starter');
      expect(result.current.planLimits).toEqual(PLAN_LIMITS.Starter);
    });

    it('should handle Pro plan', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Pro' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.currentPlan).toBe('Pro');
      expect(result.current.planLimits).toEqual(PLAN_LIMITS.Pro);
    });

    it('should handle Business plan', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Business' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.currentPlan).toBe('Business');
      expect(result.current.planLimits).toEqual(PLAN_LIMITS.Business);
    });

    it('should handle unknown plan', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Unknown' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.currentPlan).toBe('Unknown');
      expect(result.current.planLimits).toEqual(PLAN_LIMITS.Starter); // Falls back to Starter
    });

    it('should handle null subscription', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: null,
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.currentPlan).toBe('Starter');
      expect(result.current.planLimits).toEqual(PLAN_LIMITS.Starter);
    });

    it('should handle undefined subscription', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.currentPlan).toBe('Starter');
      expect(result.current.planLimits).toEqual(PLAN_LIMITS.Starter);
    });
  });

  describe('effect dependencies', () => {
    it('should refetch when user id changes', async () => {
      const mockSession1 = {
        user: { id: 'user123' },
        subscription: { plan: 'Pro' },
      };

      const mockSession2 = {
        user: { id: 'user456' },
        subscription: { plan: 'Business' },
      };

      mockUseSession.mockReturnValue({
        data: mockSession1,
        status: 'authenticated',
      });

      const { rerender } = renderHook(() => usePlanLimits());

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ databases: 1 }),
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Change user id
      mockUseSession.mockReturnValue({
        data: mockSession2,
        status: 'authenticated',
      });

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ databases: 2 }),
      });

      rerender();

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should not fetch when user id is null', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: null },
          subscription: { plan: 'Pro' },
        },
        status: 'authenticated',
      });

      renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('return value structure', () => {
    it('should return all expected properties', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: 'user123' },
          subscription: { plan: 'Pro' },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => usePlanLimits());

      expect(result.current).toHaveProperty('currentPlan');
      expect(result.current).toHaveProperty('planLimits');
      expect(result.current).toHaveProperty('currentCounts');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('checkLimit');
      expect(result.current).toHaveProperty('isAtLimit');
      expect(result.current).toHaveProperty('getUsagePercentage');

      expect(typeof result.current.currentPlan).toBe('string');
      expect(typeof result.current.planLimits).toBe('object');
      expect(typeof result.current.loading).toBe('boolean');
      expect(typeof result.current.checkLimit).toBe('function');
      expect(typeof result.current.isAtLimit).toBe('function');
      expect(typeof result.current.getUsagePercentage).toBe('function');
    });
  });
}); 