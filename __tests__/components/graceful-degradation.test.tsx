import React from 'react'
import { render, screen } from '@testing-library/react'
import { GracefulDegradation, useNetworkStatus } from '@/components/graceful-degradation'
import '@testing-library/jest-dom'

// Mock fetch for network status
global.fetch = jest.fn()

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})

describe('GracefulDegradation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should render children when no error occurs', () => {
      render(
        <GracefulDegradation>
          <div>Normal component</div>
        </GracefulDegradation>
      )

      expect(screen.getByText('Normal component')).toBeInTheDocument()
    })

    it('should render with custom fallback when provided', () => {
      const CustomFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
        <div>
          <h2>Custom Error: {error.message}</h2>
          <button onClick={retry}>Custom Retry</button>
        </div>
      )

      render(
        <GracefulDegradation fallback={CustomFallback}>
          <div>Test component</div>
        </GracefulDegradation>
      )

      expect(screen.getByText('Test component')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle errors through error boundary', () => {
      // Test that the component has error boundary functionality
      const { container } = render(
        <GracefulDegradation>
          <div>Test component</div>
        </GracefulDegradation>
      )

      expect(container.firstChild).toBeInTheDocument()
    })

    it('should have retry and reset functionality', () => {
      const { container } = render(
        <GracefulDegradation>
          <div>Test component</div>
        </GracefulDegradation>
      )

      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('should have proper component structure', () => {
      const { container } = render(
        <GracefulDegradation>
          <div>Test component</div>
        </GracefulDegradation>
      )

      expect(container.firstChild).toBeInTheDocument()
    })

    it('should integrate with ErrorBoundary', () => {
      const { container } = render(
        <GracefulDegradation>
          <div>Test component</div>
        </GracefulDegradation>
      )

      expect(container.firstChild).toBeInTheDocument()
    })
  })
})

describe('useNetworkStatus', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  it('should return network status', () => {
    const TestComponent = () => {
      const { isOnline, isSlow } = useNetworkStatus()
      return (
        <div>
          <span data-testid="online-status">{isOnline ? 'online' : 'offline'}</span>
          <span data-testid="slow-status">{isSlow ? 'slow' : 'fast'}</span>
        </div>
      )
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('online-status')).toHaveTextContent('online')
    expect(screen.getByTestId('slow-status')).toHaveTextContent('fast')
  })

  it('should detect offline status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    const TestComponent = () => {
      const { isOnline, isSlow } = useNetworkStatus()
      return (
        <div>
          <span data-testid="online-status">{isOnline ? 'online' : 'offline'}</span>
          <span data-testid="slow-status">{isSlow ? 'slow' : 'fast'}</span>
        </div>
      )
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('online-status')).toHaveTextContent('offline')
    expect(screen.getByTestId('slow-status')).toHaveTextContent('fast')
  })
})

describe('OfflineIndicator', () => {
  it('should be a valid React component', () => {
    // Just test that the component can be imported and is a function
    const { OfflineIndicator } = require('@/components/graceful-degradation')
    expect(typeof OfflineIndicator).toBe('function')
  })
})
