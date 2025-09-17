'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Activity, Server, Database, Clock } from 'lucide-react'

interface PerformanceData {
  status: string
  timestamp: string
  uptime: number
  version: string
  environment: string
  performance: {
    memory: {
      used: number
      total: number
      rss: number
    }
    cpu: {
      cores: number
      loadAverage: number
      usage: number
    }
    responseTime: number
  }
  cache: {
    total: number
    active: number
    expired: number
    hitRate: number
  }
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/performance-optimized', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Performance fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPerformanceLevel = (responseTime: number) => {
    if (responseTime < 100) return { level: 'Excellent', color: 'text-green-600' }
    if (responseTime < 500) return { level: 'Good', color: 'text-yellow-600' }
    if (responseTime < 1000) return { level: 'Fair', color: 'text-orange-600' }
    return { level: 'Poor', color: 'text-red-600' }
  }

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading performance data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Performance Monitoring Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>No performance data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const perfLevel = getPerformanceLevel(data.performance.responseTime)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-gray-600">Real-time system performance monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`} />
              <span className="text-2xl font-bold capitalize">{data.status}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(data.uptime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.responseTime}ms</div>
            <p className={`text-xs ${perfLevel.color}`}>{perfLevel.level}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-sm">
              {data.environment}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">v{data.version}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>Current memory consumption</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>{data.performance.memory.used} MB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${(data.performance.memory.used / data.performance.memory.total) * 100}%` 
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span>{data.performance.memory.total} MB</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>RSS</span>
                <span>{data.performance.memory.rss} MB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CPU Usage</CardTitle>
            <CardDescription>Current CPU utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span>{data.performance.cpu.usage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${data.performance.cpu.usage}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cores</span>
                <span>{data.performance.cpu.cores}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Load Average</span>
                <span>{data.performance.cpu.loadAverage.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Statistics</CardTitle>
          <CardDescription>In-memory cache performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.cache.total}</div>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.cache.active}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data.cache.expired}</div>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{(data.cache.hitRate * 100).toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Hit Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
