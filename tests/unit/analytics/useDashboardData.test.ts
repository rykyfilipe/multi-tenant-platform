/** @format */

import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useApp } from '@/contexts/AppContext';
import { useSubscription } from '@/hooks/useSubscription';

// Mock dependencies
jest.mock('@/contexts/AppContext');
jest.mock('@/hooks/useSubscription');

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;
const mockUseSubscription = useSubscription as jest.MockedFunction<typeof useSubscription>;

// Mock fetch
global.fetch = jest.fn();

describe('useDashboardData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('returns loading state initially', () => {
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    const { result } = renderHook(() => useDashboardData());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches dashboard data successfully', async () => {
    const mockDatabasesData = [
      { 
        name: 'DB1', 
        tables: [
          { rowsCount: 5000, _count: { rows: 5000 } }
        ],
        _count: { rows: 5000 }
      },
      { 
        name: 'DB2', 
        tables: [
          { rowsCount: 3000, _count: { rows: 3000 } }
        ],
        _count: { rows: 3000 }
      },
    ];

    const mockUsersData = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'Admin' },
    ];

    const mockMemoryData = {
      success: true,
      data: {
        usedMB: 500,
        limitMB: 1000,
        percentage: 50,
        isNearLimit: false,
        isOverLimit: false,
      },
    };

    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDatabasesData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMemoryData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { databases: [] } }),
      });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.stats.totalDatabases).toBe(2);
    expect(result.current.data?.stats.totalTables).toBe(2);
    expect(result.current.data?.stats.totalRows).toBe(8000);
    expect(result.current.error).toBeNull();
  });

  it('handles API errors gracefully', async () => {
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('API Error');
  });

  it('handles HTTP error responses gracefully', async () => {
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Failed to fetch essential dashboard data');
  });

  it('does not fetch data when token is missing', async () => {
    mockUseApp.mockReturnValue({
      token: null,
      tenant: { id: 1 },
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('does not fetch data when tenant is missing', async () => {
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: null,
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('refetches data when token changes', async () => {
    mockUseApp
      .mockReturnValueOnce({
        token: 'token1',
        tenant: { id: 1 },
      } as any)
      .mockReturnValueOnce({
        token: 'token2',
        tenant: { id: 1 },
      } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ // databases response
        ok: true,
        json: async () => mockDatabasesData,
      })
      .mockResolvedValueOnce({ // users response
        ok: true,
        json: async () => mockUsersData,
      })
      .mockResolvedValueOnce({ // memory response
        ok: true,
        json: async () => mockMemoryData,
      })
      .mockResolvedValueOnce({ // real-database-sizes response
        ok: true,
        json: async () => ({ success: true, data: { databases: [] } }),
      })
      .mockResolvedValueOnce({ // databases response
        ok: true,
        json: async () => mockDatabasesData,
      })
      .mockResolvedValueOnce({ // users response
        ok: true,
        json: async () => mockUsersData,
      })
      .mockResolvedValueOnce({ // memory response
        ok: true,
        json: async () => mockMemoryData,
      })
      .mockResolvedValueOnce({ // real-database-sizes response
        ok: true,
        json: async () => ({ success: true, data: { databases: [] } }),
      });

    const { result, rerender } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();

    // Change token
    rerender();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
  });

  it('refetches data when tenant changes', async () => {
    mockUseApp
      .mockReturnValueOnce({
        token: 'test-token',
        tenant: { id: 1 },
      } as any)
      .mockReturnValueOnce({
        token: 'test-token',
        tenant: { id: 2 },
      } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ // databases response
        ok: true,
        json: async () => mockDatabasesData,
      })
      .mockResolvedValueOnce({ // users response
        ok: true,
        json: async () => mockUsersData,
      })
      .mockResolvedValueOnce({ // memory response
        ok: true,
        json: async () => mockMemoryData,
      })
      .mockResolvedValueOnce({ // real-database-sizes response
        ok: true,
        json: async () => ({ success: true, data: { databases: [] } }),
      })
      .mockResolvedValueOnce({ // databases response
        ok: true,
        json: async () => mockDatabasesData,
      })
      .mockResolvedValueOnce({ // users response
        ok: true,
        json: async () => mockUsersData,
      })
      .mockResolvedValueOnce({ // memory response
        ok: true,
        json: async () => mockMemoryData,
      })
      .mockResolvedValueOnce({ // real-database-sizes response
        ok: true,
        json: async () => ({ success: true, data: { databases: [] } }),
      });

    const { result, rerender } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();

    // Change tenant
    rerender();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
  });

  it('handles JSON parsing errors gracefully', async () => {
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ // databases response
        ok: true,
        json: async () => mockDatabasesData,
      })
      .mockResolvedValueOnce({ // users response
        ok: true,
        json: async () => mockUsersData,
      })
      .mockResolvedValueOnce({ // memory response
        ok: true,
        json: async () => {
          throw new Error('JSON Parse Error');
        },
      })
      .mockResolvedValueOnce({ // real-database-sizes response
        ok: true,
        json: async () => ({ success: true, data: { databases: [] } }),
      });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Hook should still return data even if memory fetch fails
    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handles network errors gracefully', async () => {
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network Error');
  });

  it('handles timeout errors gracefully', async () => {
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Request timeout'));

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Request timeout');
  });

  it('cancels previous requests when new request is made', async () => {
    mockUseApp
      .mockReturnValueOnce({
        token: 'test-token',
        tenant: { id: 1 },
      } as any)
      .mockReturnValueOnce({
        token: 'test-token',
        tenant: { id: 1 },
      } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    // First request - slow
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockDatabasesData,
      }), 1000)))
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockUsersData,
      }), 1000)))
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockMemoryData,
      }), 1000)))
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: { databases: [] } }),
      }), 1000)));

    const { result, rerender } = renderHook(() => useDashboardData());

    // Second request - fast
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDatabasesData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMemoryData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { databases: [] } }),
      });

    // Trigger rerender to make new request
    rerender();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
  });

  it('handles empty response data gracefully', async () => {
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ // databases response
        ok: true,
        json: async () => null,
      })
      .mockResolvedValueOnce({ // users response
        ok: true,
        json: async () => null,
      })
      .mockResolvedValueOnce({ // memory response
        ok: true,
        json: async () => null,
      })
      .mockResolvedValueOnce({ // real-database-sizes response
        ok: true,
        json: async () => ({ success: true, data: { databases: [] } }),
      });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Hook should still return data with default values
    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handles malformed response data gracefully', async () => {
    mockUseApp.mockReturnValue({
      token: 'test-token',
      tenant: { id: 1 },
    } as any);

    mockUseSubscription.mockReturnValue({
      subscription: {
        subscriptionPlan: 'Free',
        subscriptionStatus: 'active',
      },
    } as any);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ // databases response
        ok: true,
        json: async () => 'invalid json',
      })
      .mockResolvedValueOnce({ // users response
        ok: true,
        json: async () => 'invalid json',
      })
      .mockResolvedValueOnce({ // memory response
        ok: true,
        json: async () => 'invalid json',
      })
      .mockResolvedValueOnce({ // real-database-sizes response
        ok: true,
        json: async () => ({ success: true, data: { databases: [] } }),
      });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Hook should still return data even with malformed responses
    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
  });
});
