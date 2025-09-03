import { renderHook } from '@testing-library/react'
import { useDatabaseRefresh } from '@/hooks/useDatabaseRefresh'

// Mock the DatabaseContext
jest.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: jest.fn()
}))

const mockUseDatabase = require('@/contexts/DatabaseContext').useDatabase

describe('useDatabaseRefresh', () => {
  const mockRefreshSelectedDatabase = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDatabase.mockReturnValue({
      refreshSelectedDatabase: mockRefreshSelectedDatabase
    })
  })

  it('should return refreshAfterChange function', () => {
    const { result } = renderHook(() => useDatabaseRefresh())

    expect(result.current).toHaveProperty('refreshAfterChange')
    expect(typeof result.current.refreshAfterChange).toBe('function')
  })

  it('should call refreshSelectedDatabase when refreshAfterChange is called', async () => {
    mockRefreshSelectedDatabase.mockResolvedValue(undefined)
    
    const { result } = renderHook(() => useDatabaseRefresh())

    await result.current.refreshAfterChange()

    expect(mockRefreshSelectedDatabase).toHaveBeenCalledTimes(1)
  })

  it('should handle errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const error = new Error('Refresh failed')
    mockRefreshSelectedDatabase.mockRejectedValue(error)
    
    const { result } = renderHook(() => useDatabaseRefresh())

    await result.current.refreshAfterChange()

    expect(consoleSpy).toHaveBeenCalledWith('Error refreshing database cache:', error)
    consoleSpy.mockRestore()
  })

  it('should use useCallback to memoize the function', () => {
    const { result, rerender } = renderHook(() => useDatabaseRefresh())

    const firstFunction = result.current.refreshAfterChange

    // Rerender the hook
    rerender()

    const secondFunction = result.current.refreshAfterChange

    // The function should be the same reference due to useCallback
    expect(firstFunction).toBe(secondFunction)
  })

  it('should depend on refreshSelectedDatabase in useCallback', () => {
    const { result, rerender } = renderHook(() => useDatabaseRefresh())

    const firstFunction = result.current.refreshAfterChange

    // Change the mock function
    const newMockRefresh = jest.fn()
    mockUseDatabase.mockReturnValue({
      refreshSelectedDatabase: newMockRefresh
    })

    // Rerender the hook
    rerender()

    const secondFunction = result.current.refreshAfterChange

    // The function should be different due to dependency change
    expect(firstFunction).not.toBe(secondFunction)
  })

  it('should work with different database contexts', () => {
    const mockRefresh1 = jest.fn()
    const mockRefresh2 = jest.fn()

    // First context
    mockUseDatabase.mockReturnValue({
      refreshSelectedDatabase: mockRefresh1
    })

    const { result: result1 } = renderHook(() => useDatabaseRefresh())
    expect(result1.current.refreshAfterChange).toBeDefined()

    // Second context
    mockUseDatabase.mockReturnValue({
      refreshSelectedDatabase: mockRefresh2
    })

    const { result: result2 } = renderHook(() => useDatabaseRefresh())
    expect(result2.current.refreshAfterChange).toBeDefined()

    // Both should be different functions
    expect(result1.current.refreshAfterChange).not.toBe(result2.current.refreshAfterChange)
  })
})
