"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface SafetyCheckMiddlewareProps {
  children: React.ReactNode
  requireSafetyDisclaimer?: boolean
  redirectTo?: string
}

export function SafetyCheckMiddleware({ 
  children, 
  requireSafetyDisclaimer = true,
  redirectTo = "/booking/safety-disclaimer"
}: SafetyCheckMiddlewareProps) {
  const { data: session, status } = useSession()
  const [hasAcceptedSafety, setHasAcceptedSafety] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSafetyAcceptance = async () => {
      if (status === "loading") return
      
      if (!session?.user || !requireSafetyDisclaimer) {
        setHasAcceptedSafety(true)
        setIsChecking(false)
        return
      }

      try {
        // First check localStorage for immediate response
        const localAcceptance = localStorage.getItem('safety_disclaimer_accepted')
        if (localAcceptance) {
          const acceptance = JSON.parse(localAcceptance)
          const acceptanceDate = new Date(acceptance.timestamp)
          const sixMonthsAgo = new Date()
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
          
          if (acceptanceDate > sixMonthsAgo) {
            setHasAcceptedSafety(true)
            setIsChecking(false)
            return
          }
        }

        // Check server for safety acceptance history
        const response = await fetch('/api/user/safety-acceptance')
        if (response.ok) {
          const data = await response.json()
          if (data.hasRecentAcceptance) {
            setHasAcceptedSafety(true)
            
            // Update localStorage with server data
            if (data.lastAcceptance) {
              localStorage.setItem('safety_disclaimer_accepted', JSON.stringify({
                timestamp: data.lastAcceptance.acceptedAt,
                providerId: data.lastAcceptance.providerId,
                serviceId: data.lastAcceptance.serviceId
              }))
            }
          } else {
            setHasAcceptedSafety(false)
          }
        } else {
          // If server check fails, assume they need to accept
          setHasAcceptedSafety(false)
        }
      } catch (error) {
        console.error('Error checking safety acceptance:', error)
        // On error, require safety acceptance to be safe
        setHasAcceptedSafety(false)
      }

      setIsChecking(false)
    }

    checkSafetyAcceptance()
  }, [session, status, requireSafetyDisclaimer])

  useEffect(() => {
    if (!isChecking && hasAcceptedSafety === false && requireSafetyDisclaimer) {
      // Preserve current URL parameters for return after disclaimer
      const currentUrl = window.location.pathname + window.location.search
      const redirectUrl = `${redirectTo}?return=${encodeURIComponent(currentUrl)}`
      router.push(redirectUrl)
    }
  }, [isChecking, hasAcceptedSafety, requireSafetyDisclaimer, redirectTo, router])

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking safety requirements...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting to safety disclaimer
  if (requireSafetyDisclaimer && hasAcceptedSafety === false) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to safety disclaimer...</p>
        </div>
      </div>
    )
  }

  // Render children if safety check passes
  return <>{children}</>
}

// Hook for checking safety acceptance status
export function useSafetyAcceptance() {
  const [hasAcceptedSafety, setHasAcceptedSafety] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    const checkAcceptance = async () => {
      if (!session?.user) {
        setHasAcceptedSafety(false)
        setIsLoading(false)
        return
      }

      try {
        // Check localStorage first
        const localAcceptance = localStorage.getItem('safety_disclaimer_accepted')
        if (localAcceptance) {
          const acceptance = JSON.parse(localAcceptance)
          const acceptanceDate = new Date(acceptance.timestamp)
          const sixMonthsAgo = new Date()
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
          
          if (acceptanceDate > sixMonthsAgo) {
            setHasAcceptedSafety(true)
            setIsLoading(false)
            return
          }
        }

        // Check server
        const response = await fetch('/api/user/safety-acceptance')
        if (response.ok) {
          const data = await response.json()
          setHasAcceptedSafety(data.hasRecentAcceptance)
        } else {
          setHasAcceptedSafety(false)
        }
      } catch (error) {
        console.error('Error checking safety acceptance:', error)
        setHasAcceptedSafety(false)
      }

      setIsLoading(false)
    }

    checkAcceptance()
  }, [session])

  return { hasAcceptedSafety, isLoading }
}
