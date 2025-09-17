import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { withAPIVersioning, VersionedResponse } from "@/lib/api-versioning"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mfaToken: z.string().optional()
})

async function handleLogin(request: VersionedRequest) {
  try {
    const body = await request.json()
    const { email, password, mfaToken } = loginSchema.parse(body)

    // Use NextAuth for authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return VersionedResponse.error(
        "Invalid credentials",
        "INVALID_CREDENTIALS",
        401,
        request.apiVersion
      )
    }

    // Check if MFA is required
    if (session.user.mfaEnabled && !mfaToken) {
      return VersionedResponse.error(
        "MFA token required",
        "MFA_REQUIRED",
        401,
        request.apiVersion
      )
    }

    return VersionedResponse.success(
      {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          status: session.user.status,
          mfaEnabled: session.user.mfaEnabled
        },
        session: {
          expires: session.expires
        }
      },
      "Login successful",
      200,
      request.apiVersion
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return VersionedResponse.error(
        "Invalid input data",
        "VALIDATION_ERROR",
        400,
        request.apiVersion
      )
    }

    if (error instanceof Error && error.message === "MFA_REQUIRED") {
      return VersionedResponse.error(
        "MFA token required",
        "MFA_REQUIRED",
        401,
        request.apiVersion
      )
    }

    if (error instanceof Error && error.message === "INVALID_MFA_TOKEN") {
      return VersionedResponse.error(
        "Invalid MFA token",
        "INVALID_MFA_TOKEN",
        401,
        request.apiVersion
      )
    }

    return VersionedResponse.error(
      "Login failed",
      "LOGIN_ERROR",
      500,
      request.apiVersion
    )
  }
}

export const POST = withAPIVersioning(handleLogin)

