import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/components/ui/use-mobile'

const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: width,
  })
}

describe('useIsMobile', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })

  it('should return true when innerWidth is less than 768', () => {
    mockInnerWidth(767)
    mockMatchMedia(false) // matchMedia might not be used if innerWidth is sufficient
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should return false when innerWidth is 768 or greater', () => {
    mockInnerWidth(768)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should return false when innerWidth is much larger', () => {
    mockInnerWidth(1200)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should handle edge case at breakpoint', () => {
    mockInnerWidth(767)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should handle very small screen sizes', () => {
    mockInnerWidth(320)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should handle large desktop screen sizes', () => {
    mockInnerWidth(1920)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should handle tablet screen sizes', () => {
    mockInnerWidth(1024)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should handle small tablet screen sizes', () => {
    mockInnerWidth(768)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should handle medium mobile screen sizes', () => {
    mockInnerWidth(375)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should handle large mobile screen sizes', () => {
    mockInnerWidth(767)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should handle zero width', () => {
    mockInnerWidth(0)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should handle negative width gracefully', () => {
    mockInnerWidth(-100)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should handle very large width', () => {
    mockInnerWidth(9999)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should handle decimal width values', () => {
    mockInnerWidth(767.5)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should handle exact breakpoint value', () => {
    mockInnerWidth(768)
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})
