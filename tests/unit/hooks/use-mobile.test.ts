import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/hooks/use-mobile'

// Mock window.matchMedia
const mockMatchMedia = jest.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
})

describe('useIsMobile', () => {
  let mockMediaQueryList: {
    addEventListener: jest.Mock
    removeEventListener: jest.Mock
    matches: boolean
  }

  beforeEach(() => {
    mockMediaQueryList = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      matches: false,
    }
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return false for desktop width', () => {
    window.innerWidth = 1024
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })

  it('should return true for mobile width', () => {
    window.innerWidth = 600
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('should return true for tablet width', () => {
    window.innerWidth = 700
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('should return false for exactly breakpoint width', () => {
    window.innerWidth = 768
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('should add and remove event listeners', () => {
    const { unmount } = renderHook(() => useIsMobile())

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    unmount()

    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should update when media query changes', () => {
    window.innerWidth = 1024
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    // Simulate media query change
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1]
    
    act(() => {
      window.innerWidth = 600
      changeHandler()
    })

    expect(result.current).toBe(true)
  })

  it('should handle multiple media query changes', () => {
    window.innerWidth = 1024
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1]
    
    // Change to mobile
    act(() => {
      window.innerWidth = 600
      changeHandler()
    })
    expect(result.current).toBe(true)

    // Change back to desktop
    act(() => {
      window.innerWidth = 1024
      changeHandler()
    })
    expect(result.current).toBe(false)
  })

  it('should use correct breakpoint constant', () => {
    renderHook(() => useIsMobile())
    
    // Should use 767px (768 - 1)
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })

  it('should handle edge case widths', () => {
    // Test exactly at breakpoint - 1
    window.innerWidth = 767
    const { result: result1 } = renderHook(() => useIsMobile())
    expect(result1.current).toBe(true)

    // Test exactly at breakpoint
    window.innerWidth = 768
    const { result: result2 } = renderHook(() => useIsMobile())
    expect(result2.current).toBe(false)

    // Test very small width
    window.innerWidth = 320
    const { result: result3 } = renderHook(() => useIsMobile())
    expect(result3.current).toBe(true)

    // Test very large width
    window.innerWidth = 1920
    const { result: result4 } = renderHook(() => useIsMobile())
    expect(result4.current).toBe(false)
  })
})
