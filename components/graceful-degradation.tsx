"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Wifi, WifiOff, RefreshCw, Server, Database, Cloud } from "lucide-react"

interface GracefulDegradationProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error) => void
  retryAttempts?: number
  retryDelay?: number
}

interface DegradationState {
  hasError: boolean
  error?: Error
  retryCount: number
  isRetrying: boolean
  lastErrorTime?: number
}

export function GracefulDegradation({
  children,
  fallback,
  onError,
  retryAttempts = 3,
  retryDelay = 1000,
}: GracefulDegradationProps) {
  const [state, setState] = useState<DegradationState>({
    hasError: false,
    retryCount: 0,
    isRetrying: false,
  })

  const handleError = (error: Error) => {
    setState(prev => ({
      ...prev,
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    }))
    
    onError?.(error)
  }

  const retry = async () => {
    if (state.retryCount >= retryAttempts) {
      return
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }))

    try {
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      
      // Reset error state
      setState(prev => ({
        ...prev,
        hasError: false,
        error: undefined,
        isRetrying: false,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRetrying: false,
      }))
    }
  }

  const reset = () => {
    setState({
      hasError: false,
      error: undefined,
      retryCount: 0,
      isRetrying: false,
      lastErrorTime: undefined,
    })
  }

  if (state.hasError && state.error) {
    if (fallback) {
      const FallbackComponent = fallback
      return <FallbackComponent error={state.error} retry={retry} />
    }

    return <DefaultFallback error={state.error} retry={retry} reset={reset} state={state} />
  }

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  )
}

interface DefaultFallbackProps {
  error: Error
  retry: () => void
  reset: () => void
  state: DegradationState
}

function DefaultFallback({ error, retry, reset, state }: DefaultFallbackProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isServerError = error.message.includes('500') || error.message.includes('server')
  const isDatabaseError = error.message.includes('database') || error.message.includes('connection')
  const isApiError = error.message.includes('API') || error.message.includes('endpoint')

  const getErrorIcon = () => {
    if (isNetworkError) return <WifiOff className="w-8 h-8 text-orange-500" />
    if (isServerError) return <Server className="w-8 h-8 text-red-500" />
    if (isDatabaseError) return <Database className="w-8 h-8 text-purple-500" />
    if (isApiError) return <Cloud className="w-8 h-8 text-blue-500" />
    return <AlertTriangle className="w-8 h-8 text-red-500" />
  }

  const getErrorTitle = () => {
    if (isNetworkError) return "Connection Lost"
    if (isServerError) return "Server Unavailable"
    if (isDatabaseError) return "Database Connection Error"
    if (isApiError) return "Service Temporarily Unavailable"
    return "Something Went Wrong"
  }

  const getErrorDescription = () => {
    if (isNetworkError) return "We're having trouble connecting to our servers. Please check your internet connection."
    if (isServerError) return "Our servers are experiencing issues. We're working to resolve this quickly."
    if (isDatabaseError) return "We're experiencing database connectivity issues. Please try again in a moment."
    if (isApiError) return "The service you're trying to access is temporarily unavailable."
    return "An unexpected error occurred. Our team has been notified."
  }

  const canRetry = state.retryCount < 3
  const timeSinceLastError = state.lastErrorTime ? Date.now() - state.lastErrorTime : 0
  const shouldShowRetry = timeSinceLastError > 5000 // Show retry after 5 seconds

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            {getErrorIcon()}
          </div>
          <CardTitle className="text-xl">{getErrorTitle()}</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            {getErrorDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm font-medium text-gray-800">Debug Info:</p>
              <p className="text-xs text-gray-700 mt-1 font-mono break-all">
                {error.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Retry attempts: {state.retryCount}/{3}
              </p>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            {canRetry && shouldShowRetry && (
              <Button 
                onClick={retry} 
                disabled={state.isRetrying}
                className="w-full"
              >
                {state.isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            )}
            
            <Button variant="outline" onClick={reset} className="w-full">
              Reset
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Beauty Crafter by Kryst Investments LLC
            </p>
            {!canRetry && (
              <p className="text-xs text-orange-600 mt-1">
                Maximum retry attempts reached. Please refresh the page.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Network status monitoring
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const checkConnectionSpeed = async () => {
      try {
        const start = performance.now()
        await fetch('/api/health/lightweight', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        const end = performance.now()
        const responseTime = end - start
        
        setIsSlow(responseTime > 2000) // Consider slow if > 2 seconds
      } catch (error) {
        setIsSlow(true)
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Check connection speed every 30 seconds
    const interval = setInterval(checkConnectionSpeed, 30000)
    
    // Initial check
    updateOnlineStatus()
    checkConnectionSpeed()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      clearInterval(interval)
    }
  }, [])

  return { isOnline, isSlow }
}

// Offline indicator component
export function OfflineIndicator() {
  const { isOnline, isSlow } = useNetworkStatus()

  if (isOnline && !isSlow) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center space-x-2">
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">You're offline</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="ml-2"
                >
                  Retry Connection
                </Button>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">Slow Connection</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Error boundary wrapper
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    if (this.state.hasError) {
      return null // Let the parent handle the error
    }

    return this.props.children
  }
}
