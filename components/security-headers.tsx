"use client"

import { useEffect } from "react"

export function SecurityHeaders() {
  useEffect(() => {
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
      "frame-src 'self' https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ")

    // Set CSP meta tag
    const meta = document.createElement("meta")
    meta.httpEquiv = "Content-Security-Policy"
    meta.content = csp
    document.head.appendChild(meta)

    // Additional security measures
    const additionalMetas = [
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      { name: "format-detection", content: "telephone=no" },
      { name: "msapplication-tap-highlight", content: "no" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ]

    additionalMetas.forEach(({ name, content }) => {
      const metaElement = document.createElement("meta")
      metaElement.name = name
      metaElement.content = content
      document.head.appendChild(metaElement)
    })

    // Prevent right-click context menu in production
    if (process.env.NODE_ENV === "production") {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault()
        return false
      }

      document.addEventListener("contextmenu", handleContextMenu)
      return () => document.removeEventListener("contextmenu", handleContextMenu)
    }

    // Additional security meta tags
    const securityMetas = [
      { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
      { httpEquiv: "X-Frame-Options", content: "DENY" },
      { httpEquiv: "X-XSS-Protection", content: "1; mode=block" },
      { httpEquiv: "Permissions-Policy", content: "camera=(), microphone=(), geolocation=(self)" },
    ]

    const metaElements = securityMetas.map((meta) => {
      const element = document.createElement("meta")
      element.httpEquiv = meta.httpEquiv
      element.content = meta.content
      document.head.appendChild(element)
      return element
    })

    // Cleanup function
    return () => {
      document.head.removeChild(meta)
      metaElements.forEach((element) => {
        if (document.head.contains(element)) {
          document.head.removeChild(element)
        }
      })
    }
  }, [])

  return null
}

// Security utility functions
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-$$$$]{10,}$/
  return phoneRegex.test(phone)
}

export const generateNonce = (): string => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

// CSRF Token management
export function useCSRFToken() {
  useEffect(() => {
    // Generate and set CSRF token
    const token = generateCSRFToken()
    document.cookie = `csrf-token=${token}; path=/; secure; samesite=strict`

    // Add to all forms
    const forms = document.querySelectorAll("form")
    forms.forEach((form) => {
      const input = document.createElement("input")
      input.type = "hidden"
      input.name = "csrf-token"
      input.value = token
      form.appendChild(input)
    })
  }, [])
}

function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}
