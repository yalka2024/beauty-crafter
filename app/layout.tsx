import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@/components/analytics"
import { ErrorBoundary } from "@/components/error-boundary"
import { SecurityHeaders } from "@/components/security-headers"
import { GracefulDegradation } from "@/components/graceful-degradation"
import { AccessibilityProvider } from "@/components/accessibility"
import { OfflineIndicator } from "@/components/graceful-degradation"
import { PerformanceDashboard } from "@/components/performance-optimizer"
import { AccessibilityToolbar } from "@/components/accessibility"
import { SkipLink } from "@/components/accessibility"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Beauty Crafter - Professional Beauty Services Platform",
  description: "Connect with licensed beauty professionals for premium services. Book appointments, manage services, and grow your beauty business with our comprehensive platform.",
  keywords: [
    "beauty services",
    "beauty professionals",
    "appointment booking",
    "beauty platform",
    "licensed professionals",
    "beauty business",
    "cosmetic services",
    "spa services",
    "hair services",
    "nail services",
    "skincare services",
    "beauty appointments",
    "professional beauty",
    "beauty marketplace",
    "beauty scheduling"
  ],
  authors: [{ name: "Kryst Investments LLC" }],
  creator: "Kryst Investments LLC",
  publisher: "Kryst Investments LLC",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://beautycrafter.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://beautycrafter.com",
    title: "Beauty Crafter - Professional Beauty Services Platform",
    description: "Connect with licensed beauty professionals for premium services. Book appointments, manage services, and grow your beauty business with our comprehensive platform.",
    siteName: "Beauty Crafter",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Beauty Crafter Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beauty Crafter - Professional Beauty Services Platform",
    description: "Connect with licensed beauty professionals for premium services. Book appointments, manage services, and grow your beauty business with our comprehensive platform.",
    images: ["/og-image.jpg"],
    creator: "@beautycrafter",
    site: "@beautycrafter",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
    yandex: process.env.YANDEX_VERIFICATION_ID,
    yahoo: process.env.YAHOO_VERIFICATION_ID,
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <SecurityHeaders />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Beauty Crafter" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Accessibility meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="color-scheme" content="light dark" />
        
        {/* Performance meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        
        {/* Security meta tags */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="x-dns-prefetch-control" content="on" />
      </head>
      <body className={inter.className}>
        <SkipLink />
        
        <AccessibilityProvider>
          <ErrorBoundary>
            <GracefulDegradation>
              <Suspense fallback={null}>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                  <div className="min-h-screen flex flex-col">
                    <MainNav />
                    <main id="main-content" className="flex-1">
                      {children}
                    </main>
                    <Footer />
                  </div>
                  <Toaster />
                  <Analytics />
                  
                  {/* Accessibility and Performance Components */}
                  <AccessibilityToolbar />
                  <PerformanceDashboard />
                  <OfflineIndicator />
                </ThemeProvider>
              </Suspense>
            </GracefulDegradation>
          </ErrorBoundary>
        </AccessibilityProvider>
      </body>
    </html>
  )
}
