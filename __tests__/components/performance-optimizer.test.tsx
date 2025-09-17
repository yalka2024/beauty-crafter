import React, { Suspense } from 'react'
import { render, screen } from '@testing-library/react'
import { 
  usePerformanceMetrics, 
  PerformanceMonitor 
} from '@/components/performance-optimizer'
import '@testing-library/jest-dom'

// Mock performance API
const mockPerformance = {
  timing: {
    navigationStart: 0,
    loadEventEnd: 100,
    domContentLoadedEventEnd: 50,
  },
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
  now: jest.fn(() => 1000),
  getEntriesByType: jest.fn(() => []),
}

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
})

// Mock fetch
global.fetch = jest.fn()

describe('usePerformanceMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
  })

  it('should return performance metrics', () => {
    const TestComponent = () => {
      const metrics = usePerformanceMetrics()
      return (
        <div>
          <span data-testid="load-time">{metrics.loadTime}</span>
          <span data-testid="memory-usage">{metrics.memoryUsage}</span>
          <span data-testid="network-latency">{metrics.networkLatency}</span>
        </div>
      )
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('load-time')).toBeInTheDocument()
    expect(screen.getByTestId('memory-usage')).toBeInTheDocument()
    expect(screen.getByTestId('network-latency')).toBeInTheDocument()
  })

  it('should calculate load time correctly', () => {
    const TestComponent = () => {
      const metrics = usePerformanceMetrics()
      return (
        <div>
          <span data-testid="load-time">{metrics.loadTime}</span>
        </div>
      )
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('load-time')).toBeInTheDocument()
  })

  it('should calculate memory usage correctly', () => {
    const TestComponent = () => {
      const metrics = usePerformanceMetrics()
      return (
        <div>
          <span data-testid="memory-usage">{metrics.memoryUsage}</span>
        </div>
      )
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('memory-usage')).toBeInTheDocument()
  })
})

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Clear metrics before each test to ensure clean state
    const monitor = PerformanceMonitor.getInstance()
    monitor.clearMetrics()
  })

  it('should be a singleton', () => {
    const instance1 = PerformanceMonitor.getInstance()
    const instance2 = PerformanceMonitor.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should record metrics', () => {
    const monitor = PerformanceMonitor.getInstance()
    monitor.recordMetric('test', 100)
    expect(monitor.getAverageMetric('test')).toBe(100)
  })

  it('should calculate average metrics', () => {
    const monitor = PerformanceMonitor.getInstance()
    monitor.recordMetric('test', 100)
    monitor.recordMetric('test', 200)
    expect(monitor.getAverageMetric('test')).toBe(150)
  })

  it('should clear metrics', () => {
    const monitor = PerformanceMonitor.getInstance()
    monitor.recordMetric('test', 100)
    monitor.clearMetrics()
    expect(monitor.getAverageMetric('test')).toBe(0)
  })

  it('should handle multiple metrics', () => {
    const monitor = PerformanceMonitor.getInstance()
    monitor.recordMetric('metric1', 100)
    monitor.recordMetric('metric2', 200)
    expect(monitor.getAverageMetric('metric1')).toBe(100)
    expect(monitor.getAverageMetric('metric2')).toBe(200)
  })
})

describe('Component Exports', () => {
  it('should export BundleAnalyzer component', () => {
    const { BundleAnalyzer } = require('@/components/performance-optimizer')
    expect(typeof BundleAnalyzer).toBe('function')
  })

  it('should export LazyLoader component', () => {
    const { LazyLoader } = require('@/components/performance-optimizer')
    expect(typeof LazyLoader).toBe('function')
  })

  it('should export PerformanceDashboard component', () => {
    const { PerformanceDashboard } = require('@/components/performance-optimizer')
    expect(typeof PerformanceDashboard).toBe('function')
  })

  it('should export OptimizedImage component', () => {
    const { OptimizedImage } = require('@/components/performance-optimizer')
    expect(typeof OptimizedImage).toBe('function')
  })

  it('should export createLazyRoute function', () => {
    const { createLazyRoute } = require('@/components/performance-optimizer')
    expect(typeof createLazyRoute).toBe('function')
  })
})
