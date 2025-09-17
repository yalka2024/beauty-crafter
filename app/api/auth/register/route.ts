import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { encryption } from "@/lib/encryption"

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  password: z.string().min(8).max(100),
  role: z.enum(["CLIENT", "PROVIDER"]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, email, phone, password, role } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Encrypt sensitive data
    const encryptedEmail = await encryption.encryptField(email)
    const encryptedPhone = await encryption.encryptField(phone)
    const encryptedName = await encryption.encryptField(name)

    // Create user and related profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: encryptedName,
          email: encryptedEmail,
          phone: encryptedPhone,
          password: hashedPassword,
          role,
          status: "ACTIVE",
        },
      })

      // Create role-specific profile
      if (role === "CLIENT") {
        await tx.client.create({
          data: {
            userId: user.id,
            preferences: {},
            medicalConditions: [],
            allergies: [],
          },
        })
      } else if (role === "PROVIDER") {
        await tx.provider.create({
          data: {
            userId: user.id,
            providerType: [],
            businessName: null,
            businessLicense: null,
            yearsOfExperience: null,
            specialties: [],
            bio: null,
            hourlyRate: 0,
            travelRadius: null,
            acceptsHomeService: true,
            acceptsSalonService: true,
            isAvailable: false, // Providers need to complete onboarding first
            rating: 0,
            totalReviews: 0,
            completedServices: 0,
          },
        })
      }

      return user
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Registration failed", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 