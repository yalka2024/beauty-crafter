"use client"

import React, { Suspense, lazy, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Loader2, Zap, Clock, HardDrive, Network, Cpu } from "lucide-react"

// Performance monitoring hook
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    networkLatency: 0,
  })

  useEffect(() => {
    const measurePerformance = () => {
      // Measure page load time
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
        setMetrics(prev => ({ ...prev, loadTime }))
      }

      // Measure memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        setMetrics(prev => ({ ...prev, memoryUsage }))
      }

      // Measure network latency
      const measureNetworkLatency = async () => {
        const start = performance.now()
        try {
          await fetch('/api/health/lightweight', { 
            method: 'HEAD',
            cache: 'no-cache'
          })
          const end = performance.now()
          setMetrics(prev => ({ ...prev, networkLatency: end - start }))
        } catch (error) {
          setMetrics(prev => ({ ...prev, networkLatency: -1 }))
        }
      }

      measureNetworkLatency()
    }

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance()
    } else {
      window.addEventListener('load', measurePerformance)
      return () => window.removeEventListener('load', measurePerformance)
    }
  }, [])

  return metrics
}

// Bundle size analyzer component
export function BundleAnalyzer() {
  const [bundleInfo, setBundleInfo] = useState<{
    totalSize: number
    chunkCount: number
    largestChunk: number
    optimizationScore: number
  }>({
    totalSize: 0,
    chunkCount: 0,
    largestChunk: 0,
    optimizationScore: 0,
  })

  useEffect(() => {
    // Analyze bundle information
    const analyzeBundle = () => {
      // This would typically come from webpack bundle analyzer or similar tools
      // For now, we'll simulate with performance marks
      const marks = performance.getEntriesByType('measure')
      const totalSize = marks.reduce((sum, mark) => sum + mark.duration, 0)
      
      setBundleInfo({
        totalSize,
        chunkCount: marks.length,
        largestChunk: Math.max(...marks.map(mark => mark.duration)),
        optimizationScore: Math.max(0, 100 - (totalSize / 1000)), // Simple scoring
      })
    }

    // Analyze after a delay to allow for dynamic imports
    const timer = setTimeout(analyzeBundle, 2000)
    return () => clearTimeout(timer)
  }, [])

  const getOptimizationColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5" />
          <span>Bundle Analysis</span>
        </CardTitle>
        <CardDescription>
          Performance metrics and optimization insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Size</p>
            <p className="text-2xl font-bold">{bundleInfo.totalSize.toFixed(1)}ms</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Chunks</p>
            <p className="text-2xl font-bold">{bundleInfo.chunkCount}</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Optimization Score</p>
          <div className="flex items-center space-x-2">
            <Progress value={bundleInfo.optimizationScore} className="flex-1" />
            <span className={`text-sm font-bold ${getOptimizationColor(bundleInfo.optimizationScore)}`}>
              {bundleInfo.optimizationScore.toFixed(0)}%
            </span>
          </div>
        </div>

        {bundleInfo.optimizationScore < 70 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Consider code splitting and lazy loading to improve performance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Lazy loading wrapper with fallback
export function LazyLoader<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc)
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <DefaultFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Default loading fallback
function DefaultFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

// Performance dashboard component
export function PerformanceDashboard() {
  const metrics = usePerformanceMetrics()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show dashboard after 3 seconds
    const timer = setTimeout(() => setIsVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Load Time</span>
            </span>
            <span className="font-mono">{metrics.loadTime}ms</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-1">
              <Network className="w-3 h-3" />
              <span>Latency</span>
            </span>
            <span className="font-mono">
              {metrics.networkLatency > 0 ? `${metrics.networkLatency.toFixed(0)}ms` : 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-1">
              <Cpu className="w-3 h-3" />
              <span>Memory</span>
            </span>
            <span className="font-mono">
              {metrics.memoryUsage > 0 ? `${(metrics.memoryUsage * 100).toFixed(1)}%` : 'N/A'}
            </span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setIsVisible(false)}
          >
            Hide
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Image optimization component
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  ...props
}: {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  [key: string]: any
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => setIsLoaded(true)
  const handleError = () => setHasError(true)

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Image failed to load</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
    </div>
  )
}

// Code splitting utility
export function createLazyRoute(importFunc: () => Promise<any>) {
  return LazyLoader(importFunc, <RouteFallback />)
}

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
        <h2 className="text-xl font-semibold mb-2">Loading Page</h2>
        <p className="text-gray-600">Please wait while we load the content...</p>
      </div>
    </div>
  )
}

// Performance monitoring service
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
    
    // Keep only last 100 values
    if (this.metrics.get(name)!.length > 100) {
      this.metrics.get(name)!.shift()
    }
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return 0
    
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  getMetrics(): Record<string, number[]> {
    const result: Record<string, number[]> = {}
    this.metrics.forEach((values, key) => {
      result[key] = [...values]
    })
    return result
  }

  clearMetrics(): void {
    this.metrics.clear()
  }
}
