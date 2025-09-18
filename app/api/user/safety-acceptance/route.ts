import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const safetyAcceptanceSchema = z.object({
  timestamp: z.string(),
  providerId: z.string().optional(),
  serviceId: z.string().optional(),
  userAgent: z.string(),
  ipAddress: z.string()
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = safetyAcceptanceSchema.parse(body)

    // Get client IP address
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Save safety disclaimer acceptance to database
    const safetyAcceptance = await prisma.userSafetyAcceptance.create({
      data: {
        userId: session.user.id,
        acceptedAt: new Date(validatedData.timestamp),
        providerId: validatedData.providerId,
        serviceId: validatedData.serviceId,
        userAgent: validatedData.userAgent,
        ipAddress: clientIp,
        metadata: {
          sessionId: session.user.id,
          browserInfo: validatedData.userAgent,
          acceptanceSource: 'booking_flow'
        }
      }
    })

    return NextResponse.json({
      success: true,
      acceptanceId: safetyAcceptance.id,
      message: "Safety disclaimer acceptance recorded"
    })

  } catch (error) {
    console.error("Error saving safety acceptance:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data format", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to save safety acceptance" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's safety acceptance history
    const acceptances = await prisma.userSafetyAcceptance.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        acceptedAt: 'desc'
      },
      take: 10 // Last 10 acceptances
    })

    // Check if user has accepted safety disclaimer recently (within 6 months)
    const recentAcceptance = acceptances.find(acceptance => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return acceptance.acceptedAt > sixMonthsAgo
    })

    return NextResponse.json({
      success: true,
      hasRecentAcceptance: !!recentAcceptance,
      lastAcceptance: acceptances[0] || null,
      acceptanceHistory: acceptances
    })

  } catch (error) {
    console.error("Error fetching safety acceptances:", error)
    return NextResponse.json(
      { error: "Failed to fetch safety acceptance history" },
      { status: 500 }
    )
  }
}
