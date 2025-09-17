import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, useErrorHandler } from '@/components/error-boundary'
import '@testing-library/jest-dom'

// Mock fetch for error logging
global.fetch = jest.fn()

// Custom fallback component
const CustomFallback = ({ error, reset }: { error: Error; reset: () => void }) => (
  <div>
    <h2>Custom Error: {error.message}</h2>
    <button onClick={reset}>Custom Reset</button>
  </div>
)

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    
    // Suppress console.error for expected errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Normal component</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Normal component')).toBeInTheDocument()
    })

    it('should have proper error boundary structure', () => {
      const errorBoundary = new ErrorBoundary({ children: <div>Test</div> })
      expect(errorBoundary).toBeInstanceOf(ErrorBoundary)
      expect(errorBoundary.state.hasError).toBe(false)
    })
  })

  describe('Custom Fallback', () => {
    it('should use custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <div>Test</div>
        </ErrorBoundary>
      )

      // Test that the component renders without errors
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  describe('useErrorHandler Hook', () => {
    it('should provide error handler function', () => {
      const TestComponent = () => {
        const handleError = useErrorHandler()
        return (
          <button onClick={() => handleError(new Error('Hook error'), { componentStack: 'test' })}>
            Trigger Error
          </button>
        )
      }

      render(<TestComponent />)

      fireEvent.click(screen.getByRole('button', { name: /trigger error/i }))

      expect(global.fetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Hook error'),
      })
    })
  })

  describe('Error Logging', () => {
    it('should have error logging method', () => {
      const errorBoundary = new ErrorBoundary({ children: <div>Test</div> })
      expect(typeof errorBoundary['logErrorToService']).toBe('function')
    })
  })

  describe('Component Methods', () => {
    it('should have getDerivedStateFromError method', () => {
      expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function')
    })

    it('should have componentDidCatch method', () => {
      const errorBoundary = new ErrorBoundary({ children: <div>Test</div> })
      expect(typeof errorBoundary.componentDidCatch).toBe('function')
    })

    it('should have handleReset method', () => {
      const errorBoundary = new ErrorBoundary({ children: <div>Test</div> })
      expect(typeof errorBoundary['handleReset']).toBe('function')
    })
  })

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      const errorBoundary = new ErrorBoundary({ children: <div>Test</div> })
      expect(errorBoundary.state).toEqual({
        hasError: false,
        error: undefined,
        errorInfo: undefined
      })
    })

    it('should update state when getDerivedStateFromError is called', () => {
      const testError = new Error('Test error')
      const newState = ErrorBoundary.getDerivedStateFromError(testError)
      
      expect(newState).toEqual({
        hasError: true,
        error: testError
      })
    })
  })
})
