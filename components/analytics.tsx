"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, any>) => void
  }
}

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
        page_path: pathname + searchParams.toString(),
        custom_map: {
          custom_parameter_1: "Beauty Crafter",
          custom_parameter_2: "Kryst Investments LLC",
        },
      })
    }
  }, [pathname, searchParams])

  // Don't load analytics in development
  if (process.env.NODE_ENV === "development") {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
            page_title: document.title,
            page_location: window.location.href,
            custom_map: {
              'custom_parameter_1': 'Beauty Crafter',
              'custom_parameter_2': 'Kryst Investments LLC'
            }
          });
        `}
      </Script>
    </>
  )
}

// Analytics helper functions
export const analytics = {
  track: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, {
        ...parameters,
        platform: "Beauty Crafter",
        owner: "Kryst Investments LLC",
      })
    }

    // Also send to our custom analytics endpoint
    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: eventName,
        properties: parameters,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        platform: "Beauty Crafter",
        owner: "Kryst Investments LLC",
      }),
    }).catch(console.error)
  },

  page: (pageName: string, properties?: Record<string, any>) => {
    analytics.track("page_view", {
      page_name: pageName,
      ...properties,
    })
  },

  booking: (action: string, properties?: Record<string, any>) => {
    analytics.track(`booking_${action}`, {
      category: "booking",
      ...properties,
    })
  },

  provider: (action: string, properties?: Record<string, any>) => {
    analytics.track(`provider_${action}`, {
      category: "provider",
      ...properties,
    })
  },

  search: (query: string, results?: number) => {
    analytics.track("search", {
      search_term: query,
      results_count: results,
      category: "search",
    })
  },
}
