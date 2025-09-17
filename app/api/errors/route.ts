import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logging"

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()

    // Log the error with Beauty Crafter context
    logger.error("Client-side error reported", {
      ...errorData,
      platform: "Beauty Crafter",
      owner: "Kryst Investments LLC",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    })

    // Send to external error tracking service if configured
    if (process.env.ERROR_TRACKING_WEBHOOK) {
      await fetch(process.env.ERROR_TRACKING_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 Beauty Crafter Error Report`,
          attachments: [
            {
              color: "danger",
              fields: [
                { title: "Platform", value: "Beauty Crafter", short: true },
                { title: "Owner", value: "Kryst Investments LLC", short: true },
                { title: "Error", value: errorData.error, short: false },
                { title: "URL", value: errorData.url, short: true },
                { title: "Timestamp", value: errorData.timestamp, short: true },
              ],
            },
          ],
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Failed to process error report", { error: String(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
