type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  platform: string
  data?: Record<string, any>
}

class Logger {
  private webhookUrl?: string

  constructor() {
    this.webhookUrl = process.env.LOGGING_WEBHOOK_URL
  }

  private async sendToWebhook(entry: LogEntry) {
    if (!this.webhookUrl) return

    try {
      await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      })
    } catch (error) {
      console.error("Failed to send log to webhook:", error)
    }
  }

  private createLogEntry(level: LogLevel, message: string, data?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      platform: "Beauty Crafter",
      data,
    }
  }

  info(message: string, data?: Record<string, any>) {
    const entry = this.createLogEntry("info", message, data)
    console.log(`[INFO] ${entry.timestamp} - ${message}`, data || "")
    this.sendToWebhook(entry)
  }

  warn(message: string, data?: Record<string, any>) {
    const entry = this.createLogEntry("warn", message, data)
    console.warn(`[WARN] ${entry.timestamp} - ${message}`, data || "")
    this.sendToWebhook(entry)
  }

  error(message: string, data?: Record<string, any>) {
    const entry = this.createLogEntry("error", message, data)
    console.error(`[ERROR] ${entry.timestamp} - ${message}`, data || "")
    this.sendToWebhook(entry)
  }

  debug(message: string, data?: Record<string, any>) {
    const entry = this.createLogEntry("debug", message, data)
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${entry.timestamp} - ${message}`, data || "")
    }
    this.sendToWebhook(entry)
  }
}

export const logger = new Logger()

export function createRequestLogger() {
  return {
    logRequest: (request: Request, response?: Response) => {
      logger.info("HTTP Request", {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        status: response?.status,
      })
    },
    logError: (error: Error, context?: Record<string, any>) => {
      logger.error("Application Error", {
        message: error.message,
        stack: error.stack,
        ...context,
      })
    },
  }
}
