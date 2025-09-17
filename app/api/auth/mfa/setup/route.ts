import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateMFASecret } from "@/lib/mfa"
import { z } from "zod"

const setupSchema = z.object({
  userId: z.string().optional()
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
    const { userId } = setupSchema.parse(body)
    
    // Use session user ID or provided userId
    const targetUserId = userId || session.user.id

    // Generate MFA secret
    const mfaData = await generateMFASecret(targetUserId)

    return NextResponse.json({
      success: true,
      data: {
        secret: mfaData.secret,
        qrCodeUrl: mfaData.qrCodeUrl,
        backupCodes: mfaData.backupCodes
      }
    })
  } catch (error) {
    console.error('MFA setup error:', error)
    return NextResponse.json(
      { error: "Failed to setup MFA" },
      { status: 500 }
    )
  }
}