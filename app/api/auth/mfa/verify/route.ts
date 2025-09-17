import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { verifyMFAToken, enableMFA } from "@/lib/mfa"
import { z } from "zod"

const verifySchema = z.object({
  token: z.string().min(6).max(8),
  enable: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token, enable } = verifySchema.parse(body)

    // Verify MFA token
    const verification = await verifyMFAToken(session.user.id, token)
    
    if (!verification.isValid) {
      return NextResponse.json(
        { error: "Invalid MFA token" },
        { status: 400 }
      )
    }

    // Enable MFA if requested
    if (enable) {
      const enabled = await enableMFA(session.user.id, token)
      if (!enabled) {
        return NextResponse.json(
          { error: "Failed to enable MFA" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        isBackupCode: verification.isBackupCode
      }
    })
  } catch (error) {
    console.error('MFA verify error:', error)
    return NextResponse.json(
      { error: "Failed to verify MFA token" },
      { status: 500 }
    )
  }
}