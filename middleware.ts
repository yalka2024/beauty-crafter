import { type NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { verifyCSRF } from "@/lib/csrf"
import { logger } from "@/lib/logging"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)")
  
  // Add Content Security Policy
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com; frame-ancestors 'none';")
  
  // Add HTTP Strict Transport Security
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

  // Custom headers
  response.headers.set("X-Platform", "Beauty Crafter")
  response.headers.set("X-Owner", "Kryst Investments LLC")
  response.headers.set("X-Version", process.env.APP_VERSION || "1.0.0")

  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (!rateLimitResult.success) {
    logger.warn("Rate limit exceeded", {
      ip: request.headers.get("x-forwarded-for") || "unknown",
      path: request.nextUrl.pathname,
      platform: "Beauty Crafter",
    })

    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.reset.toISOString(),
      },
    })
  }

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token")

    // CSRF protection for state-changing requests
    if (request.method === "POST" || request.method === "PUT" || request.method === "DELETE") {
      const csrfValid = await verifyCSRF(request)
      if (!csrfValid) {
        logger.warn("CSRF token validation failed", {
          ip: request.headers.get("x-forwarded-for") || "unknown",
          path: request.nextUrl.pathname,
          platform: "Beauty Crafter",
        })

        return new NextResponse("Forbidden - CSRF token invalid", { status: 403 })
      }
    }
  }

  // Log request
  logger.info("Request processed", {
    method: request.method,
    path: request.nextUrl.pathname,
    ip: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    platform: "Beauty Crafter",
  })

  // Redirect www to non-www
  if (request.headers.get("host")?.startsWith("www.")) {
    const url = request.nextUrl.clone()
    url.host = url.host.replace("www.", "")
    return NextResponse.redirect(url, 301)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)"],
}
