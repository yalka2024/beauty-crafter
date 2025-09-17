import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logging"

export async function POST(request: NextRequest) {
  try {
    const analyticsData = await request.json()

    // Log analytics event with Beauty Crafter context
    logger.info("Analytics event tracked", {
      ...analyticsData,
      platform: "Beauty Crafter",
      owner: "Kryst Investments LLC",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    })

    // Send to analytics service if configured
    if (process.env.ANALYTICS_WEBHOOK_URL) {
      await fetch(process.env.ANALYTICS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...analyticsData,
          platform: "Beauty Crafter",
          owner: "Kryst Investments LLC",
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Failed to process analytics event", { error: String(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
